import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'
import { getResendClient } from '@/lib/resend'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { syncToMailchimp } from '@/lib/mailchimp'
import { markSold } from '@/lib/markSold'
import { createNumberedOrder } from '@/lib/createOrder'
// Terugval als Shop Settings nog niet is ingevuld. De instelling wint, zodat
// je het adres kunt wijzigen zonder de code aan te raken.
const FROM_FALLBACK   = 'Sander Dekker <hello@mynameissanderdekker.com>'
const NOTIFY_FALLBACK = 'hello@mynameissanderdekker.com'

/** Afzender en notificatieadres uit Shop Settings, met terugval. */
async function mailSettings(sanity: ReturnType<typeof getSanityWriteClient>) {
  try {
    const s = await sanity.fetch<{ fromEmail?: string; orderNotificationEmail?: string } | null>(
      `*[_type == "shopSettings"][0]{ fromEmail, orderNotificationEmail }`
    )
    return {
      // Resend wil een afzender met naam; staat er alleen een adres, dan zetten
      // we die er zelf omheen.
      from: s?.fromEmail ? `Sander Dekker <${s.fromEmail}>` : FROM_FALLBACK,
      notify: s?.orderNotificationEmail || NOTIFY_FALLBACK,
    }
  } catch {
    return { from: FROM_FALLBACK, notify: NOTIFY_FALLBACK }
  }
}

function buildStatusEntry(status: string, note?: string) {
  return {
    _key:      crypto.randomUUID(),
    _type:     'statusHistoryEntry',
    status,
    changedAt: new Date().toISOString(),
    changedBy: 'systeem',
    ...(note ? { note } : {}),
  }
}

export async function POST(req: NextRequest) {
  const sanity = getSanityWriteClient()
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session     = event.data.object as Stripe.Checkout.Session
    const email       = session.customer_details?.email ?? ''
    const name        = session.customer_details?.name ?? ''
    const phone       = session.customer_details?.phone ?? ''
    // In Stripe API 2026-06-24.dahlia, shipping moved to collected_information
    const shipping    = session.collected_information?.shipping_details?.address
    const total       = (session.amount_total ?? 0) / 100
    // Custom fields
    const customFields = session.custom_fields ?? []
    const companyName  = customFields.find(f => f.key === 'company_name')?.text?.value ?? undefined
    const vatNumber    = customFields.find(f => f.key === 'vat_number')?.text?.value ?? undefined
    // Webshop klanten worden automatisch ingeschreven op de nieuwsbrief
    const newsletterOptIn = true

    // Parse items — ondersteun zowel oud formaat (string[]) als nieuw (json met prijs + artworkId)
    let parsedItems: { title: string; price: number; priceExcl?: number; vatRate?: number; quantity: number; artworkId?: string | null; variant?: string }[] = []
    try {
      parsedItems = JSON.parse(session.metadata?.itemsJson ?? '[]')
    } catch {
      const titles = JSON.parse(session.metadata?.items ?? '[]') as string[]
      parsedItems = titles.map(title => ({ title, price: 0, quantity: 1 }))
    }

    // ── Netto en korting ──────────────────────────────────────────────────
    // `totalAmount` is wat de klant betaalt (incl. BTW). Het nettobedrag stond
    // er niet naast, terwijl de verkooptool het wél schrijft: de omzetcijfers
    // lazen `null` voor precies de bestellingen die vanzelf binnenkomen.
    //
    // De korting hoort er ook bij. Stripe trok hem van het betaalbedrag af,
    // maar de order bewaarde alleen de code — de regels telden dus op tot een
    // hoger bedrag dan er betaald was, zonder dat ergens stond waarom.
    const cent = (n: number) => Math.round(n * 100) / 100
    const brutoSubtotaal = parsedItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0)
    const nettoSubtotaal = parsedItems.reduce((s, i) => {
      const netto = i.priceExcl ?? (i.price ?? 0) / (1 + (i.vatRate ?? 9) / 100)
      return s + netto * (i.quantity ?? 1)
    }, 0)
    const couponType = session.metadata?.couponType
    const couponValue = Number(session.metadata?.couponValue ?? 0)
    const brutoKorting = Number(session.metadata?.couponAmount ?? 0)
    // De korting is op het bedrag inclusief BTW berekend; netto is hij naar
    // rato kleiner. Evenredig omrekenen houdt order en factuur gelijk.
    const nettoKorting = brutoKorting > 0 && brutoSubtotaal > 0
      ? cent(brutoKorting * (nettoSubtotaal / brutoSubtotaal))
      : 0
    const totalExcl = cent(nettoSubtotaal - nettoKorting)

    // Hetzelfde nummer als de verkooptool en de offerte gebruiken. Hier stond
    // `SD-${Date.now()}`, dus webshopbestellingen kregen een tijdstempel naast
    // de doorlopende factuurnummering — twee reeksen, waarvan er één niet aan
    // de nummeringseis voldoet.
    // Het nummer wordt bij het aanmaken bepaald (createNumberedOrder), zodat
    // een webshopbestelling en een verkoop in de Studio op hetzelfde moment
    // nooit hetzelfde nummer krijgen. Tot die tijd is het `orderNumber` leeg.
    let orderNumber = ''

    // ── Verhoog coupon usageCount indien gebruikt ─────────────────────────
    const couponSanityId = session.metadata?.couponSanityId
    if (couponSanityId) {
      try {
        await sanity.patch(couponSanityId).inc({ usageCount: 1 }).commit()
      } catch (err) {
        console.error('[webhook] coupon usageCount verhogen mislukt:', err)
      }
    }

    // ── Sla order op in Sanity ────────────────────────────────────────────
    // De koper wordt verderop gevonden of aangemaakt; het id daarvan komt
    // daarna alsnog op deze order te staan.
    let createdOrderId: string | null = null
    try {
      const createdOrder = await createNumberedOrder(sanity, () => ({
        stripeSessionId: session.id,
        // De webhook vuurt pas ná een geslaagde betaling, dus dit is 'paid'.
        status:          'paid',
        channel:         'webshop',
        customerName:    name,
        customerEmail:   email,
        customerPhone:   phone || undefined,
        companyName:     companyName,
        vatNumber:       vatNumber,
        shippingAddress: shipping ? {
          street:     [shipping.line1, shipping.line2].filter(Boolean).join(' '),
          postalCode: shipping.postal_code ?? '',
          city:       shipping.city ?? '',
          country:    shipping.country ?? '',
        } : undefined,
        // Netto, tarief en uitvoering komen mee uit de sessie (create-session
        // bepaalt ze op de server). Zonder `priceExcl` en `vatRate` viel de
        // regel in de BTW-aangifte terug op een benadering; zonder `item`
        // wist de order niet welk werk het was.
        items: parsedItems.map(item => ({
          _key:     crypto.randomUUID(),
          ...(item.artworkId ? { item: { _type: 'reference', _ref: item.artworkId.replace(/^drafts\./, '') } } : {}),
          title:    item.title,
          ...(item.variant ? { variant: item.variant } : {}),
          quantity: item.quantity ?? 1,
          price:    item.price ?? 0,
          ...(item.priceExcl != null ? { priceExcl: item.priceExcl } : {}),
          ...(item.vatRate != null ? { vatRate: item.vatRate } : {}),
        })),
        totalAmount: total,
        totalExcl,
        ...(nettoKorting > 0 ? {
          discount: nettoKorting,
          // Een percentage is wat er is afgesproken en blijft kloppen bij elk
          // bedrag; een vast bedrag leggen we alleen als bedrag vast.
          ...(couponType === 'percentage' ? { discountPercent: couponValue } : {}),
        } : {}),
        createdAt:   new Date().toISOString(),
        statusHistory: [buildStatusEntry('paid', `Betaling ontvangen via Stripe (${session.id})`)],
      }), { numberOpts: { type: 'invoice', fallbackPrefix: 'SDK' } })
      createdOrderId = createdOrder._id
      orderNumber = createdOrder.orderNumber
    } catch (err) {
      console.error('[webhook] Sanity order aanmaken mislukt:', err)
      // Ga door met emails, ook als Sanity faalt
    }

    // ── Sync koper naar Sanity contacten + Mailchimp ─────────────────────
    if (email) {
      try {
        const nameParts = name.trim().split(' ')
        const firstName = nameParts[0] ?? ''
        const lastName  = nameParts.slice(1).join(' ') || undefined
        const country   = shipping?.country ?? undefined

        // Check of contact al bestaat
        const existing = await sanity.fetch<{
          _id: string
          company?: string | null; vatNumber?: string | null
          street?: string | null; postalCode?: string | null
          city?: string | null; country?: string | null
          clientLocation?: string | null; invoiceLanguage?: string | null
        } | null>(
          `*[_type == "contact" && email == $email][0]{
             _id, company, vatNumber, street, postalCode, city, country,
             clientLocation, invoiceLanguage
           }`,
          { email }
        )

        // Full address for the contact. Expliciet getypeerd: zonder dit leidt
        // TypeScript twee verschillende vormen af (met en zonder adres) en
        // weigert het samengestelde document.
        const contactAddress: {
          street?: string; postalCode?: string; city?: string; country?: string
        } = shipping ? {
          street:     [shipping.line1, shipping.line2].filter(Boolean).join(' ') || undefined,
          postalCode: shipping.postal_code || undefined,
          city:       shipping.city || undefined,
          country:    shipping.country || undefined,
        } : {}

        let contactId: string
        if (existing) {
          // Een bestaand contact wordt aangevuld, niet overschreven.
          //
          // Hier ging het adres van deze ene bestelling over het adres in het
          // CRM heen — ook een bezorgadres bij iemand anders, of een tweede
          // bestelling naar een vakantieadres. Wat er in het contact staat is
          // vrijwel altijd completer dan wat er bij een afrekening wordt
          // getypt; het bezorgadres van déze order staat bovendien al op de
          // order zelf. Alleen lege plekken vullen we.
          const vulAan: Record<string, string> = {}
          const leeg = (v?: string | null) => v == null || v === ''
          if (companyName && leeg(existing.company)) vulAan.company = companyName
          if (vatNumber && leeg(existing.vatNumber)) vulAan.vatNumber = vatNumber
          if (contactAddress.street && leeg(existing.street)) vulAan.street = contactAddress.street
          if (contactAddress.postalCode && leeg(existing.postalCode)) vulAan.postalCode = contactAddress.postalCode
          if (contactAddress.city && leeg(existing.city)) vulAan.city = contactAddress.city
          if (contactAddress.country && leeg(existing.country)) vulAan.country = contactAddress.country
          // Bepaalt de BTW op de factuur. De webshop rekent prijzen inclusief
          // BTW af, dus 'nl' beschrijft wat er werkelijk is gebeurd; een
          // buitenlandse zakelijke koper past de eigenaar zelf aan, en die
          // keuze blijft daarna staan.
          if (leeg(existing.clientLocation)) vulAan.clientLocation = 'nl'
          if (leeg(existing.invoiceLanguage)) vulAan.invoiceLanguage = 'nl'

          await sanity.patch(existing._id)
            .setIfMissing({ type: 'webshop_customer' })
            .set({
              ...(newsletterOptIn ? { subscribed: true } : {}),
              ...vulAan,
            })
            .commit()
          contactId = existing._id
        } else {
          const created = await sanity.create({
            _type:       'contact',
            firstName,
            lastName,
            email,
            phone:       phone || undefined,
            company:     companyName,
            vatNumber:   vatNumber,
            type:        'webshop_customer',
            // Bepaalt de BTW op de factuur — daarom meteen invullen in plaats
            // van de factuurcode later te laten raden.
            clientLocation: 'nl',
            invoiceLanguage: 'nl',
            subscribed:  newsletterOptIn,
            ...(newsletterOptIn ? { subscribedAt: new Date().toISOString() } : {}),
            source:      `webshop — ${orderNumber}`,
            ...contactAddress,
          })
          contactId = created._id
        }

        // Voeg aankopen toe aan het contact + markeer artwork als sold_out
        // Normalize artworkId: strip 'drafts.' prefix if present
        const artworkItems = parsedItems
          .map(i => ({ ...i, artworkId: i.artworkId?.replace(/^drafts\./, '') ?? null }))
          .filter(i => i.artworkId)

        console.log('[webhook] artworkItems:', JSON.stringify(artworkItems))

        const purchaseEntries = artworkItems.map(i => ({
          _key:          crypto.randomUUID(),
          artwork:       { _type: 'reference', _ref: i.artworkId! },
          soldVia:       'webshop',
          editionNumber: orderNumber,
          price:         i.price,
        }))

        // De order aan de koper hangen. Zonder deze verwijzing blijft "Bill to"
        // op de factuur leeg — die leest uit `contact->`, niet uit de losse
        // klantvelden op de order — en staat de koper nergens als klant.
        if (createdOrderId) {
          await sanity.patch(createdOrderId)
            .set({ contact: { _type: 'reference', _ref: contactId } })
            .commit()
            .catch(err => console.error('[webhook] kon order niet aan contact koppelen:', err))
        }

        if (purchaseEntries.length > 0) {
          await sanity.patch(contactId).setIfMissing({ purchases: [] }).append('purchases', purchaseEntries).commit()
            .then(() => console.log('[webhook] purchases bijgeschreven voor contact', contactId))
            .catch(err => console.error('[webhook] purchases append mislukt:', err))
        } else {
          console.log('[webhook] geen artworkIds gevonden in parsedItems:', JSON.stringify(parsedItems))
        }

        // Verkocht werk bijwerken — gebeurde hier niet, dus een verkocht stuk
        // bleef in de webshop liggen en kon nog een keer besteld worden.
        for (const i of artworkItems) {
          try {
            await markSold(sanity, i.artworkId!, i.quantity ?? 1)
          } catch (err) {
            console.error('[webhook] kon artwork niet bijwerken', i.artworkId, err)
          }
        }

        // Sync naar Mailchimp — webshop klanten worden automatisch ingeschreven
        await syncToMailchimp({
          email,
          firstName,
          lastName,
          type:      'webshop_customer',
          country,
          subscribed: true,
        })
      } catch (err) {
        console.error('[webhook] contact/mailchimp sync mislukt:', err)
      }
    }

    // Eén keer ophalen, beide mails gebruiken hem.
    const mail = await mailSettings(sanity)

    // ── Bevestigingsmail naar koper ───────────────────────────────────────
    if (email && process.env.RESEND_API_KEY) {
      const resend = getResendClient()
      const itemRows = parsedItems
        .map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity}× ${i.title}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">€${Number(i.price).toFixed(2)}</td></tr>`)
        .join('')

      await resend.emails.send({
        from: mail.from,
        to:   email,
        subject: 'Thank you for your order — Sander Dekker',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <p>Dear ${name},</p>
            <p>Thank you for your order!</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              ${itemRows}
              <tr><td style="padding:10px 0;font-weight:bold">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold">€${total.toFixed(2)}</td></tr>
            </table>
            ${shipping ? `<p style="color:#666;font-size:13px">Shipping address: ${shipping.line1}, ${shipping.postal_code} ${shipping.city}, ${shipping.country}</p>` : ''}
            <p style="margin-top:28px">I will be in touch as soon as possible regarding shipment.</p>
            <p>Kind regards,<br>Sander Dekker</p>
          </div>
        `,
      }).catch(console.error)
    }

    // ── Notificatie naar Sander ───────────────────────────────────────────
    if (!process.env.RESEND_API_KEY) { return NextResponse.json({ received: true }) }
    const resend = getResendClient()
    await resend.emails.send({
      from: mail.from,
      to:   mail.notify,
      subject: `Nieuwe bestelling ${orderNumber} van ${name}`,
      html: `
        <p><strong>Nieuwe betaalde bestelling!</strong></p>
        <p>Bestelnummer: <strong>${orderNumber}</strong></p>
        <p>Klant: ${name} (${email})${phone ? ` · ${phone}` : ''}</p>
        ${shipping ? `<p>Adres: ${shipping.line1}, ${shipping.postal_code} ${shipping.city}, ${shipping.country}</p>` : ''}
        <p>Items:<br>${parsedItems.map(i => `${i.quantity}× ${i.title} — €${Number(i.price).toFixed(2)}`).join('<br>')}</p>
        <p><strong>Totaal: €${total.toFixed(2)}</strong></p>
        <p style="color:#888;font-size:12px">Stripe sessie: ${session.id}</p>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ received: true })
}

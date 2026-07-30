import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'
import { getResendClient } from '@/lib/resend'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { syncToMailchimp } from '@/lib/mailchimp'
const FROM    = 'Sander Dekker <hello@mynameissanderdekker.com>'

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
    let parsedItems: { title: string; price: number; quantity: number; artworkId?: string | null }[] = []
    try {
      parsedItems = JSON.parse(session.metadata?.itemsJson ?? '[]')
    } catch {
      const titles = JSON.parse(session.metadata?.items ?? '[]') as string[]
      parsedItems = titles.map(title => ({ title, price: 0, quantity: 1 }))
    }

    const orderNumber = `SD-${Date.now()}`

    // ── Sla order op in Sanity ────────────────────────────────────────────
    try {
      await sanity.create({
        _type:           'order',
        orderNumber,
        stripeSessionId: session.id,
        status:          'new',
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
        items: parsedItems.map(item => ({
          _key:     crypto.randomUUID(),
          title:    item.title,
          quantity: item.quantity ?? 1,
          price:    item.price ?? 0,
        })),
        totalAmount: total,
        createdAt:   new Date().toISOString(),
        statusHistory: [buildStatusEntry('new', `Betaling ontvangen via Stripe (${session.id})`)],
      })
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
        const existing = await sanity.fetch<{ _id: string } | null>(
          `*[_type == "contact" && email == $email][0]{ _id }`,
          { email }
        )

        // Full address for the contact
        const contactAddress = shipping ? {
          street:     [shipping.line1, shipping.line2].filter(Boolean).join(' ') || undefined,
          postalCode: shipping.postal_code || undefined,
          city:       shipping.city || undefined,
          country:    shipping.country || undefined,
        } : {}

        let contactId: string
        if (existing) {
          await sanity.patch(existing._id)
            .setIfMissing({ type: 'webshop_customer' })
            .set({
              ...(companyName ? { company: companyName } : {}),
              ...(vatNumber   ? { vatNumber }            : {}),
              ...(newsletterOptIn ? { subscribed: true } : {}),
              ...contactAddress,
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

        if (purchaseEntries.length > 0) {
          await sanity.patch(contactId).setIfMissing({ purchases: [] }).append('purchases', purchaseEntries).commit()
            .then(() => console.log('[webhook] purchases bijgeschreven voor contact', contactId))
            .catch(err => console.error('[webhook] purchases append mislukt:', err))
        } else {
          console.log('[webhook] geen artworkIds gevonden in parsedItems:', JSON.stringify(parsedItems))
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

    // ── Bevestigingsmail naar koper ───────────────────────────────────────
    if (email && process.env.RESEND_API_KEY) {
      const resend = getResendClient()
      const itemRows = parsedItems
        .map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity}× ${i.title}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">€${Number(i.price).toFixed(2)}</td></tr>`)
        .join('')

      await resend.emails.send({
        from: FROM,
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
      from: FROM,
      to:   'hello@mynameissanderdekker.com',
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

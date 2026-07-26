import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'Sander Dekker <hello@mynameissanderdekker.com>'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

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
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session & {
      shipping_details?: { address?: { line1?: string | null; line2?: string | null; postal_code?: string | null; city?: string | null; country?: string | null } }
    }
    const email    = session.customer_details?.email ?? ''
    const name     = session.customer_details?.name ?? ''
    const phone    = session.customer_details?.phone ?? ''
    const shipping = session.shipping_details?.address
    const total    = (session.amount_total ?? 0) / 100

    // Parse items — ondersteun zowel oud formaat (string[]) als nieuw (json met prijs)
    let parsedItems: { title: string; price: number; quantity: number }[] = []
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

    // ── Bevestigingsmail naar koper ───────────────────────────────────────
    if (email) {
      const itemRows = parsedItems
        .map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.quantity}× ${i.title}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">€${Number(i.price).toFixed(2)}</td></tr>`)
        .join('')

      await resend.emails.send({
        from: FROM,
        to:   email,
        subject: 'Bedankt voor je bestelling — Sander Dekker',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <p>Dag ${name},</p>
            <p>Bedankt voor je bestelling!</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              ${itemRows}
              <tr><td style="padding:10px 0;font-weight:bold">Totaal</td><td style="padding:10px 0;text-align:right;font-weight:bold">€${total.toFixed(2)}</td></tr>
            </table>
            ${shipping ? `<p style="color:#666;font-size:13px">Bezorgadres: ${shipping.line1}, ${shipping.postal_code} ${shipping.city}, ${shipping.country}</p>` : ''}
            <p style="margin-top:28px">Ik neem zo snel mogelijk contact op over de verzending.</p>
            <p>Met vriendelijke groet,<br>Sander Dekker</p>
          </div>
        `,
      }).catch(console.error)
    }

    // ── Notificatie naar Sander ───────────────────────────────────────────
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

import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { getResendClient } from '@/lib/resend'
import { syncToMailchimp } from '@/lib/mailchimp'

const FROM = 'Sander Dekker <hello@mynameissanderdekker.com>'

export async function POST(req: NextRequest) {
  // Auth check — zelfde cookie als de rest van /admin
  const session = req.cookies.get('admin_session')?.value
  if (session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    // Contact
    contactId?: string        // bestaand contact
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    vatNumber?: string
    street?: string
    postalCode?: string
    city?: string
    country?: string
    // Artwork
    artworkId: string
    artworkTitle: string
    artworkYear?: number
    copyNumber: string        // bijv. "3/7"
    soldVia: 'direct' | 'gallery' | 'artfair' | 'other'
    saleDate: string          // YYYY-MM-DD
    priceExclVAT: number
    vatRate: number
    // Invoice
    invoiceNumber: string
    paymentTermsDays?: number
    notes?: string
    sendConfirmation?: boolean
  }

  const sanity = getSanityWriteClient()

  // ── Contact aanmaken of bijwerken ─────────────────────────────────────
  let contactId: string

  if (body.contactId) {
    // Bestaand contact updaten indien adres etc. ontbreekt
    await sanity.patch(body.contactId)
      .setIfMissing({ type: 'collector' })
      .set({
        ...(body.company    ? { company: body.company }       : {}),
        ...(body.vatNumber  ? { vatNumber: body.vatNumber }   : {}),
        ...(body.street     ? { street: body.street }         : {}),
        ...(body.postalCode ? { postalCode: body.postalCode } : {}),
        ...(body.city       ? { city: body.city }             : {}),
        ...(body.country    ? { country: body.country }       : {}),
      })
      .commit()
    contactId = body.contactId
  } else {
    // Nieuw contact
    const existing = await sanity.fetch<{ _id: string } | null>(
      `*[_type == "contact" && email == $email][0]{ _id }`,
      { email: body.email }
    )
    if (existing) {
      contactId = existing._id
    } else {
      const created = await sanity.create({
        _type:      'contact',
        firstName:  body.firstName,
        lastName:   body.lastName,
        email:      body.email,
        phone:      body.phone || undefined,
        company:    body.company || undefined,
        vatNumber:  body.vatNumber || undefined,
        street:     body.street || undefined,
        postalCode: body.postalCode || undefined,
        city:       body.city || undefined,
        country:    body.country || undefined,
        type:       'collector',
        source:     `manual sale — ${body.invoiceNumber}`,
      })
      contactId = created._id
    }
  }

  // ── Purchase toevoegen aan contact ────────────────────────────────────
  const purchaseEntry = {
    _key:          crypto.randomUUID(),
    artwork:       { _type: 'reference', _ref: body.artworkId },
    copyNumber:    body.copyNumber,
    soldVia:       body.soldVia,
    editionNumber: body.invoiceNumber,
    date:          body.saleDate,
    price:         body.priceExclVAT,
  }

  await sanity.patch(contactId)
    .setIfMissing({ purchases: [] })
    .append('purchases', [purchaseEntry])
    .commit()

  // ── Artwork op 'not_for_sale' zetten indien uitverkocht ──────────────
  // (we laten dit aan de gebruiker over via de status toggle — artwork-editie
  //  kan meerdere kopieën hebben. We updaten alleen 'buyers' notitie.)
  try {
    await sanity.patch(body.artworkId)
      .setIfMissing({ buyers: '' })
      .commit()
  } catch {
    // non-critical
  }

  // ── Order document aanmaken (zelfde als webshop) ──────────────────────
  const priceIncl = body.priceExclVAT * (1 + body.vatRate / 100)

  await sanity.create({
    _type:         'order',
    orderNumber:   body.invoiceNumber,
    status:        'new',
    customerName:  `${body.firstName} ${body.lastName}`,
    customerEmail: body.email,
    customerPhone: body.phone || undefined,
    companyName:   body.company || undefined,
    vatNumber:     body.vatNumber || undefined,
    shippingAddress: (body.street || body.city) ? {
      street:     body.street || '',
      postalCode: body.postalCode || '',
      city:       body.city || '',
      country:    body.country || '',
    } : undefined,
    items: [{
      _key:     crypto.randomUUID(),
      title:    `${body.artworkTitle}${body.artworkYear ? ` (${body.artworkYear})` : ''} — ${body.copyNumber}`,
      quantity: 1,
      price:    priceIncl,
    }],
    totalAmount: priceIncl,
    createdAt:   new Date().toISOString(),
    statusHistory: [{
      _key:      crypto.randomUUID(),
      _type:     'statusHistoryEntry',
      status:    'new',
      changedAt: new Date().toISOString(),
      changedBy: 'admin',
      note:      `Handmatige verkoop — ${body.soldVia}`,
    }],
  })

  // ── Mailchimp sync ─────────────────────────────────────────────────────
  try {
    await syncToMailchimp({
      email:     body.email,
      firstName: body.firstName,
      lastName:  body.lastName,
      type:      'collector',
      country:   body.country,
      subscribed: false,  // geen auto-subscribe bij handmatige verkoop
    })
  } catch { /* non-critical */ }

  // ── Bevestigingsmail naar koper (optioneel) ───────────────────────────
  if (body.sendConfirmation && body.email && process.env.RESEND_API_KEY) {
    const resend = getResendClient()
    const vatAmount = priceIncl - body.priceExclVAT
    const dueDate = new Date(body.saleDate)
    dueDate.setDate(dueDate.getDate() + (body.paymentTermsDays ?? 14))
    const dueDateStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    await resend.emails.send({
      from: FROM,
      to:   body.email,
      subject: `Invoice ${body.invoiceNumber} — Sander Dekker`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#111;font-size:15px;line-height:1.6">
          <p>Dear ${body.firstName},</p>
          <p>Thank you. Please find your invoice details below.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;color:#666">Invoice number</td>
              <td style="padding:8px 0;text-align:right">${body.invoiceNumber}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;color:#666">Date</td>
              <td style="padding:8px 0;text-align:right">${new Date(body.saleDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0">
                ${body.artworkTitle}${body.artworkYear ? `, ${body.artworkYear}` : ''}<br>
                <span style="color:#888;font-size:13px">${body.copyNumber}</span>
              </td>
              <td style="padding:8px 0;text-align:right;vertical-align:top">€${body.priceExclVAT.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;color:#666">VAT ${body.vatRate}%</td>
              <td style="padding:8px 0;text-align:right">€${vatAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:bold">Total</td>
              <td style="padding:10px 0;text-align:right;font-weight:bold">€${priceIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
          ${body.notes ? `<p style="color:#555;font-size:13px;font-style:italic">${body.notes}</p>` : ''}
          <p style="font-size:13px;color:#666">Payment due by ${dueDateStr}.</p>
          <p>Kind regards,<br>Sander Dekker</p>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
          <p style="font-size:11px;color:#aaa">Sander Dekker · hello@mynameissanderdekker.com · mynameissanderdekker.com</p>
        </div>
      `,
    }).catch(console.error)
  }

  // ── Notificatie naar Sander ───────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = getResendClient()
    await resend.emails.send({
      from: FROM,
      to:   'hello@mynameissanderdekker.com',
      subject: `Sale registered — ${body.invoiceNumber}`,
      html: `
        <p><strong>Manual sale registered</strong></p>
        <p>${body.artworkTitle}${body.artworkYear ? ` (${body.artworkYear})` : ''} — ${body.copyNumber}</p>
        <p>Buyer: ${body.firstName} ${body.lastName} (${body.email})</p>
        <p>Price: €${body.priceExclVAT.toLocaleString('nl-NL')} excl. VAT</p>
        <p>Invoice: ${body.invoiceNumber} · via ${body.soldVia}</p>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true, contactId, invoiceNumber: body.invoiceNumber })
}

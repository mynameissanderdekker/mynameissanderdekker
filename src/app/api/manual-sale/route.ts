import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { getResendClient } from '@/lib/resend'
import { syncToMailchimp } from '@/lib/mailchimp'

const FROM = 'Sander Dekker <hello@mynameissanderdekker.com>'

interface SaleItem {
  artworkId: string
  artworkTitle: string
  artworkYear?: number
  copyNumber: string
  priceExclVAT: number
  vatRate: number
}

export async function POST(req: NextRequest) {
  // Auth check — admin cookie of geldig Sanity-token (Studio)
  const session     = req.cookies.get('admin_session')?.value
  const sanityToken = req.headers.get('x-sanity-token')

  let authorized = session === process.env.ADMIN_PASSWORD

  if (!authorized && sanityToken) {
    try {
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
      const check = await fetch(`https://${projectId}.api.sanity.io/v1/users/me`, {
        headers: { Authorization: `Bearer ${sanityToken}` },
      })
      authorized = check.ok
    } catch { /* network error → niet geautoriseerd */ }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    contactId?: string
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
    items: SaleItem[]
    soldVia: 'direct' | 'gallery' | 'artfair' | 'other'
    saleDate: string
    invoiceNumber: string
    paymentTermsDays?: number
    notes?: string
    sendConfirmation?: boolean
  }

  const sanity = getSanityWriteClient()

  // ── Contact aanmaken of bijwerken ─────────────────────────────────────
  let contactId: string

  if (body.contactId) {
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

  // ── Purchases toevoegen aan contact (één per item) ────────────────────
  const purchaseEntries = body.items.map(item => ({
    _key:          crypto.randomUUID(),
    artwork:       { _type: 'reference', _ref: item.artworkId },
    copyNumber:    item.copyNumber || undefined,
    soldVia:       body.soldVia,
    editionNumber: body.invoiceNumber,
    date:          body.saleDate,
    price:         item.priceExclVAT,
  }))

  await sanity.patch(contactId)
    .setIfMissing({ purchases: [] })
    .append('purchases', purchaseEntries)
    .commit()

  // ── Order document aanmaken ───────────────────────────────────────────
  const totalIncl = body.items.reduce((sum, i) => sum + i.priceExclVAT * (1 + i.vatRate / 100), 0)
  const totalExcl = body.items.reduce((sum, i) => sum + i.priceExclVAT, 0)

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
    items: body.items.map(item => ({
      _key:     crypto.randomUUID(),
      title:    `${item.artworkTitle}${item.artworkYear ? ` (${item.artworkYear})` : ''}${item.copyNumber ? ` — ${item.copyNumber}` : ''}`,
      quantity: 1,
      price:    item.priceExclVAT * (1 + item.vatRate / 100),
    })),
    totalAmount: totalIncl,
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
      email:      body.email,
      firstName:  body.firstName,
      lastName:   body.lastName,
      type:       'collector',
      country:    body.country,
      subscribed: false,
    })
  } catch { /* non-critical */ }

  // ── Bevestigingsmail naar koper ───────────────────────────────────────
  if (body.sendConfirmation && body.email && process.env.RESEND_API_KEY) {
    const resend = getResendClient()
    const dueDate = new Date(body.saleDate)
    dueDate.setDate(dueDate.getDate() + (body.paymentTermsDays ?? 14))
    const dueDateStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateStr    = new Date(body.saleDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    const itemRows = body.items.map(item => {
      const incl = item.priceExclVAT * (1 + item.vatRate / 100)
      const vat  = incl - item.priceExclVAT
      return `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px 0">
            ${item.artworkTitle}${item.artworkYear ? `, ${item.artworkYear}` : ''}
            ${item.copyNumber ? `<br><span style="color:#888;font-size:12px">${item.copyNumber}</span>` : ''}
          </td>
          <td style="padding:8px 0;text-align:right;vertical-align:top">€${item.priceExclVAT.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:4px 0;color:#888;font-size:12px">VAT ${item.vatRate}%</td>
          <td style="padding:4px 0;text-align:right;font-size:12px;color:#888">€${vat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
        </tr>
      `
    }).join('')

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
            <tr style="border-bottom:2px solid #111">
              <td style="padding:8px 0;color:#666">Date</td>
              <td style="padding:8px 0;text-align:right">${dateStr}</td>
            </tr>
            ${itemRows}
            <tr>
              <td style="padding:12px 0;font-weight:bold">Total incl. VAT</td>
              <td style="padding:12px 0;text-align:right;font-weight:bold">€${totalIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
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
    const itemList = body.items.map(i => `${i.artworkTitle}${i.copyNumber ? ` — ${i.copyNumber}` : ''} · €${i.priceExclVAT.toLocaleString('nl-NL')}`).join('<br>')
    await resend.emails.send({
      from: FROM,
      to:   'hello@mynameissanderdekker.com',
      subject: `Sale registered — ${body.invoiceNumber}`,
      html: `
        <p><strong>Manual sale registered</strong></p>
        <p>${itemList}</p>
        <p>Buyer: ${body.firstName} ${body.lastName} (${body.email})</p>
        <p>Total excl. VAT: €${totalExcl.toLocaleString('nl-NL')} · Total incl.: €${totalIncl.toLocaleString('nl-NL')}</p>
        <p>Invoice: ${body.invoiceNumber} · via ${body.soldVia}</p>
      `,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true, contactId, invoiceNumber: body.invoiceNumber })
}

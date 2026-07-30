import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'
import { buildShippedEmail } from '@/lib/orderEmails'
import { generateInvoicePdf } from '@/lib/generateInvoicePdf'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'Sander Dekker <hello@mynameissanderdekker.com>'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

// Generate invoice number: INV-YYYY-NNNN
async function nextInvoiceNumber(): Promise<string> {
  const year  = new Date().getFullYear()
  const count = await sanity.fetch<number>(
    `count(*[_type == "order" && defined(invoiceNumber) && invoiceNumber match $prefix])`,
    { prefix: `INV-${year}-*` }
  )
  const seq = String(count + 1).padStart(4, '0')
  return `INV-${year}-${seq}`
}

export async function POST(request: NextRequest) {
  const { orderId } = await request.json()
  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  // ── Fetch full order ─────────────────────────────────────────────────────
  const order = await sanity.fetch<{
    _id:             string
    orderNumber:     string
    invoiceNumber?:  string
    customerName?:   string
    customerEmail?:  string
    status:          string
    trackingNumber?: string
    trackingCarrier?: string
    shippingEmailSentAt?: string
    createdAt?:      string
    items?:          Array<{ title: string; quantity: number; price: number }>
    shippingCost?:   number
    totalAmount?:    number
    shippingAddress?: {
      street?:     string
      postalCode?: string
      city?:       string
      country?:    string
    }
  } | null>(
    `*[_type == "order" && _id == $orderId][0]{
      _id, orderNumber, invoiceNumber, customerName, customerEmail, status,
      trackingNumber, trackingCarrier, shippingEmailSentAt, createdAt,
      items[]{ title, quantity, price },
      shippingCost, totalAmount, shippingAddress
    }`,
    { orderId }
  )

  if (!order)                    return Response.json({ error: 'Order not found' }, { status: 404 })
  if (order.shippingEmailSentAt) return Response.json({ sent: false, reason: 'already_sent' })
  if (order.status !== 'shipped' || !order.trackingNumber)
                                 return Response.json({ sent: false, reason: 'not_shipped' })
  if (!order.customerEmail)      return Response.json({ sent: false, reason: 'no_email' })

  // ── Generate invoice number (if not already set) ─────────────────────────
  const invoiceNumber = order.invoiceNumber ?? await nextInvoiceNumber()

  // ── Generate PDF ─────────────────────────────────────────────────────────
  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    issuedAt:       new Date(),
    orderNumber:    order.orderNumber,
    customerName:   order.customerName,
    customerEmail:  order.customerEmail,
    shippingAddress: order.shippingAddress,
    items:          order.items ?? [],
    shippingCost:   order.shippingCost,
    totalAmount:    order.totalAmount ?? 0,
  })

  // ── Upload PDF to Sanity as file asset ────────────────────────────────────
  const filename = `${invoiceNumber}.pdf`
  const asset = await sanity.assets.upload('file', Buffer.from(pdfBytes), {
    filename,
    contentType: 'application/pdf',
  })

  // ── Patch order with invoice data ─────────────────────────────────────────
  await sanity.patch(order._id).set({
    invoiceNumber,
    invoicePdf: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
  }).commit()

  // ── Build and send shipping email ─────────────────────────────────────────
  const { subject, text } = buildShippedEmail({
    orderNumber:     order.orderNumber,
    customerName:    order.customerName,
    trackingNumber:  order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    postalCode:      order.shippingAddress?.postalCode,
  })

  await resend.emails.send({
    from:    FROM,
    to:      order.customerEmail,
    subject,
    text,
    attachments: [{
      filename,
      content: Buffer.from(pdfBytes).toString('base64'),
    }],
  })

  // ── Mark email sent ───────────────────────────────────────────────────────
  await sanity.patch(order._id).set({ shippingEmailSentAt: new Date().toISOString() }).commit()

  return Response.json({ sent: true, invoiceNumber })
}

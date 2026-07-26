import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'
import { buildShippedEmail } from '@/lib/orderEmails'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'Sander Dekker <hello@mynameissanderdekker.com>'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

export async function POST(request: NextRequest) {
  const { orderId } = await request.json()
  if (!orderId) return Response.json({ error: 'Geen orderId' }, { status: 400 })

  const order = await sanity.fetch<{
    _id: string
    orderNumber: string
    customerName?: string
    customerEmail?: string
    status: string
    trackingNumber?: string
    trackingCarrier?: string
    shippingEmailSentAt?: string
    shippingAddress?: { postalCode?: string }
  } | null>(
    `*[_type == "order" && _id == $orderId][0]{
      _id, orderNumber, customerName, customerEmail, status,
      trackingNumber, trackingCarrier, shippingEmailSentAt, shippingAddress
    }`,
    { orderId }
  )

  if (!order)                        return Response.json({ error: 'Order niet gevonden' }, { status: 404 })
  if (order.shippingEmailSentAt)     return Response.json({ sent: false, reason: 'already_sent' })
  if (order.status !== 'shipped' || !order.trackingNumber)
                                     return Response.json({ sent: false, reason: 'not_shipped' })
  if (!order.customerEmail)          return Response.json({ sent: false, reason: 'no_email' })

  const { subject, text } = buildShippedEmail({
    orderNumber:     order.orderNumber,
    customerName:    order.customerName,
    trackingNumber:  order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    postalCode:      order.shippingAddress?.postalCode,
  })

  await resend.emails.send({ from: FROM, to: order.customerEmail, subject, text })
  await sanity.patch(order._id).set({ shippingEmailSentAt: new Date().toISOString() }).commit()

  return Response.json({ sent: true })
}

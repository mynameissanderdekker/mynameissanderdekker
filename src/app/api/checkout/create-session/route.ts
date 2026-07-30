import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: 'Geen producten' }, { status: 400 })
    }

    const session = await getStripeClient().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      line_items: items.map((item: { id?: string; title: string; priceIncl: number; imageUrl?: string }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(item.priceIncl * 100), // in centen
        },
        quantity: 1,
      })),
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['NL', 'BE', 'DE', 'FR', 'GB', 'US', 'AT', 'DK', 'IT', 'ES', 'PT', 'SE', 'NO', 'CH'],
      },
      billing_address_collection: 'auto',
      custom_fields: [
        {
          key: 'company_name',
          label: { type: 'custom', custom: 'Company name' },
          type: 'text',
          optional: true,
        },
        {
          key: 'vat_number',
          label: { type: 'custom', custom: 'VAT / BTW number' },
          type: 'text',
          optional: true,
        },
      ],
      customer_email: undefined, // Stripe vraagt dit zelf
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cart`,
      metadata: {
        items: JSON.stringify(items.map((i: { title: string }) => i.title)),
        itemsJson: JSON.stringify(items.map((i: { id?: string; title: string; priceIncl: number }) => ({
          title:     i.title,
          price:     i.priceIncl,
          quantity:  1,
          // id is artwork._id or artwork._id::variantKey — strip the variant suffix
          artworkId: i.id ? i.id.split('::')[0] : null,
        }))),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sessie aanmaken mislukt' },
      { status: 500 }
    )
  }
}

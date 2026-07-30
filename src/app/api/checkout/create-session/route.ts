import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: 'Geen producten' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      line_items: items.map((item: { title: string; priceIncl: number; imageUrl?: string }) => ({
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
      shipping_address_collection: {
        allowed_countries: ['NL', 'BE', 'DE', 'FR', 'GB', 'US', 'AT', 'DK', 'IT', 'ES', 'PT', 'SE', 'NO', 'CH'],
      },
      customer_email: undefined, // Stripe vraagt dit zelf
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cart`,
      metadata: {
        items: JSON.stringify(items.map((i: { title: string }) => i.title)),
        itemsJson: JSON.stringify(items.map((i: { title: string; priceIncl: number }) => ({
          title: i.title,
          price: i.priceIncl,
          quantity: 1,
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

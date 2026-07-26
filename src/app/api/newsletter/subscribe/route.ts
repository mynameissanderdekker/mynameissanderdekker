import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, source } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
    }

    // Check if contact already exists
    const existing = await sanity.fetch(
      `*[_type == "contact" && email == $email][0]{ _id, subscribed }`,
      { email }
    )

    if (existing) {
      if (existing.subscribed) {
        return NextResponse.json({ message: 'Al ingeschreven' }, { status: 200 })
      }
      // Re-subscribe
      await sanity.patch(existing._id).set({
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        unsubscribedAt: null,
      }).commit()
      return NextResponse.json({ message: 'Opnieuw ingeschreven' }, { status: 200 })
    }

    // Create new contact
    await sanity.create({
      _type: 'contact',
      email,
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      subscribed: true,
      subscribedAt: new Date().toISOString(),
      source: source ?? 'website signup',
      type: 'newsletter',
    })

    return NextResponse.json({ message: 'Ingeschreven' }, { status: 201 })
  } catch (err) {
    console.error('[newsletter/subscribe]', err)
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 })
  }
}

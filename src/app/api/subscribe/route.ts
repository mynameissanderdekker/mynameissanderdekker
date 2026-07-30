/**
 * POST /api/subscribe
 *
 * Website newsletter signup.
 * - Creates or updates a contact in Sanity
 * - Syncs to Mailchimp
 *
 * Body: { email: string, firstName?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { syncToMailchimp } from '@/lib/mailchimp'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

export async function POST(req: NextRequest) {
  let body: { email?: string; firstName?: string; lastName?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email     = body.email?.trim().toLowerCase()
  const firstName = body.firstName?.trim()
  const lastName  = body.lastName?.trim()

  // ── Cloudflare Turnstile verification ─────────────────────────────────────
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (secretKey) {
    const token = body.turnstileToken
    if (!token) {
      return NextResponse.json({ error: 'Turnstile token missing' }, { status: 400 })
    }
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    })
    const verifyData = await verifyRes.json() as { success: boolean }
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Turnstile verificatie mislukt' }, { status: 400 })
    }
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
  }

  // ── Check if contact already exists in Sanity ─────────────────────────────
  const existing = await sanity.fetch<{ _id: string; subscribed?: boolean } | null>(
    `*[_type == "contact" && email == $email][0]{ _id, subscribed }`,
    { email }
  )

  if (existing) {
    if (existing.subscribed === true) {
      // Already subscribed — just return success (idempotent)
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }

    // Re-subscribe
    await sanity
      .patch(existing._id)
      .set({ subscribed: true, subscribedAt: new Date().toISOString(), unsubscribedAt: null })
      .commit()
  } else {
    // New contact
    await sanity.create({
      _type:        'contact',
      firstName:    firstName ?? email!.split('@')[0],
      lastName:     lastName,
      email,
      type:         'newsletter',
      subscribed:   true,
      subscribedAt: new Date().toISOString(),
      source:       'website signup',
    })
  }

  // ── Sync to Mailchimp ─────────────────────────────────────────────────────
  await syncToMailchimp({
    email:      email!,
    firstName,
    lastName,
    type:       'newsletter',
    subscribed: true,
  })

  return NextResponse.json({ ok: true })
}

/**
 * POST /api/webhooks/sanity-contact
 *
 * Sanity webhook — fires when a contact document is created or updated.
 * Syncs the contact to Mailchimp with the correct tags.
 *
 * Set up in Sanity Dashboard:
 *   URL:     https://mynameissanderdekker.com/api/webhooks/sanity-contact
 *   Filter:  _type == "contact"
 *   Secret:  <set SANITY_WEBHOOK_SECRET in .env.local and in Sanity>
 *   Projection: { _id, firstName, lastName, email, type, country, subscribed }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { syncToMailchimp } from '@/lib/mailchimp'

interface SanityContactPayload {
  _id:        string
  _type:      string
  firstName?: string
  lastName?:  string
  email?:     string
  type?:      string
  country?:   string
  subscribed?: boolean
}

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // ── Verify Sanity webhook signature ────────────────────────────────────────
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('sanity-webhook-signature')
    if (!verifySignature(body, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: SanityContactPayload
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle contact documents
  if (payload._type !== 'contact' || !payload.email) {
    return NextResponse.json({ skipped: true })
  }

  const result = await syncToMailchimp({
    email:      payload.email,
    firstName:  payload.firstName,
    lastName:   payload.lastName,
    type:       payload.type,
    country:    payload.country,
    subscribed: payload.subscribed,
  })

  console.log(`[sanity-webhook] synced ${payload.email} →`, result)
  return NextResponse.json({ ok: result.ok })
}

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
  // `timingSafeEqual` gooit een fout als de lengtes verschillen — een
  // verminkte handtekening gaf daardoor een 500 in plaats van een nette 401.
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  // ── Handtekening van Sanity controleren ──────────────────────────────────
  // Stond als `if (secret) { …controleren… }`: ontbreekt die variabele in de
  // omgeving, dan werd er niets gecontroleerd en kon iedereen een
  // contactpayload naar deze route sturen — die schrijft door naar Mailchimp.
  // Dezelfde fail-open als bij ADMIN_PASSWORD, TURNSTILE_SECRET_KEY en de
  // pincode van de app: een ontbrekende sleutel hoort niemand binnen te laten,
  // niet iedereen.
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook] SANITY_WEBHOOK_SECRET ontbreekt — verzoek geweigerd')
    return NextResponse.json(
      { error: 'Webhook is niet ingesteld' },
      { status: 503 }
    )
  }
  const sig = req.headers.get('sanity-webhook-signature')
  if (!verifySignature(body, sig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
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

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
import { getSanityWriteClient } from '@/lib/sanityClient'
import { syncToMailchimp } from '@/lib/mailchimp'
import { verifyTurnstile, clientIp } from '@/lib/verifyTurnstile'

export async function POST(req: NextRequest) {
  const sanity = getSanityWriteClient()
  let body: { email?: string; firstName?: string; lastName?: string; turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email     = body.email?.trim().toLowerCase()
  const firstName = body.firstName?.trim()
  const lastName  = body.lastName?.trim()

  // ── Cloudflare Turnstile ──────────────────────────────────────────────────
  // Zie src/lib/verifyTurnstile.ts. Hier stond `if (secretKey) { ... }`:
  // ontbrak de sleutel in de omgeving, dan werd er niets gecontroleerd en kon
  // een bot rechtstreeks op deze route inschrijven. Cloudflare zag precies dat
  // — tokens uitgegeven, siteverify nooit aangeroepen.
  const check = await verifyTurnstile(body.turnstileToken, {
    action: 'newsletter',
    ip: clientIp(req),
  })
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

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

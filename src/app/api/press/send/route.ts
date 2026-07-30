/**
 * POST /api/press/send
 *
 * Sends a press release as email to the press segment (journalists + galleries).
 * Called from the SendPressReleaseAction Sanity document action.
 *
 * Auth: Bearer SANITY_WRITE_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResendClient } from '@/lib/resend'
import { createClient } from '@sanity/client'
import { buildPressEmail } from '@/lib/pressEmailTemplate'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const FROM     = 'Sander Dekker Studio <studio@mynameissanderdekker.com>'
const SITE     = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mynameissanderdekker.com'
const BATCH    = 50

// Press segment: journalists + galleries, not unsubscribed
const PRESS_FILTER = `type in ["journalist", "gallery"] && subscribed != false`

interface Contact { _id: string; email: string; firstName?: string }

function makeToken(id: string) { return Buffer.from(id).toString('base64url') }

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function POST(req: NextRequest) {
  const resend = getResendClient()
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SANITY_WRITE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pressReleaseId, dryRun } = await req.json()
  if (!pressReleaseId) return NextResponse.json({ error: 'pressReleaseId required' }, { status: 400 })

  // ── Fetch press release ──────────────────────────────────────────────────────
  const pr = await sanity.fetch(
    `*[_type == "pressRelease" && _id == $id][0]{
      _id, title, date, embargo, subject, intro, body,
      contactName, contactEmail, contactPhone, website,
      emailSentAt,
      "firstImage": images[0].image.asset->url,
      "firstCaption": images[0].caption
    }`,
    { id: pressReleaseId }
  )

  if (!pr) return NextResponse.json({ error: 'Press release not found' }, { status: 404 })
  if (pr.emailSentAt && !dryRun) {
    return NextResponse.json({ error: 'Already sent', sentAt: pr.emailSentAt }, { status: 409 })
  }

  // ── Fetch press contacts ─────────────────────────────────────────────────────
  const contacts = await sanity.fetch<Contact[]>(
    `*[_type == "contact" && defined(email) && (${PRESS_FILTER})]{ _id, email, firstName }`
  )

  if (dryRun) {
    return NextResponse.json({ recipientCount: contacts.length, dryRun: true })
  }

  if (contacts.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No press contacts found' })
  }

  // ── Build common email parts ─────────────────────────────────────────────────
  const releaseLabel  = pr.embargo ?? 'FOR IMMEDIATE RELEASE'
  const dateLocation  = ['Amsterdam', pr.date ? formatDate(pr.date) : ''].filter(Boolean).join(', ')

  const bodyText = Array.isArray(pr.body)
    ? pr.body
        .map((b: { children?: { text: string }[] }) =>
          (b.children ?? []).map((c: { text: string }) => c.text).join('')
        )
        .join('\n\n')
    : ''

  // ── Send in batches ──────────────────────────────────────────────────────────
  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < contacts.length; i += BATCH) {
    const batch = contacts.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (c) => {
        const unsubscribeUrl = `${SITE}/api/unsubscribe?token=${makeToken(c._id)}`
        const html = buildPressEmail({
          releaseLabel,
          dateLocation,
          title:        pr.title,
          subject:      pr.subject,
          intro:        pr.intro,
          body:         bodyText,
          imageUrl:     pr.firstImage ? `${pr.firstImage}?w=1008&auto=format&q=85` : undefined,
          imageCaption: pr.firstCaption,
          contactName:  pr.contactName,
          contactEmail: pr.contactEmail,
          contactPhone: pr.contactPhone,
          website:      pr.website,
          unsubscribeUrl,
        })
        try {
          await resend.emails.send({ from: FROM, to: c.email, subject: pr.title, html })
          sent++
        } catch (e) {
          errors.push(`${c.email}: ${e}`)
        }
      })
    )
  }

  // ── Write sentAt back to Sanity ──────────────────────────────────────────────
  await sanity.patch(pressReleaseId)
    .set({ emailSentAt: new Date().toISOString(), emailRecipientCount: sent })
    .commit()

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}

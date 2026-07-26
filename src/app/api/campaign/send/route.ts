/**
 * POST /api/campaign/send
 *
 * Called from the SendCampaignAction Sanity document action.
 * - Fetches the campaign document
 * - Resolves the segment to a contact list
 * - Sends HTML emails via Resend (batches of 50)
 * - Writes sentAt + recipientCount back to the Sanity document
 *
 * Auth: Bearer SANITY_WRITE_TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'
import { buildCampaignEmail } from '@/lib/emailTemplate'
import { SEGMENTS } from '@/sanity/schemas/campaign'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const FROM = 'Sander Dekker <studio@mynameissanderdekker.com>'
const SITE  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mynameissanderdekker.com'
const BATCH_SIZE = 50

interface Contact {
  _id: string
  email: string
  firstName?: string
}

interface CampaignDoc {
  _id: string
  subject: string
  previewText?: string
  heading?: string
  body?: string
  buttonText?: string
  buttonUrl?: string
  segment: string
  sentAt?: string
  image?: { url?: string }
}

/** Base64-encode a contact ID for use in the unsubscribe link */
function makeToken(contactId: string): string {
  return Buffer.from(contactId).toString('base64url')
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SANITY_WRITE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { campaignId, dryRun } = await req.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is verplicht' }, { status: 400 })
    }

    // ── Fetch campaign ────────────────────────────────────────────────────────
    const doc = await sanity.fetch<CampaignDoc>(
      `*[_type == "campaign" && _id == $id][0]{
        _id, subject, previewText, heading, body,
        buttonText, buttonUrl, segment, sentAt,
        "image": image.asset->{ url }
      }`,
      { id: campaignId }
    )

    if (!doc) {
      return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
    }

    if (doc.sentAt && !dryRun) {
      return NextResponse.json({ error: 'Deze campagne is al verstuurd' }, { status: 409 })
    }

    // ── Resolve segment → GROQ filter ────────────────────────────────────────
    const seg = SEGMENTS.find(s => s.value === doc.segment)
    if (!seg) {
      return NextResponse.json({ error: `Onbekend segment: ${doc.segment}` }, { status: 400 })
    }

    const contacts = await sanity.fetch<Contact[]>(
      `*[_type == "contact" && defined(email) && (${seg.filter})]{
        _id, email, firstName
      }`
    )

    // ── Dry run: return count only ────────────────────────────────────────────
    if (dryRun) {
      return NextResponse.json({ recipientCount: contacts.length, dryRun: true })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Geen ontvangers voor dit segment' })
    }

    // ── Send in batches ───────────────────────────────────────────────────────
    let sent = 0
    const errors: string[] = []

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (contact) => {
          const token = makeToken(contact._id)
          const unsubscribeUrl = `${SITE}/api/unsubscribe?token=${token}`

          const html = buildCampaignEmail({
            heading:       doc.heading,
            body:          doc.body,
            imageUrl:      doc.image?.url,
            buttonText:    doc.buttonText,
            buttonUrl:     doc.buttonUrl,
            previewText:   doc.previewText,
            unsubscribeUrl,
            firstName:     contact.firstName,
          })

          try {
            await resend.emails.send({
              from:    FROM,
              to:      contact.email,
              subject: doc.subject,
              html,
            })
            sent++
          } catch (err) {
            errors.push(`${contact.email}: ${err}`)
          }
        })
      )
    }

    // ── Write back to Sanity ──────────────────────────────────────────────────
    await sanity
      .patch(campaignId)
      .set({ sentAt: new Date().toISOString(), recipientCount: sent })
      .commit()

    return NextResponse.json({
      sent,
      total: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[campaign/send]', err)
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 })
  }
}

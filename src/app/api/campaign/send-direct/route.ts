/**
 * POST /api/campaign/send-direct
 * Called from the /admin/campaigns UI.
 * Fetches contacts for a segment, sends emails via Resend, returns sent count.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getResendClient } from '@/lib/resend'
import { getSanityWriteClient } from '@/lib/sanityClient'

const FROM   = 'Sander Dekker <studio@mynameissanderdekker.com>'
const SITE   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mynameissanderdekker.com'

const SEGMENT_FILTERS: Record<string, string> = {
  newsletter:  `subscribed == true`,
  collectors:  `type == "collector" && subscribed != false`,
  buyers_low:  `count(purchases[price < 500]) > 0 && subscribed != false`,
  galleries:   `type == "gallery" && subscribed != false`,
  all:         `defined(email)`,
}

interface Contact { _id: string; email: string; firstName?: string }

function makeToken(id: string) { return Buffer.from(id).toString('base64url') }

function injectUnsubscribe(html: string, unsubUrl: string): string {
  const link = `<p style="text-align:center;font-size:11px;color:#aaa;margin-top:32px;">
    <a href="${unsubUrl}" style="color:#aaa;">Uitschrijven</a>
  </p>`
  return html.includes('</body>') ? html.replace('</body>', `${link}</body>`) : html + link
}

export async function POST(req: NextRequest) {
  const resend = getResendClient()
  const sanity = getSanityWriteClient()
  // Simple auth via cookie (set by /api/admin/login)
  const session = req.cookies.get('admin_session')?.value
  if (session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, html, segment, customFilter } = await req.json()

  if (!subject || !html || !segment) {
    return NextResponse.json({ error: 'subject, html en segment zijn verplicht' }, { status: 400 })
  }

  // Custom segments pass their own filter; built-ins use the lookup table
  const filter = customFilter ?? SEGMENT_FILTERS[segment]
  if (!filter) {
    return NextResponse.json({ error: `Onbekend segment: ${segment}` }, { status: 400 })
  }

  const contacts = await sanity.fetch<Contact[]>(
    `*[_type == "contact" && defined(email) && (${filter})]{ _id, email, firstName }`
  )

  if (contacts.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Geen ontvangers' })
  }

  const BATCH = 50
  let sent = 0

  for (let i = 0; i < contacts.length; i += BATCH) {
    await Promise.allSettled(
      contacts.slice(i, i + BATCH).map(async (c) => {
        const unsubUrl   = `${SITE}/api/unsubscribe?token=${makeToken(c._id)}`
        const finalHtml  = injectUnsubscribe(html, unsubUrl)
        try {
          await resend.emails.send({ from: FROM, to: c.email, subject, html: finalHtml })
          sent++
        } catch { /* skip failed individual sends */ }
      })
    )
  }

  return NextResponse.json({ sent, total: contacts.length })
}

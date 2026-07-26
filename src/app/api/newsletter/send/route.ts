/**
 * POST /api/newsletter/send
 *
 * Stuurt een e-mail naar alle ingeschreven contacten (of een testadres).
 * Body: { subject, html, previewText?, testEmail? }
 *
 * - testEmail: stuur alleen naar dit adres (voor preview)
 * - Zonder testEmail: stuur naar alle subscribed contacten
 *
 * Vereist: RESEND_API_KEY in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const FROM = 'Sander Dekker <studio@mynameissanderdekker.com>'
const SITE = 'https://mynameissanderdekker.com'

function buildHtml(subject: string, bodyHtml: string, email: string) {
  const unsubLink = `${SITE}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>
  body { margin:0; padding:0; background:#f5f5f5; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif; }
  .wrap { max-width:580px; margin:40px auto; background:#fff; padding:48px 40px; }
  h1 { font-size:24px; font-weight:400; margin:0 0 24px; }
  p { font-size:15px; line-height:1.7; color:#1a1a1a; margin:0 0 16px; }
  a { color:#000; }
  .footer { margin-top:48px; padding-top:24px; border-top:1px solid #e0e0e0;
            font-size:12px; color:#999; }
</style>
</head>
<body>
  <div class="wrap">
    ${bodyHtml}
    <div class="footer">
      <p>Je ontvangt dit omdat je je hebt ingeschreven op <a href="${SITE}">mynameissanderdekker.com</a>.<br>
      <a href="${unsubLink}">Uitschrijven</a></p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  // Simple auth check — add a stronger mechanism when deploying
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SANITY_WRITE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { subject, html: bodyHtml, previewText, testEmail } = await req.json()

    if (!subject || !bodyHtml) {
      return NextResponse.json({ error: 'subject en html zijn verplicht' }, { status: 400 })
    }

    // Test send
    if (testEmail) {
      const result = await resend.emails.send({
        from: FROM,
        to: testEmail,
        subject: `[TEST] ${subject}`,
        html: buildHtml(subject, bodyHtml, testEmail),
      })
      return NextResponse.json({ sent: 1, result })
    }

    // Fetch all subscribed contacts
    const contacts: { email: string; firstName: string }[] = await sanity.fetch(
      `*[_type == "contact" && subscribed == true && defined(email)]{ email, firstName }`
    )

    if (contacts.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Geen ingeschreven contacten' })
    }

    // Send in batches of 50 (Resend batch limit)
    const BATCH = 50
    let sent = 0
    for (let i = 0; i < contacts.length; i += BATCH) {
      const batch = contacts.slice(i, i + BATCH)
      await Promise.all(
        batch.map((c) =>
          resend.emails.send({
            from: FROM,
            to: c.email,
            subject,
            html: buildHtml(subject, bodyHtml, c.email),
          })
        )
      )
      sent += batch.length
    }

    return NextResponse.json({ sent, total: contacts.length })
  } catch (err) {
    console.error('[newsletter/send]', err)
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 })
  }
}

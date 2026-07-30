/**
 * POST /api/campaign/test
 * Sends a test email to a single address with the campaign HTML.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getResendClient } from '@/lib/resend'

const FROM   = 'Sander Dekker <studio@mynameissanderdekker.com>'

export async function POST(req: NextRequest) {
  const resend = getResendClient()
  const { subject, html, to } = await req.json()

  if (!subject || !html || !to) {
    return NextResponse.json({ error: 'subject, html en to zijn verplicht' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `[TEST] ${subject}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

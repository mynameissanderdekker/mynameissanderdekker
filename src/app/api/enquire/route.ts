import { NextRequest, NextResponse } from 'next/server'
import { getResendClient } from '@/lib/resend'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const TO = 'Sander Dekker <hello@mynameissanderdekker.com>'

export async function POST(req: NextRequest) {
  try {
    const resend = getResendClient()
    const { name, email, phone, message, newsletter, artworkTitle, artworkSlug, viewingRoomSlug } =
      await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Naam, e-mail en bericht zijn verplicht' }, { status: 400 })
    }

    const subject = artworkTitle
      ? `Interesse: ${artworkTitle}`
      : 'Interesse in een werk'

    const lines = [
      `Naam: ${name}`,
      `E-mail: ${email}`,
      phone ? `Telefoon: ${phone}` : null,
      '',
      `Bericht:`,
      message,
      '',
      artworkTitle ? `Werk: ${artworkTitle}` : null,
      artworkSlug ? `URL: https://mynameissanderdekker.com/projects/innate-curiosity/${artworkSlug}` : null,
      viewingRoomSlug ? `Viewing Room: https://mynameissanderdekker.com/room/${viewingRoomSlug}` : null,
      newsletter ? `Nieuwsbrief: Ja` : null,
    ].filter((l): l is string => l !== null)

    await resend.emails.send({
      from: 'Studio <studio@mynameissanderdekker.com>',
      to: TO,
      replyTo: email,
      subject,
      text: lines.join('\n'),
      html: `<pre style="font-family:sans-serif;font-size:14px;line-height:1.6">${lines.join('\n')}</pre>`,
    })

    // If newsletter checked, subscribe them to the contact list
    if (newsletter && email) {
      try {
        const existing = await sanity.fetch(
          `*[_type == "contact" && email == $email][0]{ _id, subscribed }`,
          { email }
        )
        if (!existing) {
          await sanity.create({
            _type: 'contact',
            email,
            firstName: name.split(' ')[0] ?? '',
            lastName: name.split(' ').slice(1).join(' ') ?? '',
            subscribed: true,
            subscribedAt: new Date().toISOString(),
            source: artworkTitle ? `enquiry: ${artworkTitle}` : 'enquiry form',
            type: 'collector',
          })
        } else if (!existing.subscribed) {
          await sanity.patch(existing._id).set({
            subscribed: true,
            subscribedAt: new Date().toISOString(),
          }).commit()
        }
      } catch (crmErr) {
        // CRM update failure shouldn't fail the whole request
        console.error('[enquire/crm]', crmErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/enquire]', err)
    return NextResponse.json({ error: 'Er ging iets mis. Probeer het later opnieuw.' }, { status: 500 })
  }
}

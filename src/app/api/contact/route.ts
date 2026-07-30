import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const TO = 'Sander Dekker <hello@mynameissanderdekker.com>'

const SUBJECT_LABELS: Record<string, string> = {
  artwork:   'Artwork enquiry',
  interior:  'Interior & corporate art',
  brand:     'Brand & commercial',
  press:     'Press & media',
  exhibition:'Exhibition & collaboration',
  other:     'General enquiry',
}

export async function POST(req: NextRequest) {
  try {
    const {
      subject,
      name, email, phone, message, newsletter,
      // artwork
      artworkInterest,
      // interior / corporate
      spaceType, budget, timeline,
      // brand / commercial
      company, projectType,
      // press
      publication, topic,
      // exhibition
      venue,
    } = await req.json()

    if (!name || !email || !message || !subject) {
      return NextResponse.json({ error: 'Name, email, subject and message are required.' }, { status: 400 })
    }

    const subjectLabel = SUBJECT_LABELS[subject] ?? subject

    const lines = [
      `Subject: ${subjectLabel}`,
      `Name: ${name}`,
      `Email: ${email}`,
      phone       ? `Phone: ${phone}`               : null,
      // subject-specific fields
      artworkInterest ? `Artwork interest: ${artworkInterest}` : null,
      spaceType   ? `Type of space: ${spaceType}`   : null,
      budget      ? `Budget: ${budget}`              : null,
      timeline    ? `Timeline: ${timeline}`          : null,
      company     ? `Company / brand: ${company}`    : null,
      projectType ? `Project type: ${projectType}`  : null,
      publication ? `Publication: ${publication}`   : null,
      topic       ? `Topic: ${topic}`               : null,
      venue       ? `Venue / organisation: ${venue}`: null,
      '',
      'Message:',
      message,
      '',
      newsletter  ? 'Newsletter: Yes'               : null,
    ].filter((l): l is string => l !== null)

    await resend.emails.send({
      from: 'Studio <studio@mynameissanderdekker.com>',
      to: TO,
      replyTo: email,
      subject: `[${subjectLabel}] ${name}`,
      text: lines.join('\n'),
      html: `<pre style="font-family:sans-serif;font-size:14px;line-height:1.6">${lines.join('\n')}</pre>`,
    })

    // Newsletter opt-in → Sanity CRM
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
            source: `contact form: ${subjectLabel}`,
            type: subject === 'interior' || subject === 'brand' ? 'gallery' : 'collector',
          })
        } else if (!existing.subscribed) {
          await sanity.patch(existing._id).set({
            subscribed: true,
            subscribedAt: new Date().toISOString(),
          }).commit()
        }
      } catch (err) {
        console.error('[contact/crm]', err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/contact]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}

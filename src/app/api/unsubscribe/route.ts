/**
 * GET /api/unsubscribe?token=<base64url-contact-id>
 *
 * Marks a contact as unsubscribed in Sanity and shows a confirmation page.
 * The token is simply base64url(contactId) — no HMAC needed since
 * unsubscribing has no sensitive side-effects.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return html('Ongeldige link', 'Er ontbreekt een token in de link.')
  }

  let contactId: string
  try {
    contactId = Buffer.from(token, 'base64url').toString('utf-8')
  } catch {
    return html('Ongeldige link', 'De link is niet geldig.')
  }

  // Verify it's a real contact
  const contact = await sanity.fetch<{ _id: string; email?: string } | null>(
    `*[_type == "contact" && _id == $id][0]{ _id, email }`,
    { id: contactId }
  )

  if (!contact) {
    return html('Niet gevonden', 'We konden je gegevens niet vinden.')
  }

  // Already unsubscribed is fine — just confirm
  await sanity
    .patch(contact._id)
    .set({ subscribed: false, unsubscribedAt: new Date().toISOString() })
    .commit()

  return html(
    'Uitgeschreven',
    `Je bent uitgeschreven. Je ontvangt geen mails meer van Sander Dekker.`
  )
}

function html(title: string, message: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} — Sander Dekker</title>
  <style>
    body { margin: 0; padding: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
           background: #f5f5f3; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; }
    .card { background: #fff; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; }
    h1 { font-size: 22px; font-weight: 400; margin: 0 0 16px; color: #111; }
    p  { font-size: 15px; line-height: 1.7; color: #666; margin: 0 0 24px; }
    a  { color: #111; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;
         text-decoration: none; border-bottom: 1px solid #111; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://mynameissanderdekker.com">Terug naar de site</a>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

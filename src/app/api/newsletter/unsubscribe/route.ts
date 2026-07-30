import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return new Response('<p>Ongeldige link.</p>', { headers: { 'Content-Type': 'text/html' } })
  }

  try {
    const sanity = getSanityWriteClient()
    const contact = await sanity.fetch(
      `*[_type == "contact" && email == $email][0]{ _id }`,
      { email }
    )
    if (contact) {
      await sanity.patch(contact._id).set({
        subscribed: false,
        unsubscribedAt: new Date().toISOString(),
      }).commit()
    }
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
        <h2>Uitgeschreven</h2>
        <p>Je ontvangt geen nieuwsbrieven meer van Sander Dekker.</p>
        <a href="https://mynameissanderdekker.com">Terug naar de website</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    console.error('[newsletter/unsubscribe]', err)
    return new Response('<p>Er ging iets mis. Probeer het later opnieuw.</p>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

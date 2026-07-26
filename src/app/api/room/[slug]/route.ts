import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const QUERY = `
  *[_type == "viewingRoom" && slug.current == $slug][0] {
    title,
    description,
    isPublished,
    password,
    expiresAt,
    showPrices,
    "artworks": artworks[] {
      _key,
      contextNote,
      "artwork": artwork-> {
        _id,
        title,
        year,
        medium,
        status,
        priceExclVAT,
        vatRate,
        editionTotal,
        editionAP,
        dimensions,
        "slug": slug.current,
        "image": images[0].asset->url,
        "editionRecords": editionRecords[] { number, status }
      }
    }
  }
`

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const passwordAttempt = req.nextUrl.searchParams.get('password')

  try {
    const room = await sanity.fetch(QUERY, { slug })

    if (!room) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    }

    if (!room.isPublished) {
      return NextResponse.json({ error: 'Deze selectie is niet actief' }, { status: 404 })
    }

    if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Deze selectie is verlopen' }, { status: 410 })
    }

    if (room.password && room.password !== passwordAttempt) {
      return NextResponse.json({ requiresPassword: true }, { status: 401 })
    }

    // Strip private fields before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...publicRoom } = room
    return NextResponse.json(publicRoom)
  } catch (err) {
    console.error('[api/room]', err)
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 })
  }
}

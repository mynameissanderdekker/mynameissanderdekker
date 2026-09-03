import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})
const builder = imageUrlBuilder(client)
const urlFor = (source: SanityImageSource) => builder.image(source)

/**
 * De werken van een prijslijst — pas ná het wachtwoord.
 *
 * Wat er stond: de pagina haalde het wachtwoord **en alle werken met prijzen**
 * op en gaf ze mee aan een client-component, die in de browser vergeleek. Wie
 * de link had kon de complete prijslijst uit de paginabron lezen zonder iets in
 * te tikken — inclusief het wachtwoord zelf.
 *
 * Zelfde oplossing als in de gallery-template: de werken blijven op de server
 * tot iemand het juiste wachtwoord stuurt.
 */
const ARTWORKS = `artworks[]{
  priceOverride,
  note,
  artwork->{
    _id, title, year, medium, dimensions,
    "priceExclVAT": select(defined(priceIncVat) => round(priceIncVat / (1 + select(vatRate == "21" => 21, vatRate == "0" => 0, 9) / 100) * 100) / 100, priceExclVAT),
    priceIncVat, vatRate, images,
  }
}`

function gelijk(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { password } = await req.json().catch(() => ({ password: '' }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sale = await (client.fetch as any)(
    `*[_type == "privateSale" && token == $token && isActive == true][0]{ password, expiresAt }`,
    { token }
  )

  if (!sale) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  if (sale.expiresAt && new Date(sale.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Deze lijst is verlopen' }, { status: 410 })
  }
  if (sale.password && (!password || !gelijk(String(password), sale.password))) {
    return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vol = await (client.fetch as any)(
    `*[_type == "privateSale" && token == $token && isActive == true][0]{ ${ARTWORKS} }`,
    { token }
  )

  const artworks = (vol?.artworks ?? []).map((item: {
    artwork: { images?: { asset?: SanityImageSource }[] } & Record<string, unknown>
  }) => {
    const img = item.artwork?.images?.[0]
    return { ...item, imageUrl: img ? urlFor(img).width(800).height(800).fit('max').url() : null }
  })

  return NextResponse.json({ ok: true, artworks })
}

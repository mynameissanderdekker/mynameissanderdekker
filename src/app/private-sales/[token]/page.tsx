import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import PrivateSaleClient from './PrivateSaleClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PrivateSalePage({ params }: Props) {
  const { token } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sale = await (client.fetch as any)(
    `*[_type == "privateSale" && token == $token && isActive == true][0]{
      _id,
      title,
      recipientName,
      password,
      expiresAt,
      introText,
      footerText,
      artworks[]{
        priceOverride,
        note,
        artwork->{
          _id,
          title,
          year,
          medium,
          dimensions,
          "priceExclVAT": select(defined(priceIncVat) => round(priceIncVat / (1 + select(vatRate == "21" => 21, vatRate == "0" => 0, 9) / 100) * 100) / 100, priceExclVAT),
          priceIncVat,
          vatRate,
          images,
        }
      }
    }`,
    { token }
  )

  if (!sale) notFound()

  // Check expiry
  if (sale.expiresAt && new Date(sale.expiresAt) < new Date()) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 14, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>This selection has expired</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>Please contact the gallery for an updated link.</p>
        </div>
      </main>
    )
  }

  // Build image URLs server-side
  const artworksWithUrls = (sale.artworks ?? []).map((item: {
    artwork: { images?: { asset?: SanityImageSource }[] } & Record<string, unknown>
    priceOverride?: number
    note?: string
  }) => {
    const img = item.artwork?.images?.[0]
    return {
      ...item,
      imageUrl: img ? urlFor(img).width(800).height(800).fit('max').url() : null,
    }
  })

  return (
    <PrivateSaleClient
      sale={{ ...sale, artworks: artworksWithUrls }}
      requiresPassword={!!sale.password}
      correctPassword={sale.password ?? null}
    />
  )
}

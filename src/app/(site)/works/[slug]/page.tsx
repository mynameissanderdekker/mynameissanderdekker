import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import ArtworkDetail, { type ArtworkData } from '@/components/ArtworkDetail'

// ── Sanity query ──────────────────────────────────────────────────────────────

async function getArtwork(slug: string): Promise<ArtworkData | null> {
  return client.fetch(
    `*[_type == "artwork" && slug.current == $slug][0]{
      _id,
      title,
      year,
      medium,
      dimensions,
      dimensionsExclFrame,
      images[]{ asset->{ _id, url }, hotspot, crop },
      priceExclVAT,
      vatRate,
      options,
      status,
      showInWebshop,
      "roomImageUrl": roomImage.asset->url,
      showViewInRoom,
      framedDimensions,
      buyUrl,
      editionTotal,
      editionAP,
      slug,
      description
    }`,
    { slug },
    { next: { revalidate: false } },
  )
}

async function getAllSlugs(): Promise<string[]> {
  const rows = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "artwork" && defined(slug.current)]{ slug }`,
    {},
    { next: { revalidate: false } },
  )
  return rows.map(r => r.slug.current)
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs()
    return slugs.map(slug => ({ slug }))
  } catch { return [] }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artwork = await getArtwork(slug)

  if (!artwork) notFound()

  const artworkSchema = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    creator: {
      '@type': ['Person', 'Artist'],
      name: 'Sander Dekker',
      url: 'https://www.mynameissanderdekker.com',
    },
    dateCreated: artwork.year?.toString(),
    artMedium: artwork.medium,
    url: `https://www.mynameissanderdekker.com/works/${slug}`,
    ...(artwork.images?.[0]?.asset?.url ? { image: artwork.images[0].asset.url } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artworkSchema) }}
      />
      <ArtworkDetail artwork={artwork} />
    </>
  )
}

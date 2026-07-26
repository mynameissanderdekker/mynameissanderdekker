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
      images[]{ asset->{ _id, url }, hotspot, crop },
      priceExclVAT,
      vatRate,
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
    { next: { revalidate: 60 } },
  )
}

async function getAllSlugs(): Promise<string[]> {
  const rows = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "artwork" && defined(slug.current)]{ slug }`,
    {},
    { next: { revalidate: 3600 } },
  )
  return rows.map(r => r.slug.current)
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artwork = await getArtwork(slug)

  if (!artwork) notFound()

  return <ArtworkDetail artwork={artwork} />
}

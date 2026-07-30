import { client } from '@/sanity/lib/client'
import { WorksAllClient } from '@/components/WorksAllClient'

export interface ArtworkItem {
  _id: string
  title: string
  year?: number
  slug: { current: string }
  mainImage?: { url?: string }
  priceExclVAT?: number
  vatRate?: number
  options?: Array<{ priceExclVAT?: number }>
  status?: string
  category?: string
  featured?: boolean
}

async function getAllWorks(): Promise<{ works: ArtworkItem[]; categories: string[] }> {
  const [works, categories] = await Promise.all([
    client.fetch<ArtworkItem[]>(
      `*[_type == "artwork" && defined(slug.current) && showInWebshop == true] | order(featured desc, year desc){
        _id, title, year, slug,
        "mainImage": images[0].asset->{ url },
        priceExclVAT, vatRate, "options": options[]{priceExclVAT}, status, category, featured
      }`,
      {},
      { next: { revalidate: false } },
    ),
    client.fetch<string[]>(
      `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`,
      {},
      { next: { revalidate: false } },
    ),
  ])

  return { works, categories }
}

export default async function WorksAllPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const { works, categories } = await getAllWorks()

  return (
    <WorksAllClient
      works={works}
      categories={categories}
      initialCat={cat}
    />
  )
}

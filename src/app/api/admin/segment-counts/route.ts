/**
 * GET /api/admin/segment-counts
 * Returns the number of contacts per segment.
 */
import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'

const SEGMENTS = [
  { value: 'newsletter',  filter: `subscribed == true` },
  { value: 'collectors',  filter: `type == "collector" && subscribed != false` },
  { value: 'buyers_low',  filter: `count(purchases[price < 500]) > 0 && subscribed != false` },
  { value: 'galleries',   filter: `type == "gallery" && subscribed != false` },
  { value: 'all',         filter: `defined(email)` },
]

export async function GET() {
  try {
    const sanity = getSanityWriteClient()
    const counts = await Promise.all(
      SEGMENTS.map(async ({ value, filter }) => {
        const count = await sanity.fetch<number>(
          `count(*[_type == "contact" && defined(email) && (${filter})])`
        )
        return { value, count }
      })
    )
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json([])
  }
}

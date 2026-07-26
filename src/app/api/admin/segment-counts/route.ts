/**
 * GET /api/admin/segment-counts
 * Returns the number of contacts per segment.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_WRITE_TOKEN,
})

const SEGMENTS = [
  { value: 'newsletter',  filter: `subscribed == true` },
  { value: 'collectors',  filter: `type == "collector" && subscribed != false` },
  { value: 'buyers_low',  filter: `count(purchases[price < 500]) > 0 && subscribed != false` },
  { value: 'galleries',   filter: `type == "gallery" && subscribed != false` },
  { value: 'all',         filter: `defined(email)` },
]

export async function GET() {
  try {
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

export async function POST(req: NextRequest) {
  const { filter } = await req.json()
  if (!filter) return NextResponse.json({ count: 0 })
  try {
    const count = await sanity.fetch<number>(
      `count(*[_type == "contact" && defined(email) && (${filter})])`
    )
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

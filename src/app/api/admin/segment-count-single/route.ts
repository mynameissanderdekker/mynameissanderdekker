import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'

export async function POST(req: NextRequest) {
  const { filter } = await req.json()
  if (!filter) return NextResponse.json({ count: 0 })
  try {
    const sanity = getSanityWriteClient()
    const count = await sanity.fetch<number>(
      `count(*[_type == "contact" && defined(email) && (${filter})])`
    )
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

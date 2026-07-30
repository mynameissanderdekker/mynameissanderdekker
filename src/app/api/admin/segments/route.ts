/**
 * GET  /api/admin/segments  — fetch all custom segments
 * POST /api/admin/segments  — create a new segment
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'

function auth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sanity = getSanityWriteClient()
  const segments = await sanity.fetch(
    `*[_type == "campaignSegment"] | order(_createdAt asc){ _id, name, conditions }`
  )
  return NextResponse.json(segments)
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sanity = getSanityWriteClient()
  const { name, conditions } = await req.json()
  if (!name || !conditions) return NextResponse.json({ error: 'name + conditions verplicht' }, { status: 400 })

  const doc = await sanity.create({ _type: 'campaignSegment', name, conditions })
  return NextResponse.json(doc)
}

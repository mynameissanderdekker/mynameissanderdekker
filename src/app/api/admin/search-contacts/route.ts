import { NextRequest, NextResponse } from 'next/server'
import { isValidAdminCookie } from '@/lib/adminAuth'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  if (!isValidAdminCookie(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const results = await client.fetch(
    `*[_type == "contact" && (
      firstName match $q || lastName match $q || email match $q ||
      pt::text(firstName + " " + lastName) match $q
    )][0...10]{
      _id, firstName, lastName, email, company
    }`,
    { q: `${q}*` }
  )

  return NextResponse.json(results)
}

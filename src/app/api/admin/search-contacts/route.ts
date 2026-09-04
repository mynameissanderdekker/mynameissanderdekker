import { NextRequest, NextResponse } from 'next/server'
import { isValidAdminCookie } from '@/lib/adminAuth'
import { createClient } from '@sanity/client'
import { contactSearchFilter } from '@/lib/contactSearch'

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

  // Per woord, zie lib/contactSearch.ts — "Tessa Testklant" vond hier niets.
  const { filter, params } = contactSearchFilter(q)
  const results = await client.fetch(
    `*[_type == "contact" && !(_id in path("drafts.**")) && ${filter}][0...10]{
      _id, firstName, lastName, email, company
    }`,
    params
  )

  return NextResponse.json(results)
}

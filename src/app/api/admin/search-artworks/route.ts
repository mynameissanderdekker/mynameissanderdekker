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
    `*[_type == "artwork" && title match $q][0...15]{
      _id, title, year, medium, editionTotal, editionAP,
      "priceExclVAT": select(defined(priceIncVat) => round(priceIncVat / (1 + select(vatRate == "21" => 21, vatRate == "0" => 0, 9) / 100) * 100) / 100, priceExclVAT),
      priceIncVat, vatRate, status
    } | order(year desc)`,
    { q: `${q}*` }
  )

  return NextResponse.json(results)
}

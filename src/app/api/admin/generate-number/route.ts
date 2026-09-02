import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { nextNumber } from '@/lib/nextNumber'

const sanityRead = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

/**
 * GET /api/admin/generate-number?type=proposal|invoice
 *
 * Factuur:  SDK-26-001
 * Offerte:  PROP-SDK-26-001
 *
 * De regel zelf staat in `src/lib/nextNumber.ts`, omdat de webshop hem ook
 * nodig heeft en daar geen HTTP-route kan aanroepen.
 */
export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get('admin_session')?.value ?? ''
  const sanityToken = req.headers.get('x-sanity-token') ?? ''
  if (adminCookie !== process.env.ADMIN_PASSWORD && !sanityToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') === 'proposal' ? 'proposal' : 'invoice'
  const number = await nextNumber(sanityRead, { type })
  return NextResponse.json({ number })
}

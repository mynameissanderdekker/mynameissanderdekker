/**
 * GET /api/contacts/export?segment=newsletter
 *
 * Returns a CSV file with contacts for the given segment.
 * Auth: Bearer SANITY_WRITE_TOKEN header (same token as campaign send).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { SEGMENTS } from '@/sanity/schemas/campaign'

interface Contact {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  type?: string
  country?: string
  subscribed?: boolean
}

function escapeCsv(value: string | undefined | null): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(contacts: Contact[]): string {
  const header = ['First name', 'Last name', 'Email', 'Type', 'Country', 'Subscribed']
  const rows = contacts.map(c => [
    escapeCsv(c.firstName),
    escapeCsv(c.lastName),
    escapeCsv(c.email),
    escapeCsv(c.type),
    escapeCsv(c.country),
    c.subscribed === false ? 'no' : 'yes',
  ])
  return [header.join(','), ...rows.map(r => r.join(','))].join('\r\n')
}

export async function GET(req: NextRequest) {
  const sanity = getSanityWriteClient()
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SANITY_WRITE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const segment = req.nextUrl.searchParams.get('segment') ?? 'newsletter'

  const seg = SEGMENTS.find(s => s.value === segment)
  if (!seg) {
    return NextResponse.json({ error: `Unknown segment: ${segment}` }, { status: 400 })
  }

  const contacts = await sanity.fetch<Contact[]>(
    `*[_type == "contact" && defined(email) && (${seg.filter})]{
      _id, firstName, lastName, email, type, country, subscribed
    } | order(lastName asc)`
  )

  const csv = toCsv(contacts)
  const filename = `${segment}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

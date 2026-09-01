import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanityRead = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

/**
 * GET /api/admin/generate-number?type=proposal|invoice
 *
 * Het volgende nummer in de reeks, gekeken naar **zowel** orders als offertes,
 * zodat een nummer nooit twee keer wordt uitgegeven. Een offerte die een
 * verkoop wordt houdt zijn volgnummer: PROP-SDK-26-001 → SDK-26-001.
 *
 * Bewust het hóógste bestaande nummer als vertrekpunt, niet het aantal: bij
 * tellen levert een verwijderd document hetzelfde nummer nog een keer op.
 */
export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get('admin_session')?.value ?? ''
  const sanityToken = req.headers.get('x-sanity-token') ?? ''
  if (adminCookie !== process.env.ADMIN_PASSWORD && !sanityToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'invoice'
  const yy = String(new Date().getFullYear()).slice(-2)
  const prefix =
    (await sanityRead.fetch<string | null>(
      `*[_type == "siteSettings"][0].invoiceSettings.invoicePrefix`
    )) ?? 'SDK'
  const base = `${prefix}-${yy}-`

  // Twee velden, want de twee verkoopwegen zijn het oneens: de verkooptool
  // schrijft het nummer in `orderNumber`, de webshopfactuur in `invoiceNumber`.
  // Naar één van beide kijken levert een nummer op dat al bestaat.
  const [lastOrderNumber, lastInvoiceNumber, lastProposal] = await Promise.all([
    sanityRead.fetch<string | null>(
      `*[_type == "order" && orderNumber match $p] | order(orderNumber desc)[0].orderNumber`,
      { p: `${base}*` }
    ),
    sanityRead.fetch<string | null>(
      `*[_type == "order" && invoiceNumber match $p] | order(invoiceNumber desc)[0].invoiceNumber`,
      { p: `${base}*` }
    ),
    sanityRead.fetch<string | null>(
      `*[_type == "proposal" && proposalNumber match $p] | order(proposalNumber desc)[0].proposalNumber`,
      { p: `PROP-${base}*` }
    ),
  ])

  const seqFrom = (s: string | null) => {
    if (!s) return 0
    const n = parseInt(s.split('-').pop() ?? '0', 10)
    return isNaN(n) ? 0 : n
  }

  const next = Math.max(seqFrom(lastOrderNumber), seqFrom(lastInvoiceNumber), seqFrom(lastProposal)) + 1
  const seq = String(next).padStart(3, '0')

  const number = type === 'proposal' ? `PROP-${base}${seq}` : `${base}${seq}`
  return NextResponse.json({ number })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const TORCH_PROJECT_ID = '53tz2hh0'
const TORCH_DATASET    = 'production'
const MNSDK_PROJECT_ID = 'u11u127q'
const MNSDK_DATASET    = 'production'

// Auth: Vercel cron (Authorization: Bearer $CRON_SECRET, sent automatically by
// Vercel Cron), admin session cookie, or a valid Sanity Studio session token
// (for manual triggers from Studio — same check used by the other Torch routes).
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader  = req.headers.get('authorization')
  const session     = req.cookies.get('admin_session')?.value
  const sanityToken = req.headers.get('x-sanity-token')

  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true
  if (session === process.env.ADMIN_PASSWORD) return true

  if (sanityToken) {
    try {
      const check = await fetch(`https://${MNSDK_PROJECT_ID}.api.sanity.io/v1/users/me`, {
        headers: { Authorization: `Bearer ${sanityToken}` },
      })
      if (check.ok) return true
    } catch { /* network error → unauthorized */ }
  }
  return false
}

// ── GET: nightly cron entrypoint (called by Vercel cron) ──────────────────────
// ── POST: manual trigger from Studio or admin panel ───────────────────────────
export async function GET(req: NextRequest)  { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

async function run(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mnsdkToken = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN
  const torchToken = process.env.TORCH_WRITE_TOKEN
  if (!torchToken) {
    return NextResponse.json({ error: 'TORCH_WRITE_TOKEN not configured' }, { status: 500 })
  }

  const mnsdkClient = createClient({
    projectId: MNSDK_PROJECT_ID,
    dataset:   MNSDK_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: mnsdkToken,
  })

  const torchClient = createClient({
    projectId: TORCH_PROJECT_ID,
    dataset:   TORCH_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: torchToken,
  })

  // Fetch all MNSDK artworks that have been synced to Torch
  const artworks = await mnsdkClient.fetch<Array<{
    _id: string
    title: string
    torchId: string
    torchSoldCount?: number
    status?: string
    editionType?: string
    editionTotal?: number
  }>>(
    `*[_type == "artwork" && defined(torchId) && !(_id in path("drafts.**"))] {
      _id, title, torchId, torchSoldCount, status, editionType, editionTotal
    }`
  )

  const results: Array<{ artworkId: string; title: string; status: 'updated' | 'skipped' | 'error'; detail?: string }> = []

  for (const artwork of artworks) {
    try {
      // Resolve Torch artwork ID from torchId (may be "sub:submissionId:workKey" or bare artworkId)
      let torchArtworkId: string | null = null

      if (artwork.torchId.startsWith('sub:')) {
        const [, submissionId, workKey] = artwork.torchId.split(':')
        const submission = await torchClient.fetch<{ work: { artworkId?: string } } | null>(
          `*[_type == "artistSubmission" && _id == $id][0]{
            "work": works[_key == $key][0]{ artworkId }
          }`,
          { id: submissionId, key: workKey }
        )
        torchArtworkId = submission?.work?.artworkId ?? null
      } else {
        torchArtworkId = artwork.torchId
      }

      if (!torchArtworkId) {
        results.push({ artworkId: artwork._id, title: artwork.title, status: 'skipped', detail: 'Not yet approved in Torch' })
        continue
      }

      // ── Fetch current mnsdkSoldCount (artist's own sales in MNSDK) ───────────
      const mnsdkBuyers = await mnsdkClient.fetch<Array<{ count: number }>>(
        `*[_type == "contact" && $id in purchases[].artwork._ref]{
          "count": count(purchases[artwork._ref == $id])
        }`,
        { id: artwork._id }
      )
      const currentMnsdkSoldCount = mnsdkBuyers.reduce((sum, b) => sum + b.count, 0)

      // ── Fetch ONLY sales data from Torch — not prices or other editable fields
      const torchData = await torchClient.fetch<{
        artworkStatus: string
        mnsdkSoldCount: number
        buyers: Array<{ purchases: unknown[] }>
      }>(
        `{
          "artworkStatus": *[_type == "artwork" && _id == $id][0].status,
          "mnsdkSoldCount": *[_type == "artwork" && _id == $id][0].mnsdkSoldCount,
          "buyers": *[_type == "contact" && $id in purchases[].artwork._ref]{
            "purchases": purchases[artwork._ref == $id]{ _key }
          }
        }`,
        { id: torchArtworkId }
      )

      const torchSoldCount = torchData.buyers.reduce((sum, b) => sum + b.purchases.length, 0)

      // ── Push mnsdkSoldCount TO Torch if it changed ────────────────────────────
      if (currentMnsdkSoldCount !== (torchData.mnsdkSoldCount ?? 0)) {
        await torchClient.patch(torchArtworkId).set({ mnsdkSoldCount: currentMnsdkSoldCount }).commit()
      }

      // ── Pull torchSoldCount + status TO MNSDK ─────────────────────────────────
      const patch: Record<string, unknown> = { torchSoldCount }

      // Update status ONLY if Torch signals sold and MNSDK isn't already
      if (torchData.artworkStatus === 'sold' && artwork.status !== 'sold') {
        patch.status = 'sold'
      }

      const mnsdkChanged = torchSoldCount !== (artwork.torchSoldCount ?? 0) || patch.status !== undefined

      if (mnsdkChanged) {
        await mnsdkClient.patch(artwork._id).set(patch).commit()
      }

      const torchChanged = currentMnsdkSoldCount !== (torchData.mnsdkSoldCount ?? 0)

      if (mnsdkChanged || torchChanged) {
        results.push({
          artworkId: artwork._id,
          title: artwork.title,
          status: 'updated',
          detail: [
            torchChanged  ? `mnsdkSoldCount → Torch: ${currentMnsdkSoldCount}` : null,
            mnsdkChanged  ? `torchSoldCount → MNSDK: ${torchSoldCount}` : null,
            patch.status  ? `status → sold` : null,
          ].filter(Boolean).join(', '),
        })
      } else {
        results.push({ artworkId: artwork._id, title: artwork.title, status: 'skipped', detail: 'No changes' })
      }

    } catch (err) {
      results.push({
        artworkId: artwork._id,
        title: artwork.title,
        status: 'error',
        detail: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const updated = results.filter(r => r.status === 'updated').length
  const errors  = results.filter(r => r.status === 'error').length

  return NextResponse.json({
    success: true,
    ran: new Date().toISOString(),
    total: artworks.length,
    updated,
    errors,
    results,
  })
}

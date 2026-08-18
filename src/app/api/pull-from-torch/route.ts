import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const TORCH_PROJECT_ID = '53tz2hh0'
const TORCH_DATASET   = 'production'
const MNSDK_PROJECT_ID = 'u11u127q'

// ── Auth ───────────────────────────────────────────────────────────────────────

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session     = req.cookies.get('admin_session')?.value
  const sanityToken = req.headers.get('x-sanity-token')

  if (session === process.env.ADMIN_PASSWORD) return true

  if (sanityToken) {
    try {
      const check = await fetch(`https://${MNSDK_PROJECT_ID}.api.sanity.io/v1/users/me`, {
        headers: { Authorization: `Bearer ${sanityToken}` },
      })
      return check.ok
    } catch { /* network error → unauthorized */ }
  }
  return false
}

// ── POST ───────────────────────────────────────────────────────────────────────
//
// Body: { torchId: string }
//
// torchId can be in two formats:
//   "sub:{submissionDocId}:{workKey}"  → pending submission (not yet an artwork)
//   "{artworkDocId}"                   → approved artwork
//
// Returns submission status or artwork sales data depending on format.

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { torchId } = await req.json()
  if (!torchId) {
    return NextResponse.json({ error: 'torchId required' }, { status: 400 })
  }

  const torchToken = process.env.TORCH_WRITE_TOKEN
  if (!torchToken) {
    return NextResponse.json({ error: 'TORCH_WRITE_TOKEN not configured' }, { status: 500 })
  }

  const torchClient = createClient({
    projectId: TORCH_PROJECT_ID,
    dataset:   TORCH_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: torchToken,
  })

  // ── Submission mode: "sub:{docId}:{workKey}" ───────────────────────────────
  if (torchId.startsWith('sub:')) {
    const [, submissionId, workKey] = torchId.split(':')

    const submission = await torchClient.fetch(
      `*[_type == "artistSubmission" && _id == $id][0]{
        _id, title, status,
        "work": works[_key == $key][0]{
          _key, title, year, status, artworkId,
          editionType, editionTotal, editionAP
        }
      }`,
      { id: submissionId, key: workKey }
    )

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found in Torch' }, { status: 404 })
    }

    const work = submission.work
    if (!work) {
      return NextResponse.json({ error: 'Work not found in submission' }, { status: 404 })
    }

    // If the work was approved and has an artworkId, also fetch artwork + buyers
    if (work.artworkId) {
      const result = await torchClient.fetch(
        `{
          "artwork": *[_type == "artwork" && _id == $id][0]{
            _id, title, status, editionType, editionTotal, editionAP, priceIncVat, vatRate
          },
          "buyers": *[_type == "contact" && $id in purchases[].artwork._ref]{
            firstName, lastName, email,
            "purchases": purchases[artwork._ref == $id]{
              copyNumber, soldVia, editionNumber, price
            }
          } | order(lastName asc)
        }`,
        { id: work.artworkId }
      )

      const soldCount = (result.buyers as Array<{ purchases: unknown[] }>)
        .reduce((sum: number, b) => sum + b.purchases.length, 0)

      return NextResponse.json({
        mode: 'artwork',
        submissionStatus: work.status,
        artwork: result.artwork,
        buyers: result.buyers,
        soldCount,
        available: result.artwork?.editionTotal != null
          ? Math.max(0, result.artwork.editionTotal - soldCount - (result.artwork.mnsdkSoldCount ?? 0))
          : null,
      })
    }

    // Still pending/rejected — return submission info only
    return NextResponse.json({
      mode: 'submission',
      submissionId: submission._id,
      submissionTitle: submission.title,
      submissionStatus: submission.status, // open / submitted / reviewed
      workStatus: work.status,             // pending / approved / rejected
      work: {
        title: work.title,
        year: work.year,
        editionType: work.editionType,
        editionTotal: work.editionTotal,
        editionAP: work.editionAP,
      },
    })
  }

  // ── Artwork mode: bare artwork doc ID (legacy / already approved) ──────────
  const result = await torchClient.fetch(
    `{
      "artwork": *[_type == "artwork" && _id == $id][0]{
        _id, title, status, editionType, editionTotal, editionAP, mnsdkSoldCount, priceIncVat, vatRate
      },
      "buyers": *[_type == "contact" && $id in purchases[].artwork._ref]{
        firstName, lastName, email,
        "purchases": purchases[artwork._ref == $id]{
          copyNumber, soldVia, editionNumber, price
        }
      } | order(lastName asc)
    }`,
    { id: torchId }
  )

  if (!result.artwork) {
    return NextResponse.json({ error: 'Artwork not found in Torch' }, { status: 404 })
  }

  const soldCount = (result.buyers as Array<{ purchases: unknown[] }>)
    .reduce((sum: number, b) => sum + b.purchases.length, 0)

  return NextResponse.json({
    mode: 'artwork',
    artwork: result.artwork,
    buyers: result.buyers,
    soldCount,
    available: result.artwork.editionTotal != null
      ? Math.max(0, result.artwork.editionTotal - soldCount - (result.artwork.mnsdkSoldCount ?? 0))
      : null,
  })
}

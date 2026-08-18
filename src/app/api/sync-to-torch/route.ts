import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const TORCH_PROJECT_ID  = '53tz2hh0'
const TORCH_DATASET     = 'production'
const MNSDK_PROJECT_ID  = 'u11u127q'
const MNSDK_DATASET     = 'production'

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

// ── POST: sync one or more artworks → creates an artistSubmission in Torch ─────
//
// Body: { artworkIds: string[] }  (also accepts legacy { artworkId: string })
//
// Instead of creating artwork documents directly, this route creates an
// artistSubmission document. This shows up in Torch's dashboard "Work Submitted
// by Artists" section so the gallery can review, approve, and link to an expo.
//
// torchId stored on MNSDK: "sub:{submissionDocId}:{workKey}"
// After Torch approves, artworkId is set on the submittedWork and can be pulled.

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // Support single artworkId (legacy) and array of artworkIds (bulk)
    const artworkIds: string[] = body.artworkIds
      ?? (body.artworkId ? [body.artworkId] : [])

    if (artworkIds.length === 0) {
      return NextResponse.json({ error: 'artworkIds required' }, { status: 400 })
    }

    const torchToken = process.env.TORCH_WRITE_TOKEN
    const mnsdkWriteToken = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN
    if (!torchToken) {
      return NextResponse.json({ error: 'TORCH_WRITE_TOKEN not configured' }, { status: 500 })
    }

    // MNSDK dataset is public — reads work without a token.
    // An invalid token would block even public reads, so we use separate clients:
    // mnsdkReadClient  — no token, for all fetch() calls
    // mnsdkWriteClient — write token, only for patch().commit()
    const mnsdkReadClient = createClient({
      projectId: MNSDK_PROJECT_ID,
      dataset:   MNSDK_DATASET,
      apiVersion: '2024-01-01',
      useCdn: false,
    })

    const mnsdkWriteClient = createClient({
      projectId: MNSDK_PROJECT_ID,
      dataset:   MNSDK_DATASET,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: mnsdkWriteToken,
    })

    const torchClient = createClient({
      projectId: TORCH_PROJECT_ID,
      dataset:   TORCH_DATASET,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: torchToken,
    })

    // ── Fetch artworks from MNSDK (incl. sold count from buyer contacts) ─────────
    console.log('[sync] step1: fetching artworks from MNSDK (no token)')
    const artworks = await mnsdkReadClient.fetch(
      `*[_type == "artwork" && _id in $ids] {
        _id, title, year, medium,
        dimensions { widthCm, heightCm, depthCm },
        category,
        editionType, editionTotal, editionAP, editionNumber,
        "images": images[] { "url": asset->url },
        priceIncVat, vatRate,
        "mnsdkSoldCount": count(*[_type == "contact" && ^._id in purchases[].artwork._ref][].purchases[artwork._ref == ^._id]),
        description,
        status
      }`,
      { ids: artworkIds }
    )
    console.log('[sync] step1 done:', artworks?.length, 'artworks')

    if (!artworks || artworks.length === 0) {
      return NextResponse.json({ error: 'No artworks found in MNSDK' }, { status: 404 })
    }

    // ── Find Sander Dekker in Torch ────────────────────────────────────────────
    console.log('[sync] step2: querying Torch artist (torch token len:', torchToken?.length, ')')
    const torchArtist = await torchClient.fetch<{ _id: string } | null>(
      `*[_type == "artist" && lower(name) match "sander*"][0] { _id }`
    )
    console.log('[sync] step2 done: artist', torchArtist?._id ?? 'not found')

    // ── Build submittedWork entries ────────────────────────────────────────────
    type WorkEntry = {
      _type: string
      _key: string
      mnsdkId: string
      [key: string]: unknown
    }

    const works: WorkEntry[] = artworks.map((artwork: {
      _id: string; title?: string; year?: number; medium?: string;
      dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number };
      category?: string; editionType?: string; editionTotal?: number;
      editionAP?: number; priceIncVat?: number; vatRate?: string;
      description?: string; status?: string;
      images?: Array<{ url?: string }>;
    }) => {
      const key = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      const images = (artwork.images ?? [])
        .filter(img => img.url)
        .map((img, i) => ({
          _type: 'submittedImage',
          _key: `img${i}`,
          url: img.url,
          filename: (img.url ?? '').split('/').pop() ?? `image-${i}`,
        }))

      return {
        _type: 'submittedWork',
        _key: key,
        mnsdkId: artwork._id,
        title:       artwork.title,
        year:        artwork.year != null ? String(artwork.year) : undefined,
        medium:      artwork.medium,
        widthCm:     artwork.dimensions?.widthCm,
        heightCm:    artwork.dimensions?.heightCm,
        depthCm:     artwork.dimensions?.depthCm,
        category:    artwork.category,
        editionType: artwork.editionType,
        editionTotal: artwork.editionTotal,
        editionAP:   artwork.editionAP,
        priceExVat:  artwork.priceIncVat, // MNSDK stores incl. VAT; gallery can adjust
        vatRate:     artwork.vatRate,
        description: artwork.description,
        mnsdkSoldCount: (artwork as { mnsdkSoldCount?: number }).mnsdkSoldCount ?? 0,
        notes: [
          artwork.status ? `Status op MNSDK: ${artwork.status}` : null,
          (artwork as { mnsdkSoldCount?: number }).mnsdkSoldCount
            ? `Al verkocht door kunstenaar: ${(artwork as { mnsdkSoldCount?: number }).mnsdkSoldCount} ex.`
            : null,
          `MNSDK ID: ${artwork._id}`,
        ].filter(Boolean).join('\n'),
        images: images.length > 0 ? images : undefined,
        status: 'pending',
      }
    })

    // ── Create artistSubmission in Torch ───────────────────────────────────────
    const dateStr = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    const submissionTitle = works.length === 1
      ? `Sander Dekker — ${works[0].title ?? 'Artwork'} (${dateStr})`
      : `Sander Dekker — ${works.length} werken (${dateStr})`

    const submissionToken = crypto.randomUUID().replace(/-/g, '')

    const submission = await torchClient.create({
      _type: 'artistSubmission',
      title: submissionTitle,
      status: 'submitted',
      token: submissionToken,
      ...(torchArtist?._id ? { artist: { _type: 'reference', _ref: torchArtist._id } } : {}),
      works,
    })

    // ── Write torchId back to each MNSDK artwork ───────────────────────────────
    // Format: "sub:{submissionDocId}:{workKey}" — allows pull-from-torch to
    // locate this specific work within the submission.
    // Non-fatal: if write token is misconfigured the submission still succeeded.
    for (const work of works) {
      try {
        await mnsdkWriteClient
          .patch(work.mnsdkId as string)
          .set({ torchId: `sub:${submission._id}:${work._key}` })
          .commit()
      } catch (writeErr) {
        console.warn('[sync] torchId writeback failed for', work.mnsdkId, writeErr instanceof Error ? writeErr.message : writeErr)
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      count: works.length,
      // Return per-artwork mapping so the UI can update local state
      artworks: works.map(w => ({ mnsdkId: w.mnsdkId, workKey: w._key })),
    })

  } catch (err: unknown) {
    console.error('[sync-to-torch POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ── PATCH: write status back to MNSDK (used by PullFromTorchAction) ───────────

const ARTWORK_STATUS_VALUES = ['available', 'sold_out', 'on_loan', 'not_for_sale', 'enquire']

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { artworkId, patch } = await req.json()
  if (!artworkId || !patch) {
    return NextResponse.json({ error: 'artworkId and patch required' }, { status: 400 })
  }

  if (!patch.status || !ARTWORK_STATUS_VALUES.includes(patch.status) || Object.keys(patch).length !== 1) {
    return NextResponse.json({ error: 'Only a valid { status } patch is allowed' }, { status: 400 })
  }

  const patchReadClient = createClient({
    projectId: MNSDK_PROJECT_ID,
    dataset:   MNSDK_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  const patchWriteClient = createClient({
    projectId: MNSDK_PROJECT_ID,
    dataset:   MNSDK_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN,
  })

  const doc = await patchReadClient.fetch(
    `*[_type == "artwork" && _id == $id][0]{ _id }`,
    { id: artworkId }
  )
  if (!doc) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
  }

  await patchWriteClient.patch(artworkId).set({ status: patch.status }).commit()
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

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

    const mnsdkWriteToken = process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN
    const torchSyncKey    = process.env.TORCH_SYNC_KEY ?? 'torch-sync-mnsdk-2024'
    const torchBaseUrl    = process.env.TORCH_BASE_URL ?? 'https://torch-gallery.vercel.app'

    // MNSDK dataset is public — reads work without a token.
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

    // ── Fetch artworks from MNSDK ─────────────────────────────────────────────
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

    if (!artworks || artworks.length === 0) {
      return NextResponse.json({ error: 'No artworks found in MNSDK' }, { status: 404 })
    }

    // ── Build payload for Torch endpoint ──────────────────────────────────────

    // MNSDK stores description as Portable Text (array of blocks).
    // Convert to plain string so Torch's string field doesn't choke on it.
    function ptToPlainText(pt: unknown): string | undefined {
      if (!pt) return undefined
      if (typeof pt === 'string') return pt
      if (!Array.isArray(pt)) return undefined
      return pt
        .map((block: { children?: Array<{ text?: string }> }) =>
          (block.children ?? []).map(s => s.text ?? '').join('')
        )
        .filter(Boolean)
        .join('\n') || undefined
    }

    type ArtworkRaw = {
      _id: string; title?: string; year?: number; medium?: string;
      dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number };
      category?: string; editionType?: string; editionTotal?: number;
      editionAP?: number; priceIncVat?: number; vatRate?: string;
      description?: unknown; status?: string; mnsdkSoldCount?: number;
      images?: Array<{ url?: string }>;
    }

    const artworkPayload = (artworks as ArtworkRaw[]).map(artwork => ({
      mnsdkId:     artwork._id,
      title:       artwork.title,
      year:        artwork.year != null ? String(artwork.year) : undefined,
      medium:      artwork.medium,
      widthCm:     artwork.dimensions?.widthCm,
      heightCm:    artwork.dimensions?.heightCm,
      depthCm:     artwork.dimensions?.depthCm,
      category:    artwork.category,
      // If editionType isn't stored but editionTotal is set, infer 'edition'
      editionType: artwork.editionType ?? (artwork.editionTotal ? 'edition' : 'unique'),
      editionTotal: artwork.editionTotal,
      editionAP:   artwork.editionAP,
      priceExVat:  artwork.priceIncVat,
      vatRate:     artwork.vatRate,
      description: ptToPlainText(artwork.description),
      mnsdkSoldCount: artwork.mnsdkSoldCount ?? 0,
      notes: [
        artwork.status ? `Status op MNSDK: ${artwork.status}` : null,
        artwork.mnsdkSoldCount ? `Al verkocht door kunstenaar: ${artwork.mnsdkSoldCount} ex.` : null,
        `MNSDK ID: ${artwork._id}`,
      ].filter(Boolean).join('\n'),
      images: (artwork.images ?? [])
        .filter(img => img.url)
        .map((img, i) => ({
          url: img.url!,
          filename: (img.url ?? '').split('/').pop() ?? `image-${i}`,
        })),
      status: artwork.status,
    }))

    // ── Call Torch's own endpoint to create artistSubmission ──────────────────
    // Torch uses its own SANITY_API_WRITE_TOKEN server-side — no cross-project
    // token needed on the MNSDK side.
    const torchRes = await fetch(`${torchBaseUrl}/api/from-mnsdk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${torchSyncKey}`,
      },
      body: JSON.stringify({ artworks: artworkPayload }),
    })

    if (!torchRes.ok) {
      const errText = await torchRes.text()
      console.error('[sync] Torch endpoint error:', torchRes.status, errText)
      return NextResponse.json(
        { error: `Torch returned ${torchRes.status}: ${errText}` },
        { status: 502 }
      )
    }

    const torchData = await torchRes.json() as {
      success: boolean
      submissionId: string
      works: Array<{ mnsdkId: string; workKey: string }>
    }

    // ── Write torchId back to each MNSDK artwork (non-fatal) ──────────────────
    for (const w of torchData.works) {
      try {
        await mnsdkWriteClient
          .patch(w.mnsdkId)
          .set({ torchId: `sub:${torchData.submissionId}:${w.workKey}` })
          .commit()
      } catch (writeErr) {
        console.warn('[sync] torchId writeback failed for', w.mnsdkId, writeErr instanceof Error ? writeErr.message : writeErr)
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: torchData.submissionId,
      count: torchData.works.length,
      artworks: torchData.works.map(w => ({ mnsdkId: w.mnsdkId, workKey: w.workKey })),
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

const ARTWORK_STATUS_VALUES = ['available', 'sold', 'reserved', 'on-loan', 'not-for-sale']

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

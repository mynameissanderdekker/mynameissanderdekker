import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const TORCH_PROJECT_ID = '53tz2hh0'
const TORCH_DATASET   = 'production'
const MNSDK_PROJECT_ID = 'u11u127q'
const MNSDK_DATASET    = 'production'

// Auth check — admin cookie or a valid Sanity Studio session token
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

export async function POST(req: NextRequest) {
  try {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { artworkId } = await req.json()
  if (!artworkId) {
    return NextResponse.json({ error: 'artworkId required' }, { status: 400 })
  }

  const torchToken = process.env.TORCH_WRITE_TOKEN
  const mnsdkToken = process.env.SANITY_API_WRITE_TOKEN
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

  // ── Fetch artwork from MNSDK ───────────────────────────────────────────────
  const artwork = await mnsdkClient.fetch(
    `*[_type == "artwork" && _id == $id][0] {
      _id, title, year, medium,
      dimensions { widthCm, heightCm, depthCm },
      category,
      editionType, editionTotal, editionAP, editionNumber,
      "images": images[] { "url": asset->url, "mimeType": asset->mimeType },
      priceIncVat, vatRate,
      description,
      status,
      showInWebshop,
      featured,
      "slugCurrent": slug.current,
      torchId
    }`,
    { id: artworkId }
  )

  if (!artwork) {
    return NextResponse.json({ error: 'Artwork not found in MNSDK' }, { status: 404 })
  }

  // ── Find Sander Dekker artist in Torch ─────────────────────────────────────
  const torchArtist = await torchClient.fetch<{ _id: string } | null>(
    `*[_type == "artist" && lower(name) match "sander*"][0] { _id }`
  )

  // ── Copy images to Torch ───────────────────────────────────────────────────
  const torchImages: Array<{ _type: string; _key: string; asset: { _type: string; _ref: string } }> = []

  for (const img of (artwork.images ?? [])) {
    if (!img.url) continue
    try {
      const res = await fetch(img.url)
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = img.mimeType || res.headers.get('content-type') || 'image/jpeg'
      const uploaded = await torchClient.assets.upload('image', buffer, { contentType })
      torchImages.push({
        _type: 'image',
        _key:  crypto.randomUUID().replace(/-/g, '').slice(0, 12),
        asset: { _type: 'reference', _ref: uploaded._id },
      })
    } catch (err) {
      console.error('Failed to copy image:', err)
    }
  }

  // ── Build Torch artwork payload ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: { _type: string; [key: string]: any } = {
    _type: 'artwork',
    title:       artwork.title,
    year:        artwork.year != null ? String(artwork.year) : undefined,
    medium:      artwork.medium,
    widthCm:     artwork.dimensions?.widthCm,
    heightCm:    artwork.dimensions?.heightCm,
    depthCm:     artwork.dimensions?.depthCm,
    category:    artwork.category,
    editionType:   artwork.editionType,
    editionTotal:  artwork.editionTotal,
    editionAP:     artwork.editionAP,
    editionNumber: artwork.editionNumber,
    images:        torchImages.length > 0 ? torchImages : undefined,
    priceIncVat:   artwork.priceIncVat,
    vatRate:       artwork.vatRate,
    description:   artwork.description,
    status:        artwork.status,
    availableInShop: artwork.showInWebshop ?? false,
    shopFeatured:    artwork.featured ?? false,
  }

  if (artwork.slugCurrent) {
    payload.slug = { _type: 'slug', current: artwork.slugCurrent }
  }
  if (torchArtist?._id) {
    payload.artist = { _type: 'reference', _ref: torchArtist._id }
  }

  // Remove undefined fields
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key]
  }

  // ── Create or update in Torch ──────────────────────────────────────────────
  let torchId = artwork.torchId as string | undefined
  let result

  if (torchId) {
    result = await torchClient.patch(torchId).set(payload).commit()
  } else {
    result = await torchClient.create(payload)
    torchId = result._id

    // Write torchId back into MNSDK so future syncs update instead of duplicate
    await mnsdkClient.patch(artworkId).set({ torchId }).commit()
  }

  return NextResponse.json({ success: true, torchId })
  } catch (err: unknown) {
    console.error('[sync-to-torch POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

// ── PATCH: write the status field back to MNSDK (used by Pull action) ─────────
const ARTWORK_STATUS_VALUES = ['available', 'sold_out', 'on_loan', 'not_for_sale', 'enquire']

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { artworkId, patch } = await req.json()
  if (!artworkId || !patch) {
    return NextResponse.json({ error: 'artworkId and patch required' }, { status: 400 })
  }

  // Only the status field may be written back this way — keeps this endpoint
  // from being usable to overwrite arbitrary fields on arbitrary documents.
  if (!patch.status || !ARTWORK_STATUS_VALUES.includes(patch.status) || Object.keys(patch).length !== 1) {
    return NextResponse.json({ error: 'Only a valid { status } patch is allowed' }, { status: 400 })
  }

  const mnsdkClient = createClient({
    projectId: MNSDK_PROJECT_ID,
    dataset:   MNSDK_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
  })

  const doc = await mnsdkClient.fetch(`*[_type == "artwork" && _id == $id][0]{ _id }`, { id: artworkId })
  if (!doc) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
  }

  await mnsdkClient.patch(artworkId).set({ status: patch.status }).commit()
  return NextResponse.json({ success: true })
}

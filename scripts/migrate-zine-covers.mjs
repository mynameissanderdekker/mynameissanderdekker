/**
 * migrate-zine-covers.mjs
 *
 * Migrates zine.coverImageUrl and the two remaining broken artwork
 * coverImageUrl fields from WordPress to Sanity CDN.
 *
 * mynameissanderdekker.com sits behind Vercel's bot/attack challenge, which
 * blocks plain fetch() requests to /wp-content/uploads/*. Downloads are
 * routed through the Bluehost origin's temporary hostname instead, which
 * bypasses Vercel entirely (same approach as migrate-wp-images.mjs).
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-zine-covers.mjs
 */

import { createClient } from '@sanity/client'

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q'
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    ?? 'production'
const TOKEN      = process.env.SANITY_API_WRITE_TOKEN
                ?? process.env.SANITY_WRITE_TOKEN
                ?? process.env.SANITY_TOKEN

if (!TOKEN) {
  console.error('❌  No write token found.')
  console.error('    Set SANITY_TOKEN env var, or run with --env-file=.env.local')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2024-01-01',
  token:      TOKEN,
  useCdn:     false,
})

// ── Data ────────────────────────────────────────────────────────────────────

const ZINES = [
  { id: 'zine-01-annemarijn',    path: '/2026/05/Zine-N01-Annemarijn.jpg' },
  { id: 'zine-02-girls-in-paris',path: '/2026/05/Zine-N02-Girls-in-Paris.jpg' },
  { id: 'zine-03-janna',         path: '/2026/05/Zine-N03-Janna.jpg' },
  { id: 'zine-04-cats-dogs',     path: '/2026/05/Zine-N04-Cats-Dogs.jpg' },
  { id: 'zine-05-mexico',        path: '/2026/05/Zine-N05-Mexico.jpg' },
  { id: 'zine-06-claudia',       path: '/2026/05/Zine-N06-Claudia.jpg' },
  { id: 'zine-07-anniversary',   path: '/2026/05/Zine-N07-Anniversary-1.jpg' },
  { id: 'zine-08-warsaw-saga',   path: '/2026/05/Zine-N08-The-Warsaw-SAGA-1.jpg' },
  { id: 'zine-09-asia',          path: '/2026/05/Zine-N09-ASIA-1.jpg' },
  { id: 'zine-10-tenfifteen',    path: '/2026/05/Zine-N10-TenFifteen-1.jpg' },
  { id: 'zine-11-collectors-box', path: '/2026/05/Box.jpg' },
]

const ARTWORKS = [
  { id: 'GskSHzltiom27vUz3phAgD', path: '/2020/04/My-Name-Is-Sander-Dekker-1-1.jpg' },
  { id: 'k57DXB4TxK58qNiTm5VJHy', path: '/2019/10/My-Name-Is-Sander-Dekker-1-1.5.jpg' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEMP_HOST = 'mynameissanderdekker1.hushhushhotsauce.com'

function tempUrl(path) {
  return `https://${TEMP_HOST}/wp-content/uploads${path}`
}

/** Download a URL and return an ArrayBuffer */
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (migration script)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.arrayBuffer()
}

/** Upload a buffer to Sanity and return the CDN URL */
async function uploadToSanity(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const mimeMap = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif',  webp: 'image/webp', svg: 'image/svg+xml',
  }
  const contentType = mimeMap[ext] ?? 'image/jpeg'

  const asset = await client.assets.upload('image', Buffer.from(buffer), {
    filename,
    contentType,
  })
  return asset.url
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/** Migrate a single { id, path } entry's coverImageUrl field */
async function migrateCoverImageUrl(label, id, path) {
  const filename = decodeURIComponent(path.split('/').pop())
  process.stdout.write(`   ⬇️  ${filename} … `)
  try {
    const buffer    = await downloadImage(tempUrl(path))
    const sanityUrl = await uploadToSanity(buffer, filename)
    await client.patch(id).set({ coverImageUrl: sanityUrl }).commit()
    console.log(`✅`)
    await sleep(300) // be gentle with Sanity API
    return true
  } catch (err) {
    console.log(`❌  ${err.message}`)
    return false
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍  Migrating against Sanity (${PROJECT_ID}/${DATASET})\n`)

  let totalOk = 0
  let totalFailed = 0

  console.log('🗂  Zines')
  for (const { id, path } of ZINES) {
    const ok = await migrateCoverImageUrl('zine', id, path)
    ok ? totalOk++ : totalFailed++
  }

  console.log('\n🖼  Broken /works artwork images')
  for (const { id, path } of ARTWORKS) {
    const ok = await migrateCoverImageUrl('artwork', id, path)
    ok ? totalOk++ : totalFailed++
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅  Migrated: ${totalOk}`)
  if (totalFailed > 0) {
    console.log(`❌  Failed:   ${totalFailed}`)
  }
  console.log('─────────────────────────────────────')
  console.log('Done! Changes appear immediately via Sanity CDN.')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

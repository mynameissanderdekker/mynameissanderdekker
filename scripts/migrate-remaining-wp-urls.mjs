/**
 * migrate-remaining-wp-urls.mjs
 *
 * Cleans up the last 7 WP references left after migrate-pagebuilder-assets.mjs:
 * - 3x orphaned top-level project.pdfUrl (legacy field, not in any schema,
 *   not read by the site — the live one is pageBuilder[].pdfUrl, already
 *   migrated. Fixed anyway for consistency.)
 * - 4x artwork.coverImageUrl that weren't part of the original known list.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-remaining-wp-urls.mjs
 */

import { createClient } from '@sanity/client'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q'
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    ?? 'production'
const TOKEN      = process.env.SANITY_API_WRITE_TOKEN
                ?? process.env.SANITY_WRITE_TOKEN
                ?? process.env.SANITY_TOKEN

if (!TOKEN) {
  console.error('❌  No write token found. Run with --env-file=.env.local')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2024-01-01',
  token:      TOKEN,
  useCdn:     false,
})

const TEMP_HOST = 'mynameissanderdekker1.hushhushhotsauce.com'

const PDF_URL_FIELD_TARGETS = [
  { id: 'project-asia',          path: '/2025/07/No9-Asia.pdf' },
  { id: 'project-girls-in-paris',path: '/2025/11/Girls-in-Paris-1.pdf' },
  { id: 'project-warsaw-saga',   path: '/2025/08/No8-The-Warsaw-SAGA.pdf' },
]

const ARTWORK_COVER_TARGETS = [
  { id: 'GskSHzltiom27vUz3q2u14', path: '/2026/01/Girls-in-Paris.jpg' },
  { id: 'PGI1Mc19xNWwE3RgMsJlyz', path: '/2025/11/WD-70600-01.jpg' },
  { id: 'k57DXB4TxK58qNiTm5fIko', path: "/2023/12/Mock-up-Cover.jpg" },
  // k57DXB4TxK58qNiTm5fIpC (Zine-No.8-'The-Warsaw-SAGA.jpg) intentionally
  // omitted — that exact file 404s on Bluehost, doesn't exist. Needs a
  // decision on which close-match file is actually correct before migrating.
]

function tempUrl(path) {
  return `https://${TEMP_HOST}/wp-content/uploads${encodeURI(path)}`
}

async function downloadAsset(path) {
  const res = await fetch(tempUrl(path), {
    headers: { 'User-Agent': 'Mozilla/5.0 (migration script)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.arrayBuffer()
}

const IMAGE_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
const FILE_MIME  = { pdf: 'application/pdf' }

async function uploadToSanity(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const assetType   = IMAGE_MIME[ext] ? 'image' : 'file'
  const contentType = IMAGE_MIME[ext] ?? FILE_MIME[ext] ?? 'application/octet-stream'
  const asset = await client.assets.upload(assetType, Buffer.from(buffer), { filename, contentType })
  return asset.url
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function migrateField(id, path, fieldName) {
  const filename = decodeURIComponent(path.split('/').pop())
  process.stdout.write(`   ⬇️  ${id} / ${fieldName} (${filename}) … `)
  try {
    const buffer    = await downloadAsset(path)
    const sanityUrl = await uploadToSanity(buffer, filename)
    await client.patch(id).set({ [fieldName]: sanityUrl }).commit()
    console.log(`✅`)
    await sleep(300)
    return true
  } catch (err) {
    console.log(`❌  ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🗂  Orphaned project.pdfUrl fields')
  let ok = 0, failed = 0
  for (const { id, path } of PDF_URL_FIELD_TARGETS) {
    (await migrateField(id, path, 'pdfUrl')) ? ok++ : failed++
  }

  console.log('\n🖼  Additional artwork.coverImageUrl fields')
  for (const { id, path } of ARTWORK_COVER_TARGETS) {
    (await migrateField(id, path, 'coverImageUrl')) ? ok++ : failed++
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅  Migrated: ${ok}`)
  if (failed > 0) console.log(`❌  Failed:   ${failed}`)
  console.log('─────────────────────────────────────')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

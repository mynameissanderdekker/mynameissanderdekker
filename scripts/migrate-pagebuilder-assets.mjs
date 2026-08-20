/**
 * migrate-pagebuilder-assets.mjs
 *
 * Generic deep-scan migration: finds every string value anywhere inside
 * project.pageBuilder that points at mynameissanderdekker.com/wp-content
 * (images, PDFs, videos — any field, any block type, any nesting depth),
 * downloads it, uploads it to Sanity, and patches it back in place.
 *
 * Also does the same for zine.coverImageUrl as a safety net, in case any
 * new zines get added with a WP fallback URL later.
 *
 * mynameissanderdekker.com sits behind Vercel's bot/attack challenge, which
 * blocks plain fetch() requests to /wp-content/uploads/*. Downloads are
 * routed through the Bluehost origin's temporary hostname instead, which
 * bypasses Vercel entirely (same approach as migrate-wp-images.mjs).
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-pagebuilder-assets.mjs
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

const WP_MARKER = 'mynameissanderdekker.com/wp-content'
const TEMP_HOST = 'mynameissanderdekker1.hushhushhotsauce.com'

// ── Asset type detection ────────────────────────────────────────────────────

const IMAGE_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif',  webp: 'image/webp', svg: 'image/svg+xml',
}
const FILE_MIME = {
  pdf: 'application/pdf',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
}

function assetInfoFor(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  if (IMAGE_MIME[ext]) return { assetType: 'image', contentType: IMAGE_MIME[ext] }
  if (FILE_MIME[ext])  return { assetType: 'file',  contentType: FILE_MIME[ext] }
  return { assetType: 'file', contentType: 'application/octet-stream' }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toTempUrl(wpUrl) {
  return wpUrl.replace('mynameissanderdekker.com', TEMP_HOST)
}

async function downloadAsset(wpUrl) {
  const res = await fetch(toTempUrl(wpUrl), {
    headers: { 'User-Agent': 'Mozilla/5.0 (migration script)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${wpUrl}`)
  return res.arrayBuffer()
}

async function uploadToSanity(buffer, filename) {
  const { assetType, contentType } = assetInfoFor(filename)
  const asset = await client.assets.upload(assetType, Buffer.from(buffer), {
    filename,
    contentType,
  })
  return asset.url
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/** Recursively find every WP URL in a value, returning [{ path, value }]. */
function findWpUrls(node, path, hits) {
  if (node == null) return
  if (typeof node === 'string') {
    if (node.includes(WP_MARKER)) hits.push({ path, value: node })
    return
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => findWpUrls(v, [...path, i], hits))
    return
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) findWpUrls(node[key], [...path, key], hits)
  }
}

/** Set a value at a given path (array of string/number keys) on a plain object/array tree. */
function setAtPath(root, path, value) {
  let cur = root
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]
  cur[path[path.length - 1]] = value
}

// ── Migration core ──────────────────────────────────────────────────────────

const urlCache = new Map() // wpUrl -> sanityUrl
let totalUploaded = 0
let totalFailed   = 0

async function migrateUrl(wpUrl) {
  if (urlCache.has(wpUrl)) return urlCache.get(wpUrl)

  const filename = decodeURIComponent(wpUrl.split('/').pop())
  process.stdout.write(`   ⬇️  ${filename} … `)
  try {
    const buffer    = await downloadAsset(wpUrl)
    const sanityUrl = await uploadToSanity(buffer, filename)
    urlCache.set(wpUrl, sanityUrl)
    totalUploaded++
    console.log(`✅`)
    await sleep(300) // be gentle with Sanity API
    return sanityUrl
  } catch (err) {
    console.log(`❌  ${err.message}`)
    totalFailed++
    return null // keep original on failure
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍  Querying Sanity (${PROJECT_ID}/${DATASET})…\n`)

  // ── Projects: deep-scan pageBuilder ────────────────────────────────────────

  const projects = await client.fetch(`
    *[_type == "project" && defined(pageBuilder)] { _id, title, pageBuilder }
  `)

  for (const project of projects) {
    const hits = []
    findWpUrls(project.pageBuilder, [], hits)
    if (hits.length === 0) continue

    console.log(`\n🗂  ${project.title} (${hits.length} asset${hits.length === 1 ? '' : 's'})`)

    const newPageBuilder = JSON.parse(JSON.stringify(project.pageBuilder))
    let changed = false

    for (const { path, value } of hits) {
      const sanityUrl = await migrateUrl(value)
      if (sanityUrl) {
        setAtPath(newPageBuilder, path, sanityUrl)
        changed = true
      }
    }

    if (changed) {
      await client.patch(project._id).set({ pageBuilder: newPageBuilder }).commit()
      console.log(`   💾  Saved to Sanity`)
    }
  }

  // ── Zines: safety net for coverImageUrl ────────────────────────────────────

  const zines = await client.fetch(`*[_type == "zine" && defined(coverImageUrl)]{ _id, coverImageUrl }`)
  const wpZines = zines.filter(z => z.coverImageUrl.includes(WP_MARKER))

  if (wpZines.length > 0) {
    console.log(`\n🗂  Zines (${wpZines.length} still on WordPress)`)
    for (const zine of wpZines) {
      const sanityUrl = await migrateUrl(zine.coverImageUrl)
      if (sanityUrl) {
        await client.patch(zine._id).set({ coverImageUrl: sanityUrl }).commit()
        console.log(`   💾  ${zine._id} saved`)
      }
    }
  } else {
    console.log(`\n🗂  Zines: all coverImageUrl already on Sanity CDN, nothing to do.`)
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────')
  console.log(`✅  Uploaded: ${totalUploaded}`)
  if (totalFailed > 0) {
    console.log(`❌  Failed:   ${totalFailed}`)
  }
  console.log('─────────────────────────────────────')
  console.log('Done!')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

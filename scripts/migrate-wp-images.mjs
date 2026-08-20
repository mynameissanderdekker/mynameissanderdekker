/**
 * migrate-wp-images.mjs
 *
 * Downloads all WordPress images referenced in Sanity externalUrls,
 * uploads them to Sanity CDN, and patches the documents in-place.
 *
 * Usage:
 *   SANITY_TOKEN=<your_write_token> node scripts/migrate-wp-images.mjs
 *
 * Or create a .env.local with SANITY_API_WRITE_TOKEN set, then run:
 *   node --env-file=.env.local scripts/migrate-wp-images.mjs
 *
 * Requires Node 18+ (built-in fetch). No extra npm installs needed.
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

// ── Helpers ──────────────────────────────────────────────────────────────────

// NOTE: mynameissanderdekker.com sits behind Vercel's bot/attack challenge,
// which blocks plain fetch() requests to /wp-content/uploads/*. If this script
// needs to run again, route downloads through the Bluehost origin's temporary
// hostname instead — e.g. wpUrl.replace('mynameissanderdekker.com',
// 'mynameissanderdekker1.hushhushhotsauce.com') — since that bypasses Vercel
// entirely and hits WordPress directly.

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

/** Sleep helper for rate-limiting */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍  Querying Sanity (${PROJECT_ID}/${DATASET})…`)

  // Fetch all projects with pageBuilder blocks that have externalUrls
  const projects = await client.fetch(`
    *[_type == "project" && defined(pageBuilder)] {
      _id,
      title,
      "pageBuilder": pageBuilder[] {
        ...,
        _key
      }
    }
  `)

  console.log(`📋  Found ${projects.length} projects\n`)

  // Also collect the nav logo
  const NAV_LOGO_URL = 'https://mynameissanderdekker.com/wp-content/uploads/2026/04/Mindmap-button.png'

  // Build a map: wpUrl → sanity CDN url (to avoid double-uploading same image)
  const urlCache = new Map()

  let totalUploaded = 0
  let totalFailed   = 0

  // ── Per-project migration ──────────────────────────────────────────────────

  for (const project of projects) {
    console.log(`\n🗂  ${project.title}`)

    const newPageBuilder = [...project.pageBuilder]
    let projectChanged = false

    for (let i = 0; i < newPageBuilder.length; i++) {
      const block = newPageBuilder[i]
      if (!block.externalUrls?.length) continue

      const newUrls = []
      for (const wpUrl of block.externalUrls) {
        if (!wpUrl.includes('mynameissanderdekker.com/wp-content')) {
          // Already a Sanity URL or other — keep as-is
          newUrls.push(wpUrl)
          continue
        }

        // Check cache first
        if (urlCache.has(wpUrl)) {
          console.log(`   ♻️  (cached) ${wpUrl.split('/').pop()}`)
          newUrls.push(urlCache.get(wpUrl))
          continue
        }

        const filename = decodeURIComponent(wpUrl.split('/').pop())
        process.stdout.write(`   ⬇️  ${filename} … `)

        try {
          const buffer    = await downloadImage(wpUrl)
          const sanityUrl = await uploadToSanity(buffer, filename)
          urlCache.set(wpUrl, sanityUrl)
          newUrls.push(sanityUrl)
          totalUploaded++
          console.log(`✅`)
          await sleep(300) // be gentle with Sanity API
        } catch (err) {
          console.log(`❌  ${err.message}`)
          newUrls.push(wpUrl) // keep original on failure
          totalFailed++
        }
      }

      // Update the block if anything changed
      if (JSON.stringify(newUrls) !== JSON.stringify(block.externalUrls)) {
        newPageBuilder[i] = { ...block, externalUrls: newUrls }
        projectChanged = true
      }
    }

    // Patch Sanity document
    if (projectChanged) {
      await client.patch(project._id).set({ pageBuilder: newPageBuilder }).commit()
      console.log(`   💾  Saved to Sanity`)
    } else {
      console.log(`   ✓  No changes`)
    }
  }

  // ── Nav logo migration ─────────────────────────────────────────────────────

  console.log('\n🖼  Migrating nav logo (Mindmap-button.png)…')
  try {
    const buffer    = await downloadImage(NAV_LOGO_URL)
    const sanityUrl = await uploadToSanity(buffer, 'Mindmap-button.png')
    console.log(`   ✅  Uploaded: ${sanityUrl}`)
    console.log(`\n   📝  Now update Nav.tsx line 103 to:`)
    console.log(`       src="${sanityUrl}"`)
  } catch (err) {
    console.log(`   ❌  ${err.message}`)
    console.log(`   ℹ️  The Mindmap-button.png may need to be uploaded manually via Sanity Studio.`)
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────')
  console.log(`✅  Uploaded:  ${totalUploaded} images`)
  if (totalFailed > 0) {
    console.log(`❌  Failed:   ${totalFailed} images (WordPress 404 — originals needed)`)
  }
  console.log('─────────────────────────────────────')
  console.log('Done! Redeploy Vercel to see changes (or they\'ll appear immediately via Sanity).')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

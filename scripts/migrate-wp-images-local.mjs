/**
 * migrate-wp-images-local.mjs
 *
 * Same as migrate-wp-images.mjs, but reads image files from a local
 * directory (e.g. pulled via FTP from the old Bluehost host) instead of
 * fetching them over HTTP — the live mynameissanderdekker.com domain now
 * sits behind Vercel's bot/attack challenge, which blocks the plain fetch()
 * used by the original script.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-wp-images-local.mjs <local-dir>
 *
 * <local-dir> is searched recursively for a file matching each WordPress
 * URL's basename (so it works whether mget preserved the wp-content/uploads/
 * YYYY/MM/ directory structure or flattened everything into one folder).
 *
 * Requires Node 18+. No extra npm installs needed.
 */

import { createClient } from '@sanity/client'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q'
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    ?? 'production'
const TOKEN      = process.env.SANITY_API_WRITE_TOKEN
                ?? process.env.SANITY_WRITE_TOKEN
                ?? process.env.SANITY_TOKEN

const LOCAL_DIR = process.argv[2]

if (!LOCAL_DIR) {
  console.error('❌  Usage: node --env-file=.env.local scripts/migrate-wp-images-local.mjs <local-dir>')
  process.exit(1)
}

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

/** Recursively index every file under `dir` by its basename → full path */
async function indexFiles(dir) {
  const index = new Map()
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else {
        // Last one wins if there are duplicate basenames in different subdirs
        index.set(entry.name, full)
      }
    }
  }
  await walk(dir)
  return index
}

/** Upload a buffer to Sanity and return the CDN URL */
async function uploadToSanity(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const mimeMap = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif',  webp: 'image/webp', svg: 'image/svg+xml',
  }
  const contentType = mimeMap[ext] ?? 'image/jpeg'

  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType,
  })
  return asset.url
}

/** Sleep helper for rate-limiting */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`📁  Indexing local files under ${LOCAL_DIR}…`)
  const fileIndex = await indexFiles(LOCAL_DIR)
  console.log(`    Found ${fileIndex.size} local files\n`)

  console.log(`🔍  Querying Sanity (${PROJECT_ID}/${DATASET})…`)

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

  const NAV_LOGO_FILENAME = 'Mindmap-button.png'

  // Build a map: wpUrl → sanity CDN url (to avoid double-uploading same image)
  const urlCache = new Map()

  let totalUploaded = 0
  let totalFailed   = 0
  let totalMissing  = 0

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
          newUrls.push(wpUrl)
          continue
        }

        if (urlCache.has(wpUrl)) {
          console.log(`   ♻️  (cached) ${wpUrl.split('/').pop()}`)
          newUrls.push(urlCache.get(wpUrl))
          continue
        }

        const filename = decodeURIComponent(wpUrl.split('/').pop())
        process.stdout.write(`   📄  ${filename} … `)

        const localPath = fileIndex.get(filename)
        if (!localPath) {
          console.log(`❌  not found locally`)
          newUrls.push(wpUrl)
          totalMissing++
          continue
        }

        try {
          const buffer    = await readFile(localPath)
          const sanityUrl = await uploadToSanity(buffer, filename)
          urlCache.set(wpUrl, sanityUrl)
          newUrls.push(sanityUrl)
          totalUploaded++
          console.log(`✅`)
          await sleep(300) // be gentle with Sanity API
        } catch (err) {
          console.log(`❌  ${err.message}`)
          newUrls.push(wpUrl)
          totalFailed++
        }
      }

      if (JSON.stringify(newUrls) !== JSON.stringify(block.externalUrls)) {
        newPageBuilder[i] = { ...block, externalUrls: newUrls }
        projectChanged = true
      }
    }

    if (projectChanged) {
      await client.patch(project._id).set({ pageBuilder: newPageBuilder }).commit()
      console.log(`   💾  Saved to Sanity`)
    } else {
      console.log(`   ✓  No changes`)
    }
  }

  // ── Nav logo migration ─────────────────────────────────────────────────────

  console.log(`\n🖼  Migrating nav logo (${NAV_LOGO_FILENAME})…`)
  const navLogoPath = fileIndex.get(NAV_LOGO_FILENAME)
  if (!navLogoPath) {
    console.log(`   ❌  ${NAV_LOGO_FILENAME} not found locally`)
  } else {
    try {
      const buffer    = await readFile(navLogoPath)
      const sanityUrl = await uploadToSanity(buffer, NAV_LOGO_FILENAME)
      console.log(`   ✅  Uploaded: ${sanityUrl}`)
      console.log(`\n   📝  Now update Nav.tsx line 103 to:`)
      console.log(`       src="${sanityUrl}"`)
    } catch (err) {
      console.log(`   ❌  ${err.message}`)
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────')
  console.log(`✅  Uploaded:  ${totalUploaded} images`)
  if (totalMissing > 0) {
    console.log(`❓  Missing local file: ${totalMissing} images (not in ${LOCAL_DIR})`)
  }
  if (totalFailed > 0) {
    console.log(`❌  Upload failed:      ${totalFailed} images`)
  }
  console.log('─────────────────────────────────────')
  console.log('Done! Redeploy Vercel to see changes (or they\'ll appear immediately via Sanity).')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})

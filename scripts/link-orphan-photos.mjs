/**
 * link-orphan-photos.mjs
 * Finds already-uploaded Sanity image assets (by filename) and patches
 * them onto artwork documents that currently have no images.
 *
 * Run: node scripts/link-orphan-photos.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// artwork slug → substring(s) to match against asset originalFilename (case-insensitive)
const TARGETS = [
  { slug: 'embrace-your-freedom',      match: ['embrace'] },
  { slug: 'the-breakfast-club',        match: ['breakfast'] },
  { slug: 'got-no-time-for-that-shit', match: ['got-no-time', 'got no time'] },
  { slug: 'nimby',                     match: ['nimby'] },
  { slug: 'speedy-harmony',            match: ['speedy'] },
  { slug: 'new-found-freedom',         match: ['new-found', 'new found'] },
  { slug: 'sorry-were-dead',           match: ["sorry-we're", "sorry we're", 'sorry'] },
  { slug: 'we-are-all-of-us-stars',    match: ['we-are-all-of-us', 'all-of-us-stars', 'all of us stars'] },
  { slug: 'world-peace',               match: ['world-peace', 'world peace'] },
  { slug: 'a-pattern-of-madness-ii',   match: ['pattern-of-madness-ii', 'madness-ii', 'pattern of madness ii'] },
  { slug: 'employee-of-the-month',     match: ['employee'] },
  { slug: 'cars-n-heels',              match: ['cars-n', "cars 'n", 'cars-heels'] },
  { slug: 'the-maestro',               match: ['maestro'] },
]

async function main() {
  console.log('=== link-orphan-photos.mjs ===\n')

  // Fetch all image assets
  const assets = await client.fetch(
    `*[_type == "sanity.imageAsset"]{ _id, originalFilename, _createdAt } | order(_createdAt desc)`
  )
  console.log(`Found ${assets.length} image assets in Sanity\n`)

  let ok = 0, skipped = 0, failed = 0

  for (const target of TARGETS) {
    // Find artwork
    const artwork = await client.fetch(
      `*[_type == "artwork" && slug.current == $slug][0]{ _id, title, images }`,
      { slug: target.slug }
    )

    if (!artwork) {
      console.warn(`⚠  No artwork found: slug="${target.slug}"`)
      failed++
      continue
    }

    if (Array.isArray(artwork.images) && artwork.images.length > 0) {
      console.log(`↷  ${artwork.title} — already has images, skipping`)
      skipped++
      continue
    }

    // Find matching asset
    const asset = assets.find(a => {
      if (!a.originalFilename) return false
      const name = a.originalFilename.toLowerCase()
      return target.match.some(m => name.includes(m.toLowerCase()))
    })

    if (!asset) {
      console.warn(`⚠  No asset found for: ${artwork.title} (tried: ${target.match.join(', ')})`)
      failed++
      continue
    }

    // Patch artwork
    try {
      await client
        .patch(artwork._id)
        .setIfMissing({ images: [] })
        .append('images', [{
          _type: 'image',
          _key: `img-${asset._id.replace('image-', '').slice(0, 12)}`,
          asset: { _type: 'reference', _ref: asset._id },
        }])
        .commit()

      console.log(`✓  ${artwork.title}  ←  ${asset.originalFilename}`)
      ok++
    } catch (err) {
      console.error(`✗  ${artwork.title}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} linked, ${skipped} skipped, ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })

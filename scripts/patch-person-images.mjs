/**
 * patch-person-images.mjs
 *
 * Adds the known WordPress CDN image URLs to each personBlock
 * in the Social Media Project.
 *
 * Run with:  node scripts/patch-person-images.mjs
 * Add --dry-run to preview.
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

// Image URLs from the original WordPress site (fetched 2026-07-29)
const PERSON_IMAGES = {
  'Sasha': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/1.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/2.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/3.jpg',
  ],
  'Anastasia': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B7328-e1783438358222.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B7680.jpg',
  ],
  'Natalia': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B8679-e1783438337341.jpg',
  ],
  'Berno': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B9181-e1783438319499.jpg',
  ],
  'Yuliya': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B1725-e1783438392520.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B1721-e1783438422176.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B1722-e1783438402203.jpg',
  ],
  'Tess & Ian': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/IMG_0842.jpg',
  ],
  'Samia': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B5413-e1783438382498.jpg',
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B5323-e1783438371133.jpg',
  ],
  'Anthony': [
    'https://mynameissanderdekker.com/wp-content/uploads/2026/07/5X8B3307.jpg',
  ],
}

const project = await client.fetch(
  `*[_type == "project" && slug.current == "the-social-media-project"][0]{
    _id, pageBuilder
  }`
)

if (!project) {
  console.error('❌  Project not found')
  process.exit(1)
}

const updatedBlocks = project.pageBuilder.map(block => {
  if (block._type !== 'personBlock') return block
  const urls = PERSON_IMAGES[block.name]
  if (!urls) {
    console.log(`  ⚠️   No URLs found for: "${block.name}"`)
    return block
  }
  // Only patch externalUrls if images are also empty (avoid overwriting Sanity uploads)
  const hasImages = block.images?.some(img => img?.asset)
  if (hasImages) {
    console.log(`  ⏭️   Skipping ${block.name} — already has Sanity images`)
    return block
  }
  console.log(`  ✅  Patching ${block.name} with ${urls.length} image URL(s)`)
  return { ...block, externalUrls: urls }
})

if (DRY_RUN) {
  console.log('\n🔍  DRY RUN — no changes written.\n')
  process.exit(0)
}

await client.patch(project._id).set({ pageBuilder: updatedBlocks }).commit()
console.log('\n✅  Done! Refresh the page to see the photos.\n')

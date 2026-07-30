/**
 * upload-artwork-images.mjs
 *
 * Uploads artwork images to Sanity:
 *   images[0] = mockup/framed version  (from scripts/artwork-images-mockup/)
 *   images[1] = raw photo              (from scripts/artwork-images/)
 *
 * Falls back gracefully when only one of the two is present.
 * Already-uploaded images are skipped unless --force is passed.
 *
 * Run:       node scripts/upload-artwork-images.mjs
 * Dry run:   node scripts/upload-artwork-images.mjs --dry-run
 * Force:     node scripts/upload-artwork-images.mjs --force
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve, extname, basename } from 'path'
import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE   = process.argv.includes('--force')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

const MOCKUP_DIR = resolve(__dir, 'artwork-images-mockup')
const PHOTO_DIR  = resolve(__dir, 'artwork-images')

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['''.!?#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function readImageDir(dir) {
  if (!existsSync(dir)) return new Map()
  const files = (await readdir(dir)).filter(f => IMAGE_EXTS.includes(extname(f).toLowerCase()))
  const map = new Map()
  for (const f of files) {
    map.set(normalize(basename(f, extname(f))), resolve(dir, f))
  }
  return map
}

async function uploadImage(filePath) {
  const buffer = await readFile(filePath)
  const mime = extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'
  const asset = await client.assets.upload('image', buffer, {
    filename: basename(filePath),
    contentType: mime,
  })
  return asset._id
}

// Load all artworks
const artworks = await client.fetch(`*[_type == "artwork"]{ _id, title, images }`)
console.log(`\n📦  ${artworks.length} artworks in Sanity`)

const mockups = await readImageDir(MOCKUP_DIR)
const photos  = await readImageDir(PHOTO_DIR)
console.log(`🖼️   ${mockups.size} mockups  |  ${photos.size} raw photos\n`)

let updated = 0, skipped = 0, noMatch = 0

for (const aw of artworks) {
  const key     = normalize(aw.title)
  const mockup  = mockups.get(key) ?? null
  const photo   = photos.get(key)  ?? null

  if (!mockup && !photo) { noMatch++; continue }

  const hasImages = (aw.images?.length ?? 0) > 0

  // Auto-force when a mockup is available (mockup must become images[0])
  const shouldUpdate = !hasImages || mockup || FORCE
  if (!shouldUpdate) {
    console.log(`  ⏭️   Skip  "${aw.title}"`)
    skipped++
    continue
  }

  const slots = [mockup, photo].filter(Boolean)
  console.log(`  ✅  "${aw.title}"  →  ${mockup ? 'mockup + ' : ''}${photo ? 'photo' : ''}`)

  if (DRY_RUN) { updated++; continue }

  const imageRefs = []
  for (let i = 0; i < slots.length; i++) {
    const assetId = await uploadImage(slots[i])
    imageRefs.push({
      _type: 'image',
      _key: `img-${i}`,
      asset: { _type: 'reference', _ref: assetId },
    })
  }

  await client.patch(aw._id).set({ images: imageRefs }).commit()
  updated++
}

console.log(`
${DRY_RUN ? '🔍  DRY RUN — no changes written.\n' : ''}✅  Updated:  ${updated}
⏭️   Skipped:  ${skipped}
⚠️   No file:  ${noMatch}
`)

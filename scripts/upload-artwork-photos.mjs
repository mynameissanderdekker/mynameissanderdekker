/**
 * upload-artwork-photos.mjs
 * Uploads JPGs from the Uploads/ folder to Sanity and attaches them
 * to the corresponding artwork documents (appends to images[], skips if already set).
 *
 * Run: node scripts/upload-artwork-photos.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, join } from 'path'
import { createReadStream, existsSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const UPLOADS_DIR = resolve(process.cwd(), 'Uploads')

// filename (without extension) → artwork slug in Sanity
const FILE_TO_SLUG = {
  // ── Batch 1 (social media project + torch era) ───────────────────────────
  '#Foodporn':                          'foodporn',
  '05-Confetti-party':                  'confetti-party',
  '10-El-Diablo-Luchador':              'el-diablo-luchador-ii',
  'A-Pattern-of-Madness':               'a-pattern-of-madness',
  'Activate-Your-Beast-Mode':           'activate-your-beast-mode',
  'Anastasia':                          'anastasia',
  'Anthony-&-Otto':                     'anthony-and-otto',
  'Catching-Popcorn':                   'catching-popcorn',
  'Classic-Rock-33x50CM':               'classic-rock',
  'Composition-in-Blue':                'composition-in-blue',
  'Crustacean-Ballet':                  'crustacean-ballet',
  'Day-at-the-museum':                  'day-at-the-museum',
  'Duplicate-State':                    'duplicate-state',
  'Embrace-your-freedom':               'embrace-your-freedom',
  'Employee-of-the-Month':              'employee-of-the-month',
  'Got-no-time-for-that-shit!':         'got-no-time-for-that-shit',
  'Horsing-Around':                     'horsing-around',
  'Horticulture-II':                    'horticulture-ii',
  'Horticulture':                       'horticulture',
  "I'm-just-creating":                  'im-just-creating',
  'Iris-skywalker':                     'iris-skywalker',
  "It's-a-wrap":                        'its-a-wrap',
  'KâliExpress':                        'kaliexpress',
  'Lad-os-danse-pa-e-roser':            'lad-os-danse-pa-roser',
  'Lean-and-mean':                      'lean-and-mean',
  'Lunar-lunacy-effect©Sander-Dekker':  'lunar-lunacy-effect',
  'NIMBY':                              'nimby',
  'New-found-freedom':                  'new-found-freedom',
  'Next-Generation-of-Changemakers':    'next-generation-of-changemakers',
  'Out-of-the-blue':                    'out-of-the-blue',
  'Sorry-we’re-dead':                   'sorry-were-dead',
  'Speedy-harmony':                     'speedy-harmony',
  'Venetian-triptych':                  'venetian-triptych',
  'We-are-all.made-of-stardust':        'we-are-all-made-of-stardust',
  'World-peace':                        'world-peace',
  'and-we-deserve-to-twinkle':          'and-we-deserve-to-twinkle',
  'chocolate-puma':                     'chocolate-puma',
  'when-offline':                       'when-offline',
  // ── Batch 2 (older works) ─────────────────────────────────────────────────
  'Burger-bulletM':                           'burger-bullet',
  'Cheeky-Bum':                               'cheeky-bum',
  "I'll-Show-You-Mine-If-You-Show-Me-Yours":  'ill-show-you-mine',
  'LA-Squeeze':                               'la-squeeze',
  'Rabbit-Hole':                              'rabbit-hole',
  'Sharky-3D':                                'sharky-3d',
  'Sharky':                                   'sharky',
  'connect-the-dots':                         'connect-the-dots',
  'i-spy-with-my-little-eye':                 'i-spy-with-my-little-eye',
  ' i spy with my little eye':                'i-spy-with-my-little-eye', // leading space variant
  'magic-world':                              'magic-world',
  'the-Oracle':                               'the-oracle',
  'the-beast':                                'the-beast',
  'the-jungle':                               'the-jungle',
  'the-maestro':                              'the-maestro',
  'Hall-Pass':                                'hall-pass',
  // ── Newly found in Uploads ────────────────────────────────────────────────
  'the breakfast club':                       'the-breakfast-club',
}

async function main() {
  console.log('=== upload-artwork-photos.mjs ===\n')

  let ok = 0, skipped = 0, failed = 0

  for (const [filename, slug] of Object.entries(FILE_TO_SLUG)) {
    const filePath = join(UPLOADS_DIR, `${filename}.jpg`)

    if (!existsSync(filePath)) {
      console.warn(`⚠  File not found: ${filename}.jpg`)
      failed++
      continue
    }

    // Fetch artwork by slug
    const artwork = await client.fetch(
      `*[_type == "artwork" && slug.current == $slug][0]{ _id, title, images }`,
      { slug },
    )

    if (!artwork) {
      console.warn(`⚠  No artwork found for slug "${slug}" (${filename}.jpg)`)
      failed++
      continue
    }

    // Skip if artwork already has images
    if (Array.isArray(artwork.images) && artwork.images.length > 0) {
      console.log(`↷  ${artwork.title} — already has ${artwork.images.length} image(s), skipping`)
      skipped++
      continue
    }

    // Upload the image asset
    let asset
    try {
      asset = await client.assets.upload('image', createReadStream(filePath), {
        filename: `${filename}.jpg`,
        contentType: 'image/jpeg',
      })
    } catch (err) {
      console.error(`✗  Upload failed for ${filename}.jpg: ${err.message}`)
      failed++
      continue
    }

    // Patch the artwork to add the image
    try {
      await client
        .patch(artwork._id)
        .setIfMissing({ images: [] })
        .append('images', [
          {
            _type: 'image',
            _key: `img-${asset._id.replace('image-', '').replace(/-/g, '').slice(0, 12)}`,
            asset: { _type: 'reference', _ref: asset._id },
          },
        ])
        .commit()

      console.log(`✓  ${artwork.title}`)
      ok++
    } catch (err) {
      console.error(`✗  Patch failed for ${artwork.title}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} uploaded, ${skipped} skipped (already had images), ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })

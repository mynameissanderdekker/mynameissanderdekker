/**
 * set-available-price-on-request.mjs
 *
 * Sets status = 'available' and priceOnRequest = true on ALL published artworks.
 *
 * Run:     node scripts/set-available-price-on-request.mjs
 * Dry run: DRY=1 node scripts/set-available-price-on-request.mjs
 */

import { createClient } from '@sanity/client'
import 'dotenv/config'

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const DRY = process.env.DRY === '1'

const PUBLICATION_CATEGORIES = ['Zine', 'book', 'Book']

const artworks = await client.fetch(
  `*[_type == "artwork" && !(_id in path("drafts.**")) && !(category in $cats)]{ _id, title, status, category, priceOnRequest }`,
  { cats: PUBLICATION_CATEGORIES }
)

console.log(`Found ${artworks.length} published artworks${DRY ? ' (DRY RUN)' : ''}.\n`)

// Batch into chunks of 100 (Sanity mutation limit)
const CHUNK = 100
let ok = 0

for (let i = 0; i < artworks.length; i += CHUNK) {
  const chunk = artworks.slice(i, i + CHUNK)

  if (DRY) {
    chunk.forEach(a =>
      console.log(`  ${a.title ?? a._id} — status: ${a.status ?? '(null)'} → available, priceOnRequest: ${a.priceOnRequest ?? false} → true`)
    )
    ok += chunk.length
    continue
  }

  const mutations = chunk.map(a => ({
    patch: {
      id: a._id,
      set: { status: 'available', priceOnRequest: true },
    },
  }))

  await client.mutate(mutations)
  ok += chunk.length
  process.stdout.write(`  Patched ${ok}/${artworks.length}...\r`)
}

console.log(`\n${DRY ? 'Would patch' : 'Patched'} ${ok} artworks.`)

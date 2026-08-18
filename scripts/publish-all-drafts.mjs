/**
 * publish-all-drafts.mjs
 *
 * Publishes every document currently in draft state in MNSDK Sanity.
 * Safe to run multiple times — skips if no drafts found.
 *
 * Run:     node scripts/publish-all-drafts.mjs
 * Dry run: DRY=1 node scripts/publish-all-drafts.mjs
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

console.log('Fetching all draft documents…')

const drafts = await client.fetch(
  `*[_id in path("drafts.**")]{ _id, _type, title, name }`
)

if (drafts.length === 0) {
  console.log('✓ No drafts found — nothing to do.')
  process.exit(0)
}

console.log(`Found ${drafts.length} draft(s)${DRY ? ' (DRY RUN — no changes)' : ''}:\n`)
drafts.forEach(d => {
  const label = d.title ?? d.name ?? '(no title)'
  console.log(`  [${d._type}] ${label}  →  ${d._id}`)
})
console.log()

if (DRY) {
  console.log('Dry run complete. Remove DRY=1 to actually publish.')
  process.exit(0)
}

let ok = 0
let failed = 0

for (const draft of drafts) {
  const publishedId = draft._id.replace(/^drafts\./, '')

  try {
    const doc = await client.getDocument(draft._id)
    if (!doc) {
      console.warn(`  ⚠ Could not fetch ${draft._id} — skipping`)
      failed++
      continue
    }

    const { _id: _draftId, ...rest } = doc
    const published = { ...rest, _id: publishedId }

    await client
      .transaction()
      .createOrReplace(published)
      .delete(draft._id)
      .commit()

    const label = doc.title ?? doc.name ?? publishedId
    console.log(`  ✓  ${label}`)
    ok++
  } catch (err) {
    console.error(`  ✗ Failed: ${draft._id} — ${err.message}`)
    failed++
  }
}

console.log(`\nDone. Published: ${ok}  ·  Failed: ${failed}`)

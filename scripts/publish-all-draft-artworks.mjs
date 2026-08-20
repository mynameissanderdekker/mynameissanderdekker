/**
 * publish-all-draft-artworks.mjs
 *
 * Publishes every artwork that is currently in draft state.
 * A Sanity "publish" = copy draft doc to published ID + delete the draft.
 *
 * Run:     node scripts/publish-all-draft-artworks.mjs
 * Dry run: DRY=1 node scripts/publish-all-draft-artworks.mjs
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

// Fetch all draft artworks
const drafts = await client.fetch(
  `*[_type == "artwork" && _id in path("drafts.**")]{ _id, title }`
)

if (drafts.length === 0) {
  console.log('No draft artworks found — nothing to do.')
  process.exit(0)
}

console.log(`Found ${drafts.length} draft artworks${DRY ? ' (DRY RUN — no changes)' : ''}:\n`)
drafts.forEach(d => console.log(`  ${d.title ?? '(no title)'} [${d._id}]`))
console.log()

if (DRY) {
  console.log('Dry run complete. Remove DRY=1 to actually publish.')
  process.exit(0)
}

// Build mutations: for each draft, fetch the full doc, createOrReplace on published ID, delete draft
let ok = 0
let failed = 0

for (const draft of drafts) {
  const publishedId = draft._id.replace(/^drafts\./, '')

  try {
    // Fetch the full draft document
    const doc = await client.getDocument(draft._id)
    if (!doc) { console.warn(`  ⚠ Could not fetch ${draft._id} — skipping`); failed++; continue }

    // Strip _id so we can set the published one
    const { _id: _draftId, ...rest } = doc
    const published = { ...rest, _id: publishedId }

    await client
      .transaction()
      .createOrReplace(published)
      .delete(draft._id)
      .commit()

    console.log(`  ✓ Published: ${doc.title ?? publishedId}`)
    ok++
  } catch (err) {
    console.error(`  ✗ Failed: ${draft._id} — ${err.message}`)
    failed++
  }
}

console.log(`\nDone. Published: ${ok} · Failed: ${failed}`)

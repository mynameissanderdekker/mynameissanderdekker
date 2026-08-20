/**
 * merge-and-publish-drafts.mjs
 *
 * For every artwork draft: merges draft + published into one clean document.
 *
 * Strategy:
 *   - Draft wins  → content edits (title, year, medium, dimensions, edition,
 *                   images, description, category, etc.)
 *   - Published wins → price migration fields (priceIncVat, priceOnRequest,
 *                      vatRate, status, torchId, torchSoldCount)
 *
 * Result: correct edition data + correct pricing, no more drafts, no orange dots.
 *
 * Run:     node scripts/merge-and-publish-drafts.mjs
 * Dry run: DRY=1 node scripts/merge-and-publish-drafts.mjs
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

// Fields where the PUBLISHED version wins (migration data we want to keep)
const PUBLISHED_WINS = [
  'priceIncVat',
  'priceOnRequest',
  'vatRate',
  'status',
  'torchId',
  'torchSoldCount',
]

console.log('Fetching all draft artworks…')

const drafts = await client.fetch(
  `*[_type == "artwork" && _id in path("drafts.**")]{ _id, title }`
)

if (drafts.length === 0) {
  console.log('✓ No artwork drafts — nothing to do.')
  process.exit(0)
}

console.log(`Found ${drafts.length} artwork draft(s)${DRY ? ' (DRY RUN)' : ''}:\n`)

let ok = 0, skipped = 0, failed = 0

for (const d of drafts) {
  const draftId     = d._id
  const publishedId = draftId.replace(/^drafts\./, '')

  try {
    const [draft, published] = await Promise.all([
      client.getDocument(draftId),
      client.getDocument(publishedId),
    ])

    if (!draft) {
      console.warn(`  ⚠ Draft missing: ${draftId} — skipping`)
      skipped++
      continue
    }

    // Build merged doc: start from draft (user edits win), then overlay
    // specific fields from published (migration data wins).
    const { _id: _dId, _type, ...draftRest } = draft
    const merged = {
      ...draftRest,
      _type,
      _id: publishedId,
    }

    if (published) {
      for (const field of PUBLISHED_WINS) {
        if (published[field] !== undefined) {
          merged[field] = published[field]
        }
      }
    }

    const label = draft.title ?? publishedId
    console.log(`  ${DRY ? '[dry]' : '→'} ${label}`)

    if (!DRY) {
      await client
        .transaction()
        .createOrReplace(merged)
        .delete(draftId)
        .commit()
    }

    ok++
  } catch (err) {
    console.error(`  ✗ Failed: ${draftId} — ${err.message}`)
    failed++
  }
}

console.log(`\nDone. Merged & published: ${ok}  ·  Skipped: ${skipped}  ·  Failed: ${failed}`)
if (DRY) console.log('(Dry run — no changes made. Remove DRY=1 to apply.)')

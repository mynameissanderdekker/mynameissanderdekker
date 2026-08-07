/**
 * merge-duplicate-artworks.mjs
 * Merges 3 pairs of duplicate artworks.
 * For each pair: keeps the artwork-hist-* ID, migrates data + contact references, deletes the other.
 *
 * Run: node scripts/merge-duplicate-artworks.mjs
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

// Pairs: [keepId, deleteId]
const PAIRS = [
  ['artwork-hist-la-vie-est-une-fleur', '179kh736VLd2XUiRq4PlzT'],
  ['artwork-hist-varietes',             'artwork-hist-varietes-frankrijk'],
  ['artwork-hist-the-peeper',           'k57DXB4TxK58qNiTm5fIZq'],
]

async function merge(keepId, deleteId) {
  console.log(`\n── Merging ${deleteId} → ${keepId}`)

  const [keep, del] = await Promise.all([
    client.getDocument(keepId),
    client.getDocument(deleteId),
  ])

  if (!keep) { console.error(`  ✗ ${keepId} not found`); return }
  if (!del)  { console.log(`  · ${deleteId} already gone — skipping`); return }

  console.log(`  Keep: "${keep.title}"`)
  console.log(`  Del:  "${del.title}"`)

  // Merge fields: keep existing value; fill in blanks from the duplicate
  const merged = { ...del, ...keep, _id: keepId }

  // Merge images arrays (combine, deduplicate by asset._ref)
  const keepImgs = keep.images ?? []
  const delImgs  = del.images  ?? []
  const seenRefs = new Set(keepImgs.map(i => i.asset?._ref).filter(Boolean))
  const extraImgs = delImgs.filter(i => !seenRefs.has(i.asset?._ref))
  if (extraImgs.length) {
    merged.images = [...keepImgs, ...extraImgs]
    console.log(`  + ${extraImgs.length} image(s) copied from duplicate`)
  }

  // Save merged artwork
  await client.createOrReplace(merged)
  console.log(`  ✓ ${keepId} updated`)

  // Find all contacts referencing deleteId in purchases
  const contacts = await client.fetch(
    `*[_type == "contact" && purchases[].artwork._ref == $id]{ _id, firstName, lastName, purchases }`,
    { id: deleteId }
  )
  console.log(`  · ${contacts.length} contact(s) reference ${deleteId}`)

  for (const contact of contacts) {
    const updatedPurchases = contact.purchases.map(p =>
      p.artwork?._ref === deleteId
        ? { ...p, artwork: { _type: 'reference', _ref: keepId } }
        : p
    )
    await client.patch(contact._id).set({ purchases: updatedPurchases }).commit()
    console.log(`  ✓ ${contact.firstName} ${contact.lastName} → references updated`)
  }

  // Delete the duplicate
  await client.delete(deleteId)
  console.log(`  ✓ ${deleteId} deleted`)
}

async function main() {
  console.log('=== merge-duplicate-artworks.mjs ===')
  for (const [keepId, deleteId] of PAIRS) {
    await merge(keepId, deleteId)
  }
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })

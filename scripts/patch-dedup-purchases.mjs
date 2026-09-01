/**
 * patch-dedup-purchases.mjs
 *
 * Removes duplicate purchase records that were accidentally added by
 * patch-fix-buyers.mjs (pointing to k57DXB4TxK58qNiTm5VJYQ) when
 * the seed-script purchases already existed on artwork-hist-day-at-the-museum.
 *
 * Also updates existing purchase copyNumbers to the /30 format for
 * Day at the Museum buyers.
 *
 * Run: node scripts/patch-dedup-purchases.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// The two IDs for Day at the Museum
const DAY_HIST_ID    = 'artwork-hist-day-at-the-museum'
const DAY_CATALOG_ID = 'k57DXB4TxK58qNiTm5VJYQ'

// Correct copyNumbers for each contact
const CORRECT_COPY = {
  'contact-hist-stevenie-roseboom':      '1/30',
  'contact-hist-bas-verwoerd':           '2/30',
  'contact-hist-stefan-meier':           '3/30',
  'contact-hist-marjolein-berghs-hendrix': '4/30',
  'contact-hist-nick-botter':            '6/30',
  'contact-hist-rob-de-jong':            '7/30',
  'contact-hist-jelle-rietveld':         '8/30',
  'contact-hist-rob-via-jody':           '9/30',
  'contact-hist-patty-morgan':           '10/30',
  'contact-hist-rosemarijn-blanken':     '11/30',
  'contact-hist-robbert-van-loon':       '12/30',
  'contact-hist-sensemakers':            '13/30',
  'contact-hist-shirien-van-maurik':     '14/30',
}

async function main() {
  console.log('=== patch-dedup-purchases.mjs ===\n')

  // Fetch all contacts that might have Day at the Museum purchases
  const contacts = await client.fetch(
    `*[_type == "contact" && (
      count(purchases[artwork._ref == $hist]) > 0 ||
      count(purchases[artwork._ref == $cat]) > 0
    )]{ _id, purchases }`,
    { hist: DAY_HIST_ID, cat: DAY_CATALOG_ID }
  )

  console.log(`Found ${contacts.length} contacts with Day at the Museum purchases\n`)

  for (const contact of contacts) {
    const purchases = contact.purchases ?? []
    const histPurchases    = purchases.filter(p => p.artwork?._ref === DAY_HIST_ID)
    const catalogPurchases = purchases.filter(p => p.artwork?._ref === DAY_CATALOG_ID)
    const otherPurchases   = purchases.filter(p =>
      p.artwork?._ref !== DAY_HIST_ID && p.artwork?._ref !== DAY_CATALOG_ID
    )

    // Determine the canonical artwork ID to keep
    // Prefer hist (what the Studio shows), but if only catalog exists, keep that
    const hasHist    = histPurchases.length > 0
    const hasCatalog = catalogPurchases.length > 0

    let keepPurchases

    if (hasHist && hasCatalog) {
      // Merge: keep hist record (with best notes), drop catalog duplicates
      const best = histPurchases[0]
      const catalogBest = catalogPurchases[0]
      // Merge notes if catalog has extra info
      const mergedNotes = [best.notes, catalogBest.notes]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i) // dedupe
        .join(' · ') || best.notes || catalogBest.notes
      const correctCopy = CORRECT_COPY[contact._id] ?? best.copyNumber ?? catalogBest.copyNumber
      keepPurchases = [{ ...best, copyNumber: correctCopy, notes: mergedNotes }]
      console.log(`  🔀 ${contact._id}: merged hist+catalog → ${correctCopy}`)
    } else if (hasHist) {
      // Only hist — just update copyNumber
      const correctCopy = CORRECT_COPY[contact._id] ?? histPurchases[0].copyNumber
      keepPurchases = histPurchases.map((p, i) =>
        i === 0 ? { ...p, copyNumber: correctCopy } : p
      ).slice(0, 1)
      console.log(`  ✏️  ${contact._id}: hist-only → ${correctCopy}`)
    } else {
      // Only catalog — remap ref to hist and update copyNumber
      const correctCopy = CORRECT_COPY[contact._id] ?? catalogPurchases[0].copyNumber
      keepPurchases = [{
        ...catalogPurchases[0],
        artwork: { _type: 'reference', _ref: DAY_HIST_ID },
        copyNumber: correctCopy,
      }]
      console.log(`  🔁 ${contact._id}: catalog→hist remap → ${correctCopy}`)
    }

    await client.patch(contact._id).set({ purchases: [...otherPurchases, ...keepPurchases] }).commit()
  }

  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })

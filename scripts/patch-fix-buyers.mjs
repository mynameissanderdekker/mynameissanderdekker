/**
 * patch-fix-buyers.mjs
 *
 * Targeted fixes:
 *   1. Create missing Day at the Museum buyers + add purchases
 *   2. Merge contact-hist-bruno-hnh into Hotel Not Hotel (Bruno = HnH)
 *   3. Remove duplicate Alain Verleysen purchase on The Peeper
 *
 * Run: node scripts/patch-fix-buyers.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// ── 1. Day at the Museum buyers ───────────────────────────────────────────────
// Artwork ID: k57DXB4TxK58qNiTm5VJYQ (from Studio URL)
const DAY_ARTWORK_ID = 'k57DXB4TxK58qNiTm5VJYQ'

const DAY_BUYERS = [
  { id: 'contact-hist-stevenie-roseboom',  firstName: 'Stevenie', lastName: 'Roseboom',  copyNumber: '1/30', notes: '27x40.5cm C-print + frame · €240 · 11-2017 · Webshop' },
  { id: 'contact-hist-bas-verwoerd',        firstName: 'Bas',      lastName: 'Verwoerd',  copyNumber: '2/30', notes: '27x40.5cm C-print + frame · €240 · 11-2017 · Webshop' },
  { id: 'contact-hist-stefan-meier',        firstName: 'Stefan',   lastName: 'Meier',     copyNumber: '3/30', notes: '27x40.5cm C-print · €160 · 11-2017 · Webshop' },
  { id: 'contact-hist-marjolein-berghs-hendrix', firstName: 'Marjolein', lastName: 'Berghs-Hendrix', copyNumber: '4/30', notes: '27x40.5cm C-print + frame · €240 · 11-2017 · Bank transfer' },
  // 5 = Ouders / anonymous — skip
  { id: 'contact-hist-nick-botter',         firstName: 'Nick',     lastName: 'Botter',    copyNumber: '6/30', notes: '27x40.5cm C-print + frame · €250 · 03-2018 · Webshop' },
  { id: 'contact-hist-rob-de-jong',         firstName: 'Rob',      lastName: 'de Jong',   copyNumber: '7/30', notes: '27x40.5cm C-print + frame · 03-2018 · via Marloes' },
  { id: 'contact-hist-jelle-rietveld',      firstName: 'Jelle',    lastName: 'Rietveld',  copyNumber: '8/30', notes: '27x40.5cm C-print · gift · 06-2018' },
  { id: 'contact-hist-rob-via-jody',        firstName: 'Rob',      lastName: '(via Jody Verver)', copyNumber: '9/30', notes: '27x40.5cm C-print + frame · 06-2018' },
  { id: 'contact-hist-patty-morgan',        firstName: 'Patty',    lastName: 'Morgan',    copyNumber: '10/30', notes: '27x40.5cm C-print + frame · 01-2021' },
  { id: 'contact-hist-rosemarijn-blanken',  firstName: 'Rosemarijn',lastName: 'Blanken',  copyNumber: '11/30', notes: '29x43.5cm C-print + frame · €275 · 01-2022 · Webshop' },
  { id: 'contact-hist-robbert-van-loon',    firstName: 'Robbert',  lastName: 'van Loon',  copyNumber: '12/30', notes: '29x43.5cm C-print + frame · €275 · 01-2022 · Webshop' },
  { id: 'contact-hist-sensemakers',         firstName: 'Sensemakers', lastName: '', copyNumber: '13/30', notes: '29x43.5cm C-print + frame · 11-2022' },
  { id: 'contact-hist-shirien-van-maurik',  firstName: 'Shirien',  lastName: 'van Maurik',copyNumber: '14/30', notes: '30x45cm C-print + frame · 09-2023' },
]

async function fixDayAtTheMuseum() {
  console.log('\n── 1. Day at the Museum buyers ──')

  for (const buyer of DAY_BUYERS) {
    // Check if contact exists
    const existing = await client.fetch(`*[_id == $id][0]{ _id, purchases }`, { id: buyer.id })

    const purchase = {
      _type: 'purchase',
      _key: `p-day-${buyer.copyNumber.replace(/\//g,'-')}`,
      artwork: { _type: 'reference', _ref: DAY_ARTWORK_ID },
      copyNumber: buyer.copyNumber,
      notes: buyer.notes,
    }

    if (!existing) {
      // Create contact
      await client.createOrReplace({
        _type: 'contact',
        _id: buyer.id,
        firstName: buyer.firstName,
        lastName: buyer.lastName || undefined,
        purchases: [purchase],
      })
      console.log(`  ✅ Created: ${buyer.firstName} ${buyer.lastName} (${buyer.copyNumber})`)
    } else {
      // Contact exists — check if purchase already there
      const hasPurchase = (existing.purchases ?? []).some(p => p.artwork?._ref === DAY_ARTWORK_ID)
      if (hasPurchase) {
        // Update copyNumber/notes on existing purchase
        const updated = (existing.purchases ?? []).map(p =>
          p.artwork?._ref === DAY_ARTWORK_ID
            ? { ...p, copyNumber: buyer.copyNumber, notes: p.notes || buyer.notes }
            : p
        )
        await client.patch(buyer.id).set({ purchases: updated }).commit()
        console.log(`  📝 Updated: ${buyer.firstName} ${buyer.lastName} (${buyer.copyNumber})`)
      } else {
        // Append purchase
        await client.patch(buyer.id).setIfMissing({ purchases: [] }).append('purchases', [purchase]).commit()
        console.log(`  ➕ Added purchase: ${buyer.firstName} ${buyer.lastName} (${buyer.copyNumber})`)
      }
    }
  }
}

// ── 2. Merge Bruno HnH → Hotel Not Hotel ─────────────────────────────────────
// Bruno is Hotel Not Hotel — merge all his purchases into Hotel Not Hotel's contact,
// then delete the bruno contact.

async function fixBrunoHnH() {
  console.log('\n── 2. Merge Bruno HnH → Hotel Not Hotel ──')

  const BRUNO_ID = 'contact-hist-bruno-hnh'
  const HNH_ID   = 'contact-hist-hotel-not-hotel'

  const [bruno, hnh] = await Promise.all([
    client.fetch(`*[_id == $id][0]{ _id, purchases }`, { id: BRUNO_ID }),
    client.fetch(`*[_id == $id][0]{ _id, purchases }`, { id: HNH_ID }),
  ])

  if (!bruno) { console.log('  ℹ️  Bruno contact not found — nothing to do'); return }
  if (!hnh)   { console.log('  ⚠️  Hotel Not Hotel contact not found'); return }

  const brunoPurchases = bruno.purchases ?? []
  const hnhPurchases   = hnh.purchases ?? []

  // Merge Bruno's purchases into HnH, avoiding duplicates (same artwork ref)
  const hnhArtworkIds = new Set(hnhPurchases.map(p => p.artwork?._ref))
  const toMerge = brunoPurchases
    .filter(p => !hnhArtworkIds.has(p.artwork?._ref))
    .map((p, i) => ({ ...p, _key: `p-bruno-merge-${i}` }))

  if (toMerge.length > 0) {
    const merged = [...hnhPurchases, ...toMerge]
    await client.patch(HNH_ID).set({ purchases: merged }).commit()
    console.log(`  ✅ Merged ${toMerge.length} purchase(s) into Hotel Not Hotel`)
  } else {
    console.log('  ℹ️  All Bruno purchases already covered by HnH — no merge needed')
  }

  // Delete Bruno contact
  await client.delete(BRUNO_ID)
  console.log(`  🗑️  Deleted contact-hist-bruno-hnh`)
}

// ── 3. Remove duplicate Alain Verleysen purchase on The Peeper ────────────────

async function fixPeeperDuplicates() {
  console.log('\n── 3. Deduplicate Alain Verleysen on The Peeper ──')

  // Find The Peeper artwork
  const peeper = await client.fetch(`*[_type == "artwork" && (slug.current == "the-peeper" || _id == "artwork-hist-the-peeper")][0]{ _id }`)
  if (!peeper) { console.log('  ⚠️  The Peeper artwork not found'); return }

  const ALAIN_ID = 'contact-hist-alain-verleysen'
  const alain = await client.fetch(`*[_id == $id][0]{ _id, purchases }`, { id: ALAIN_ID })

  if (!alain) { console.log('  ⚠️  Alain Verleysen contact not found'); return }

  const purchases = alain.purchases ?? []
  const peeperPurchases = purchases.filter(p => p.artwork?._ref === peeper._id)

  if (peeperPurchases.length <= 1) {
    console.log('  ℹ️  No duplicate — nothing to do')
    return
  }

  // Keep the one with the best copyNumber (not '?'), remove extras
  const sorted = [...peeperPurchases].sort((a, b) => {
    const aHas = a.copyNumber && !a.copyNumber.startsWith('?')
    const bHas = b.copyNumber && !b.copyNumber.startsWith('?')
    return (bHas ? 1 : 0) - (aHas ? 1 : 0)
  })
  const keepKey = sorted[0]._key
  const updated = purchases.filter(p => p.artwork?._ref !== peeper._id || p._key === keepKey)
  await client.patch(ALAIN_ID).set({ purchases: updated }).commit()
  console.log(`  ✅ Removed ${peeperPurchases.length - 1} duplicate(s), kept key: ${keepKey}`)
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== patch-fix-buyers.mjs ===')
  await fixDayAtTheMuseum()
  await fixBrunoHnH()
  await fixPeeperDuplicates()
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })

/**
 * merge-all-duplicate-contacts.mjs
 *
 * Merges all duplicate contacts found in the database.
 * Strategy per group:
 *   - Keep the contact with the most purchases (tie → prefer contact-hist-* IDs)
 *   - Copy all purchases + viewingRooms from duplicates into keeper
 *   - Fill any missing fields (email, phone, city, etc.) from duplicates
 *   - Update real email on keeper when it only had a placeholder (@placeholder.art)
 *   - Delete the duplicates
 *
 * DRY_RUN=true  → only prints what would happen, no writes
 * Run: node scripts/merge-all-duplicate-contacts.mjs
 * Dry: DRY_RUN=true node scripts/merge-all-duplicate-contacts.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import crypto from 'crypto'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// ── Merge groups ──────────────────────────────────────────────────────────────
// Each group: { keep: 'id', dupes: ['id', ...] }
// Dupes will be merged into keep, then deleted.
// Groups marked skip: intentionally different people / too ambiguous.

const MERGE_GROUPS = [
  // ── Same email (definitive matches) ──────────────────────────────────────
  { note: 'Bas Verwoerd',        keep: 'contact-hist-bas-verwoerd',       dupes: ['GskSHzltiom27vUz3pMMve'] },
  { note: 'Bernd Roloff',        keep: 'contact-hist-bernd-roloff',       dupes: ['k57DXB4TxK58qNiTm5TIT8'] },
  // Bruno Bont / Hotel Not Hotel — 3 entries, same email
  { note: 'Bruno Bont / HNH',    keep: 'contact-hist-hotel-not-hotel',    dupes: ['contact-hist-bruno-hnh', 'GskSHzltiom27vUz3pMuDq'] },
  { note: 'Jelle Rietveld',      keep: 'contact-hist-jelle-rietveld',     dupes: ['GskSHzltiom27vUz3pMsvZ'] },
  { note: 'Guido de Bruyn',      keep: 'contact-hist-guido-de-bruyn',     dupes: ['k57DXB4TxK58qNiTm5TWcY'] },
  { note: 'Elena Köstler',       keep: 'contact-hist-elena-kostler',      dupes: ['PGI1Mc19xNWwE3RgMsBbmW'] },
  { note: 'Emma Ruimschotel',    keep: 'contact-hist-emma-ruimschotel',   dupes: ['PGI1Mc19xNWwE3RgMsBOFU'] },
  { note: 'Eva Lagerweij',       keep: 'contact-hist-eva-lagerweij',      dupes: ['k57DXB4TxK58qNiTm5TMr8'] },
  // Anneke Dekker — 3 entries, same email
  { note: 'Anneke Dekker',       keep: 'contact-hist-anneke-dekker',      dupes: ['PGI1Mc19xNWwE3RgMsBE1Y', 'contact-hist-fransie'] },
  { note: 'Fleur Souverein',     keep: 'contact-hist-fleur-souverein',    dupes: ['PGI1Mc19xNWwE3RgMsAkqy'] },
  // Frans Oomen / MO Art Gallery — keep the one with 7 purchases
  { note: 'Frans Oomen',         keep: 'k57DXB4TxK58qNiTm5TIJG',         dupes: ['contact-hist-frans-oomen'] },
  { note: 'Jeroen de Graaf',     keep: 'contact-hist-jeroen-de-graaf',    dupes: ['k57DXB4TxK58qNiTm5TIlm'] },
  { note: 'Kristian Hornsleth',  keep: 'contact-hist-kristian-hornsleth', dupes: ['GskSHzltiom27vUz3pMnJi'] },
  // Lukas Schneider / Whylder — same email (lukas@whylder.com)
  { note: 'Lukas Schneider',     keep: 'contact-hist-lukas-schneider',    dupes: ['PGI1Mc19xNWwE3RgMsBLJh'] },
  { note: 'Merijn Kavelaars',    keep: 'contact-hist-merijn-kavelaars',   dupes: ['GskSHzltiom27vUz3pMLCc'] },
  { note: 'Peter van Rhoon',     keep: 'contact-hist-peter-van-rhoon',    dupes: ['GskSHzltiom27vUz3pMOmK'] },
  // Stefan Meier — keep the one with 9 purchases
  { note: 'Stefan Meier',        keep: 'k57DXB4TxK58qNiTm5TIwk',         dupes: ['contact-hist-stefan-meier'] },
  { note: 'Maja Reineman',       keep: 'contact-hist-maja-reineman',      dupes: ['GskSHzltiom27vUz3pMTWf'] },
  // Robbert van Loon — keep the one with address + 2 purchases
  { note: 'Robbert van Loon',    keep: 'k57DXB4TxK58qNiTm5TKiQ',         dupes: ['contact-hist-robbert-van-loon'] },
  // Roy Sapuletej — keep the one with 2 purchases + location
  { note: 'Roy Sapuletej',       keep: 'k57DXB4TxK58qNiTm5TLdS',         dupes: ['contact-hist-roy-sapuletej'] },
  { note: 'Stevenie Roseboom',   keep: 'contact-hist-stevenie-roseboom',  dupes: ['PGI1Mc19xNWwE3RgMsArcU'] },
  // Shirien van Maurik — keep the one with 5 purchases
  { note: 'Shirien van Maurik',  keep: 'GskSHzltiom27vUz3pM6px',         dupes: ['contact-hist-shirien-van-maurik'] },

  // ── Same name + one has placeholder email ─────────────────────────────────
  // Keep the one with purchases; real email will be copied from dupe if keeper has placeholder
  { note: 'Branko van Kooten',   keep: 'contact-hist-branko-van-kooten',  dupes: ['k57DXB4TxK58qNiTm5TTz8'] },
  { note: 'Katharina Arndt',     keep: 'contact-hist-katharina-arndt',    dupes: ['PGI1Mc19xNWwE3RgMsBINu'] },
  { note: 'Kurt Gaugler',        keep: 'contact-hist-kurt-gaugler',       dupes: ['k57DXB4TxK58qNiTm5TNx8'] },
  // Men at Work / Mo Art Gallery — keep real-email gallery entry
  { note: 'Men at Work',         keep: 'k57DXB4TxK58qNiTm5eFgs',         dupes: ['contact-hist-men-at-work'] },
  { note: 'Pim de Bruijne',      keep: 'PGI1Mc19xNWwE3RgMsAz3x',         dupes: ['contact-hist-pim-de-bruijne'] },
  { note: 'Rosemarijn Blanken',  keep: 'GskSHzltiom27vUz3pM9BD',         dupes: ['contact-hist-rosemarijn-blanken'] },
  // Ryan Merrett — different emails but clearly same person; keep the 8-purchase record
  { note: 'Ryan Merrett',        keep: 'PGI1Mc19xNWwE3RgMsAmHX',         dupes: ['contact-hist-ryan-merrett'] },
  { note: 'Willem Asselbergs',   keep: 'GskSHzltiom27vUz3pMXqF',         dupes: ['contact-hist-willem-asselbergs'] },

  // Marloes van Vugt — 3 entries confirmed same person
  { note: 'Marloes van Vugt',    keep: 'contact-hist-marloes-van-vugt',   dupes: ['contact-hist-marloes-i-spy-ap', 'GskSHzltiom27vUz3pM7W0'] },

  // ── SKIPPED (intentionally separate or too ambiguous) ─────────────────────
  // "aaf customer"     — 2 different placeholder-email art fair customers
  // "nadia van den berg" — 2 different real emails
  // "rob" / "rob de jong" — common name, different real emails
  // "sander dekker"    — two of your own entries, intentionally separate
  // "lukas schneider" (lukasmschneider@gmail.com) — different email from hist record
]

// ── Fetch all involved contacts ───────────────────────────────────────────────

const allIds = [...new Set(MERGE_GROUPS.flatMap(g => [g.keep, ...g.dupes]))]
const contacts = await client.fetch(
  `*[_id in $ids]{ _id, firstName, lastName, email, phone, company, vatNumber,
     street, postalCode, city, country, type, notes, source, subscribed,
     subscribedAt, interests, purchases, viewingRooms }`,
  { ids: allIds }
)
const byId = Object.fromEntries(contacts.map(c => [c._id, c]))

// ── Process each group ────────────────────────────────────────────────────────

let totalMerged = 0
let totalDeleted = 0

for (const { note, keep: keepId, dupes: dupeIds } of MERGE_GROUPS) {
  const keeper = byId[keepId]
  if (!keeper) {
    console.warn(`⚠  Keeper not found: ${keepId} (${note}) — skipping`)
    continue
  }

  const dupes = dupeIds.map(id => byId[id]).filter(Boolean)
  if (dupes.length === 0) {
    console.log(`✓  ${note} — dupes not found (already cleaned up?)`)
    continue
  }

  console.log(`\n→ Merging: ${note}`)
  console.log(`  Keep:  ${keepId} (${keeper.firstName} ${keeper.lastName}, ${keeper.email}, ${keeper.purchases?.length ?? 0} purchases)`)
  dupes.forEach(d => console.log(`  Merge: ${d._id} (${d.firstName} ${d.lastName}, ${d.email}, ${d.purchases?.length ?? 0} purchases)`))

  if (!DRY_RUN) {
    // Collect extra purchases (re-key to avoid _key collisions)
    const extraPurchases = dupes
      .flatMap(d => d.purchases ?? [])
      .map(p => ({ ...p, _key: `merged-${crypto.randomUUID().replace(/-/g,'').slice(0,12)}` }))

    // Collect extra viewingRooms
    const extraRooms = dupes
      .flatMap(d => d.viewingRooms ?? [])
      .map(r => ({ ...r, _key: `merged-${crypto.randomUUID().replace(/-/g,'').slice(0,12)}` }))

    const patch = client.patch(keepId).setIfMissing({})

    // Fill missing fields from dupes (first non-empty wins)
    const fill = (field) => {
      if (keeper[field]) return
      const val = dupes.map(d => d[field]).find(v => v && !String(v).includes('@placeholder.art'))
      if (val) patch.set({ [field]: val })
    }

    // If keeper has placeholder email, replace with real email from dupe
    if (!keeper.email || keeper.email.includes('@placeholder.art')) {
      const realEmail = dupes.map(d => d.email).find(e => e && !e.includes('@placeholder.art'))
      if (realEmail) {
        console.log(`  → Updating placeholder email to: ${realEmail}`)
        patch.set({ email: realEmail })
      }
    }

    ;['phone','company','vatNumber','street','postalCode','city','country','notes','source'].forEach(fill)

    if (extraPurchases.length > 0) {
      patch.setIfMissing({ purchases: [] }).append('purchases', extraPurchases)
      console.log(`  → Adding ${extraPurchases.length} purchases`)
    }
    if (extraRooms.length > 0) {
      patch.setIfMissing({ viewingRooms: [] }).append('viewingRooms', extraRooms)
    }

    await patch.commit()

    // Delete dupes
    for (const d of dupes) {
      await client.delete(d._id)
      console.log(`  ✓ Deleted ${d._id}`)
      totalDeleted++
    }
    totalMerged++
  }
}

console.log(`\n${ DRY_RUN ? '[DRY RUN] Would have merged' : 'Done —'} ${totalMerged} groups, deleted ${totalDeleted} contacts.`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply changes.')

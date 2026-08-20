/**
 * normalize-copy-numbers.mjs
 *
 * Normalises copyNumber values in all contact.purchases entries:
 *   "4"    → "4/7"   (using artwork.editionTotal)
 *   "AP 1" → "1/2 AP" (using artwork.editionAP)
 *   "AP1"  → "1/2 AP"
 *   Already correct ("4/7", "1/2 AP") → untouched
 *   "?"    → untouched (genuinely unknown)
 *   blank  → untouched (publications)
 *
 * DRY_RUN=true  → only prints changes, no writes
 * Run: node scripts/normalize-copy-numbers.mjs
 * Dry: DRY_RUN=true node scripts/normalize-copy-numbers.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

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

// ── Fetch all artworks with edition info ──────────────────────────────────────
const artworks = await client.fetch(
  `*[_type == "artwork" && (editionTotal > 0 || editionAP > 0)]{ _id, title, editionTotal, editionAP }`
)
const artworkMap = Object.fromEntries(artworks.map(a => [a._id, a]))
console.log(`Loaded ${artworks.length} artworks with edition info\n`)

// ── Fetch all contacts with purchases ─────────────────────────────────────────
const contacts = await client.fetch(
  `*[_type == "contact" && defined(purchases) && count(purchases) > 0]{ _id, firstName, lastName, purchases }`
)
console.log(`Loaded ${contacts.length} contacts with purchases\n`)

// ── Normalisation function ────────────────────────────────────────────────────

function normalise(raw, total, ap) {
  if (!raw || raw === '?' || raw.trim() === '') return null  // nothing to fix

  const v = raw.trim()

  // Already correct formats → skip
  if (/^\d+\/\d+$/.test(v)) return null           // "4/7"
  if (/^\d+\/\d+\s*AP$/i.test(v)) return null     // "1/2 AP"
  if (/^AP\s*\d+\/\d+$/i.test(v)) {
    // "AP 1/2" → convert to "1/2 AP" (our new canonical format)
    const m = v.match(/^AP\s*(\d+)\/(\d+)$/i)
    return `${m[1]}/${m[2]} AP`
  }

  // "AP 1" or "AP1" → "1/2 AP"
  const apMatch = v.match(/^AP\s*(\d+)$/i)
  if (apMatch) {
    const n = parseInt(apMatch[1], 10)
    return ap > 0 ? `${n}/${ap} AP` : null
  }

  // Bare number "4" → "4/7"
  const n = parseInt(v, 10)
  if (!isNaN(n) && String(n) === v) {
    return total > 0 ? `${n}/${total}` : null
  }

  return null  // unrecognised format, leave alone
}

// ── Process each contact ──────────────────────────────────────────────────────

let totalPatched = 0
let totalFixed   = 0

for (const contact of contacts) {
  const newPurchases = contact.purchases.map(p => {
    const artworkId = p.artwork?._ref
    if (!artworkId) return p

    const artwork = artworkMap[artworkId]
    if (!artwork) return p

    const fixed = normalise(p.copyNumber, artwork.editionTotal ?? 0, artwork.editionAP ?? 0)
    if (!fixed) return p

    return { ...p, copyNumber: fixed }
  })

  // Check if anything changed
  const changes = newPurchases.filter((p, i) => p.copyNumber !== contact.purchases[i].copyNumber)
  if (changes.length === 0) continue

  console.log(`${contact.firstName} ${contact.lastName} (${contact._id})`)
  for (let i = 0; i < newPurchases.length; i++) {
    const orig = contact.purchases[i].copyNumber
    const next = newPurchases[i].copyNumber
    if (orig !== next) {
      const artId = contact.purchases[i].artwork?._ref
      const art   = artworkMap[artId]
      console.log(`  "${art?.title ?? artId}": "${orig}" → "${next}"`)
      totalFixed++
    }
  }

  if (!DRY_RUN) {
    await client.patch(contact._id).set({ purchases: newPurchases }).commit()
    totalPatched++
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN]' : 'Done —'} ${totalFixed} copy numbers normalised across ${DRY_RUN ? '(would patch)' : totalPatched} contacts.`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply.')

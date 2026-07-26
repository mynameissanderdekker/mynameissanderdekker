/**
 * sync-drafts-purchases.mjs
 *
 * Kopieert het 'purchases' veld van gepubliceerde contacten naar hun open drafts.
 * Nodig omdat de import-purchases.mjs alleen de gepubliceerde versie bijwerkte.
 *
 * Gebruik: node scripts/sync-drafts-purchases.mjs
 */

import { createClient } from '@sanity/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

async function main() {
  // Haal alle gepubliceerde contacten met purchases op
  const published = await sanity.fetch(
    `*[_type == "contact" && defined(purchases) && count(purchases) > 0]{ _id, firstName, lastName, purchases }`
  )
  console.log(`${published.length} gepubliceerde contacten met aankopen\n`)

  // Haal alle drafts op
  const drafts = await sanity.fetch(
    `*[_id in path("drafts.**") && _type == "contact"]{ _id, purchases }`
  )
  const draftMap = new Map(drafts.map(d => [d._id.replace('drafts.', ''), d]))
  console.log(`${drafts.length} open drafts gevonden\n`)

  let synced = 0
  for (const pub of published) {
    const draft = draftMap.get(pub._id)
    if (!draft) continue // geen open draft, geen probleem

    const name = [pub.firstName, pub.lastName].filter(Boolean).join(' ')
    await sanity.patch(`drafts.${pub._id}`)
      .set({ purchases: pub.purchases })
      .commit({ visibility: 'async' })
    console.log(`✓ ${name} — ${pub.purchases.length} aankopen naar draft gekopieerd`)
    synced++
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n✅  ${synced} drafts bijgewerkt`)
}

main().catch(console.error)

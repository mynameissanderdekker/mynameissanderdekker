/**
 * find-duplicate-contacts.mjs
 *
 * Zoekt contacten in Sanity die waarschijnlijk dezelfde persoon zijn
 * (zelfde naam maar ander emailadres, of erg vergelijkbare namen).
 *
 * Gebruik: node scripts/find-duplicate-contacts.mjs
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
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

function normalize(str = '') {
  return str.toLowerCase().replace(/[^a-z]/g, '')
}

async function main() {
  console.log('👥  Contacten ophalen…')
  const contacts = await sanity.fetch(
    `*[_type == "contact"]{ _id, firstName, lastName, email, "purchaseCount": count(purchases) } | order(lastName asc)`
  )
  console.log(`   ${contacts.length} contacten geladen\n`)

  // ── Groepeer op genormaliseerde naam ────────────────────────────────────────
  const byName = new Map()
  for (const c of contacts) {
    const key = normalize(c.firstName) + normalize(c.lastName)
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key).push(c)
  }

  const dupes = [...byName.values()].filter(group => group.length > 1)

  if (!dupes.length) {
    console.log('✅  Geen duplicaten gevonden.')
    return
  }

  console.log(`⚠️   ${dupes.length} mogelijke duplicaten:\n`)
  for (const group of dupes) {
    console.log(`  ${group[0].firstName} ${group[0].lastName}`)
    for (const c of group) {
      console.log(`    • ${c.email ?? '(geen email)'}  [${c.purchaseCount ?? 0} aankopen]  id: ${c._id}`)
    }
    console.log()
  }
}

main().catch(console.error)

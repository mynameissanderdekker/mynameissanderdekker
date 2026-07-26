/**
 * sync-releases-purchases.mjs
 *
 * Kopieert 'purchases' van gepubliceerde contacten naar open release-versies.
 * Sanity Releases slaan documenten op als versions.{releaseId}.{docId}
 *
 * Gebruik: node scripts/sync-releases-purchases.mjs
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
  // Gepubliceerde contacten met aankopen
  const published = await sanity.fetch(
    `*[_type == "contact" && defined(purchases) && count(purchases) > 0]{ _id, firstName, lastName, purchases }`
  )
  console.log(`${published.length} gepubliceerde contacten met aankopen`)

  const publishedMap = new Map(published.map(c => [c._id, c]))

  // Release-versies van contacten
  const releases = await sanity.fetch(
    `*[_id in path("versions.*.*") && _type == "contact"]{ _id, purchases }`
  )
  console.log(`${releases.length} contact-versies in releases\n`)

  let synced = 0
  for (const rel of releases) {
    // versions.{releaseId}.{docId} → docId is het laatste deel
    const parts = rel._id.split('.')
    const docId = parts[parts.length - 1]
    const pub = publishedMap.get(docId)
    if (!pub) continue

    const name = [pub.firstName, pub.lastName].filter(Boolean).join(' ')
    await sanity.patch(rel._id)
      .set({ purchases: pub.purchases })
      .commit({ visibility: 'async' })
    console.log(`✓ ${name} → ${rel._id.slice(0, 40)}…`)
    synced++
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n✅  ${synced} release-versies bijgewerkt`)
  if (releases.length === 0) {
    console.log('   (geen release-versies gevonden — probeer "Publish all" in Studio Releases)')
  }
}

main().catch(console.error)

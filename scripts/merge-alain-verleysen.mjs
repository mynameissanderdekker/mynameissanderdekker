/**
 * merge-alain-verleysen.mjs
 * Merges the two duplicate Alain Verleysen contacts.
 * Keeps the one with address (Hofstade, BE), merges purchases from the other, deletes the duplicate.
 *
 * Run: node scripts/merge-alain-verleysen.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

async function run() {
  // Find all contacts named Alain Verleysen (case-insensitive match via both casings)
  const contacts = await client.fetch(
    `*[_type == "contact" && firstName match "Alain*" && lastName match "Verley*"] | order(_createdAt asc) {
      _id, firstName, lastName, email, phone, company, city, country, street, postalCode,
      type, subscribed, source, notes, purchases, viewingRooms, _createdAt
    }`
  )

  if (contacts.length < 2) {
    console.log(`Found ${contacts.length} contact(s) — nothing to merge.`)
    console.log(contacts.map(c => `  ${c._id}  ${c.firstName} ${c.lastName}  ${c.city ?? '—'}`).join('\n'))
    return
  }

  console.log(`Found ${contacts.length} contacts:`)
  contacts.forEach(c => console.log(`  ${c._id}  "${c.firstName} ${c.lastName}"  city=${c.city ?? '—'}  purchases=${c.purchases?.length ?? 0}`))

  // Keep the one with address (city set), fall back to oldest
  const keeper = contacts.find(c => c.city) ?? contacts[0]
  const dupes   = contacts.filter(c => c._id !== keeper._id)

  console.log(`\nKeeping: ${keeper._id}`)
  dupes.forEach(d => console.log(`Merging + deleting: ${d._id}`))

  // Collect all purchases from dupes
  const extraPurchases = dupes.flatMap(d => (d.purchases ?? []).map(p => ({
    ...p,
    _key: `merged-${Math.random().toString(36).slice(2)}`,
  })))

  // Collect all viewingRooms from dupes
  const extraRooms = dupes.flatMap(d => (d.viewingRooms ?? []).map(r => ({
    ...r,
    _key: `merged-${Math.random().toString(36).slice(2)}`,
  })))

  // Merge missing fields from dupes into keeper
  const fillFrom = dupes[0]
  const patch = client.patch(keeper._id)

  if (!keeper.phone   && fillFrom.phone)   patch.setIfMissing({ phone:   fillFrom.phone })
  if (!keeper.company && fillFrom.company) patch.setIfMissing({ company: fillFrom.company })
  if (!keeper.street  && fillFrom.street)  patch.setIfMissing({ street:  fillFrom.street })
  if (!keeper.postalCode && fillFrom.postalCode) patch.setIfMissing({ postalCode: fillFrom.postalCode })
  if (!keeper.notes   && fillFrom.notes)   patch.setIfMissing({ notes:   fillFrom.notes })
  if (!keeper.source  && fillFrom.source)  patch.setIfMissing({ source:  fillFrom.source })

  if (extraPurchases.length > 0) {
    patch.setIfMissing({ purchases: [] }).append('purchases', extraPurchases)
  }
  if (extraRooms.length > 0) {
    patch.setIfMissing({ viewingRooms: [] }).append('viewingRooms', extraRooms)
  }

  await patch.commit()
  console.log(`\n✓ Merged data into keeper ${keeper._id}`)

  // Delete dupes
  for (const d of dupes) {
    await client.delete(d._id)
    console.log(`✓ Deleted ${d._id}`)
  }

  console.log('\nDone. Alain Verleysen contacts merged.')
}

run().catch(err => { console.error(err); process.exit(1) })

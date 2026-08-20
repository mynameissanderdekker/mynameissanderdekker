/**
 * migrate-price-to-inc-vat.mjs
 *
 * One-time migration: for artworks that have priceExclVAT but no priceIncVat,
 * compute priceIncVat = round(priceExclVAT * (1 + vatRate/100))
 * and convert vatRate from number to string.
 *
 * Run: node scripts/migrate-price-to-inc-vat.mjs
 * Dry run (no writes): DRY=1 node scripts/migrate-price-to-inc-vat.mjs
 */

import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const DRY = process.env.DRY === '1'

// Include artworks that already have priceIncVat too — we need to correct the wrong value
const artworks = await client.fetch(
  `*[_type == "artwork" && defined(priceExclVAT) && !(_id in path("drafts.**"))]{
    _id, title, priceExclVAT, priceIncVat, vatRate
  }`
)

console.log(`Found ${artworks.length} artworks to migrate${DRY ? ' (DRY RUN)' : ''}\n`)

let ok = 0, skipped = 0

for (const artwork of artworks) {
  // priceExclVAT was misnamed — values were already incl. BTW
  // so priceIncVat = priceExclVAT (no multiplication needed)
  const vatNum = typeof artwork.vatRate === 'number' ? artwork.vatRate : Number(artwork.vatRate ?? 9)
  const vatStr = String([0, 9, 21].includes(vatNum) ? vatNum : 9)
  const priceIncVat = artwork.priceExclVAT  // direct copy — already incl. BTW

  console.log(
    `  ${artwork.title}\n` +
    `    priceExclVAT(was incl.)=${artwork.priceExclVAT} → priceIncVat=${priceIncVat} vatRate="${vatStr}"`
  )

  if (DRY) { skipped++; continue }

  await client.patch(artwork._id)
    .set({ priceIncVat, vatRate: vatStr })
    .commit({ autoGenerateArrayKeys: true })

  ok++
}

console.log(`\n${DRY ? 'Would patch' : 'Patched'} ${ok + skipped} artworks.`)

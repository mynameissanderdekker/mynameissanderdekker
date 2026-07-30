/**
 * Fix: "My name is Sander Dekker Nº 2" is missing price in Sanity.
 * Run from the project root:
 *   SANITY_WRITE_TOKEN=sk... node scripts/fix-no2-price.mjs
 *
 * The script will first PRINT the current document so you can confirm,
 * then ask you to press Enter before patching.
 */

import { createClient } from '@sanity/client'
import * as readline from 'readline'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) { console.error('Set SANITY_WRITE_TOKEN first'); process.exit(1) }

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2026-07-25',
  token,
  useCdn: false,
})

const docs = await client.fetch(
  `*[_type == "artwork" && (title match "*Nº 2*" || title match "*No 2*" || title match "*N\\u00ba 2*")]{_id, title, priceExclVAT, vatRate, status, showInWebshop}`,
)

if (docs.length === 0) {
  console.log('No artwork matching "Nº 2" found. Try adjusting the query.')
  process.exit(0)
}

console.log('\nFound documents:')
docs.forEach((d, i) => console.log(`  [${i}] ${d._id} | ${d.title} | price: ${d.priceExclVAT ?? 'MISSING'} | status: ${d.status}`))

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('\nEnter the INDEX of the doc to patch (or q to quit): ', async (answer) => {
  rl.close()
  if (answer === 'q') { console.log('Aborted.'); process.exit(0) }
  const idx = parseInt(answer)
  if (isNaN(idx) || idx < 0 || idx >= docs.length) { console.error('Invalid index'); process.exit(1) }

  const doc = docs[idx]
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl2.question(`\nEnter price excl. VAT for "${doc.title}" (e.g. 27.52): `, async (priceStr) => {
    rl2.close()
    const price = parseFloat(priceStr)
    if (isNaN(price)) { console.error('Invalid price'); process.exit(1) }

    const result = await client
      .patch(doc._id)
      .set({ priceExclVAT: price, vatRate: 9 })
      .commit()

    console.log(`\n✓ Patched: ${result._id} — price set to ${price} (excl. 9% VAT)`)
  })
})

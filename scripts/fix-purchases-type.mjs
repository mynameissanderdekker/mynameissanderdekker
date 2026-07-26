/**
 * fix-purchases-type.mjs
 *
 * De eerste import sloeg purchases op met _type:'object' waardoor
 * Sanity Studio ze niet toont. Dit script herplaatst alle purchases
 * zonder die _type zodat Studio ze wel rendert.
 *
 * Gebruik: node scripts/fix-purchases-type.mjs
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
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(purchases) && count(purchases) > 0]
     { _id, firstName, lastName, purchases }`
  )
  console.log(`${contacts.length} contacten met aankopen\n`)

  let fixed = 0
  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ')

    // Verwijder _type van elk purchase-item
    const cleaned = c.purchases.map(({ _type, ...rest }) => rest)

    await sanity.patch(c._id)
      .set({ purchases: cleaned })
      .commit()

    console.log(`✓ ${name} — ${cleaned.length} aankopen`)
    fixed++
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n✅  ${fixed} contacten bijgewerkt`)
}

main().catch(console.error)

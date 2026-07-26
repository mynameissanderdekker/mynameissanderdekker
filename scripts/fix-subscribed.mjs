/**
 * fix-subscribed.mjs
 *
 * Verwijdert 'subscribed: false' van contacten die via WooCommerce zijn
 * binnengekomen maar nooit een actieve uitschrijving hebben gehad.
 *
 * Gebruik: node scripts/fix-subscribed.mjs
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
  // Alle contacten met subscribed: false — Mailchimp export bevatte alleen ingeschrevenen,
  // dus niemand had uitgeschreven mogen worden
  const contacts = await sanity.fetch(
    `*[_type == "contact" && subscribed == false]{ _id, firstName, lastName, email }`
  )

  console.log(`${contacts.length} contacten gevonden met subscribed: false\n`)

  let fixed = 0
  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
    try {
      await sanity.patch(c._id).unset(['subscribed', 'unsubscribedAt']).commit({ visibility: 'async' })
      console.log(`✓ ${name} (${c.email})`)
      fixed++
    } catch (err) {
      console.error(`⚠️  ${name}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n✅  ${fixed} contacten gerepareerd`)
}

main().catch(console.error)

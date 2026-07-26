/**
 * apply-instagram-review.mjs
 *
 * Verwerkt de handmatig nagekeken review.csv en past bevestigde matches toe.
 *
 * Gebruik:
 *   1. Open scripts/instagram/review.csv
 *   2. Zet "ja" in de laatste kolom voor correcte matches
 *   3. Draai: node scripts/apply-instagram-review.mjs
 */

import { createClient } from '@sanity/client'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
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

const CSV_PATH = join(__dirname, 'instagram/review.csv')

async function main() {
  const rows = []
  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity })
  let header = true
  for await (const line of rl) {
    if (header) { header = false; continue }
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
    const [name, email, username, , , , confirm] = cols
    if (confirm?.toLowerCase() === 'ja' && email && username) {
      rows.push({ name, email, username })
    }
  }

  console.log(`${rows.length} bevestigde matches toepassen…\n`)

  for (const { name, email, username } of rows) {
    const contact = await sanity.fetch(
      `*[_type == "contact" && email == $email][0]{ _id }`,
      { email }
    )
    if (!contact) { console.log(`⚠️  Niet gevonden: ${email}`); continue }

    await sanity.patch(contact._id).set({ instagram: username }).commit({ visibility: 'async' })
    console.log(`✓ ${name} → @${username}`)
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\n✅  Klaar!')
}

main().catch(console.error)

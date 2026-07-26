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

const contacts = await sanity.fetch(
  `*[_type == "contact" && subscribed != true]{ _id, firstName, lastName }`
)

console.log(`${contacts.length} contacten bijwerken…`)

for (const c of contacts) {
  await sanity.patch(c._id).set({ subscribed: true }).unset(['unsubscribedAt']).commit({ visibility: 'async' })
  process.stdout.write('.')
  await new Promise(r => setTimeout(r, 80))
}

console.log(`\n✅  Klaar! Alle contacten staan nu op ingeschreven.`)

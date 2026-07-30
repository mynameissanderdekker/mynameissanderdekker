// Verwijder geselecteerde artworks uit Sanity
// Uitvoeren vanuit project-root: node scripts/delete-artworks.mjs

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET,
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
  apiVersion: '2024-01-01',
})

const toDelete = [
  { id: 'NJpDeWPGlsYAY2Gy8PLBlX', title: 'Bridge to the Supernatural' },
  { id: 'nX4UJtN64XhPlovUgYbuK7', title: 'Voyage into the Unknown' },
  { id: 'iDneq7i7OtjTndYyXoLlri', title: 'Dirtysocksgirl' },
]

console.log('Verwijderen...\n')

for (const doc of toDelete) {
  try {
    await client.delete(doc.id)
    await client.delete(`drafts.${doc.id}`).catch(() => {})
    console.log(`✓ ${doc.title}`)
  } catch (err) {
    console.error(`✗ ${doc.title}: ${err.message}`)
  }
}

console.log('\nKlaar! Herlaad de Studio om de wijzigingen te zien.')

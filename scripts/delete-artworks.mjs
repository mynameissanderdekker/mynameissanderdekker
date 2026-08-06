// Verwijder geselecteerde artworks uit Sanity
// Stap 1: ontkoppel van projectSeries
// Stap 2: verwijder het artwork document
// Uitvoeren vanuit project-root: node scripts/delete-artworks.mjs

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local'), quiet: true })

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
const idsToDelete = toDelete.map(d => d.id)

// ── Stap 1: zoek alle projectSeries die naar deze artworks verwijzen ──────────
console.log('Stap 1: ontkoppelen van projectSeries...\n')

const seriesList = await client.fetch(
  `*[_type == "projectSeries" && count(artworks[@ in $ids]) > 0]{ _id, title, artworks }`,
  { ids: idsToDelete.map(id => ({ _type: 'reference', _ref: id })) }
).catch(() => [])

// Alternatieve query als referentie-matching niet werkt
const allSeries = await client.fetch(`*[_type == "projectSeries"]{ _id, title, artworks }`)
const affectedSeries = allSeries.filter(s =>
  (s.artworks ?? []).some(ref => idsToDelete.includes(ref._ref))
)

for (const series of affectedSeries) {
  const filtered = (series.artworks ?? []).filter(ref => !idsToDelete.includes(ref._ref))
  await client.patch(series._id).set({ artworks: filtered }).commit()
  console.log(`✓ Ontkoppeld van "${series.title || series._id}"`)
}

if (affectedSeries.length === 0) {
  console.log('  Geen projectSeries referenties gevonden.')
}

// ── Stap 2: verwijder de artworks ────────────────────────────────────────────
console.log('\nStap 2: artworks verwijderen...\n')

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

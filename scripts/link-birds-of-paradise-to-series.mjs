/**
 * link-birds-of-paradise-to-series.mjs
 *
 * Links the 23 Birds of Paradise artworks to 'The Zine Project' projectSeries.
 * Run: node scripts/link-birds-of-paradise-to-series.mjs
 */
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

const TITLES = [
  "Vive la Vie!",
  "La Vie Est Une Fleur Dont l'Amour Est le Miel",
  "Vouloir, C'est Pouvoir",
  "La Sexualité Est un Acte de Liberté, Non de Soumission",
  "C'est Juste Moi",
  "Peek-a-Boo Paradox",
  "Peephole",
  "Optical Phenomenon",
  "Madox",
  "Pat",
  "Stefa",
  "Wiktor",
  "Anthony & Otto",
  "Evolution of Imitation",
  "Evolution of Imitation II",
  "Unleashed Moments",
  "Embrace Your Freedom",
  "Misophonic Feast",
  "Roots of the Self",
  "Magical Fountain",
  "The Forest Fairy",
  "Natural Contortion",
  "Voyage into the Unknown",
]

// Find The Zine Project series
const series = await client.fetch(
  `*[_type == "projectSeries" && title == "The Zine Project"][0]{_id, title, artworks}`
)

if (!series) {
  console.error('❌  "The Zine Project" series not found in Sanity.')
  process.exit(1)
}
console.log(`✅  Found series: "${series.title}" (${series._id})`)

// Fetch all matching artwork IDs
const artworkIds = await client.fetch(
  `*[_type == "artwork" && title in $titles]._id`,
  { titles: TITLES }
)

console.log(`🎨  Found ${artworkIds.length}/${TITLES.length} artworks in Sanity`)

if (artworkIds.length === 0) {
  console.error('❌  No artworks found — run seed-birds-of-paradise.mjs first.')
  process.exit(1)
}

// Filter out already-linked artworks
const alreadyLinked = new Set((series.artworks ?? []).map(r => r._ref))
const toAdd = artworkIds
  .filter(id => !alreadyLinked.has(id))
  .map(id => ({ _type: 'reference', _ref: id, _key: id }))

if (toAdd.length === 0) {
  console.log('✅  All artworks are already linked to the series — nothing to do.')
  process.exit(0)
}

console.log(`🔗  Linking ${toAdd.length} new artworks...`)
await client
  .patch(series._id)
  .setIfMissing({ artworks: [] })
  .append('artworks', toAdd)
  .commit()

console.log(`✅  Done! ${toAdd.length} artworks linked to "The Zine Project".`)

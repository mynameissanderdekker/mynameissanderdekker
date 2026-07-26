/**
 * add-missing-artworks.mjs
 *
 * Voegt ontbrekende artworks toe aan Sanity en update jaren.
 *
 * Gebruik: node scripts/add-missing-artworks.mjs
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
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

function makeSlug(str) {
  return str.toLowerCase()
    .replace(/nº/g, 'no')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Nieuwe artworks aanmaken
const NEW_ARTWORKS = [
  {
    title: 'Zine Nº 1: Annemarijn',
    medium: 'Zine',
    year: 2021,
  },
  {
    title: 'My name is Sander Dekker Nº 1',
    medium: 'Book',
    year: 2021,
  },
  {
    title: "Limited edition: Lady of the Manor",
    medium: 'Limited Edition Print',
    year: 2019,
  },
  {
    title: "Limited edition: Horsing Around",
    medium: 'Limited Edition Print',
    year: 2019,
  },
]

// Bestaande artworks updaten (jaar)
const YEAR_UPDATES = [
  { match: '1.5',  year: 2019 },
  { match: 'Nº 2', year: 2020 },
]

async function main() {
  // ── Nieuwe artworks ───────────────────────────────────────────────────────
  for (const aw of NEW_ARTWORKS) {
    const s = makeSlug(aw.title)
    const existing = await sanity.fetch(
      `*[_type == "artwork" && slug.current == $s][0]._id`,
      { s }
    )
    if (existing) {
      console.log(`⏭  "${aw.title}" bestaat al`)
      continue
    }
    const doc = await sanity.create({
      _type: 'artwork',
      title: aw.title,
      slug: { _type: 'slug', current: s },
      medium: aw.medium,
      year: aw.year,
    })
    console.log(`✓  "${aw.title}" aangemaakt (${doc._id})`)
    await new Promise(r => setTimeout(r, 200))
  }

  // ── Jaar updates ──────────────────────────────────────────────────────────
  for (const { match, year } of YEAR_UPDATES) {
    const found = await sanity.fetch(
      `*[_type == "artwork" && title match $m][0]{ _id, title }`,
      { m: `*${match}*` }
    )
    if (!found) { console.log(`⚠️  Geen artwork gevonden voor match "${match}"`); continue }
    await sanity.patch(found._id).setIfMissing({ year }).commit()
    console.log(`✓  "${found.title}" — jaar ${year} ingesteld`)
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\n✅  Klaar')
}

main().catch(console.error)

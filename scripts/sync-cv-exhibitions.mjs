/**
 * Syncs CV exhibitions & art fairs to Sanity.
 * - Matches existing docs by title/name + year
 * - Patches matches with showInCV + exhibitionType
 * - Creates new docs for unmatched items
 *
 * Run: node scripts/sync-cv-exhibitions.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// ── Type mapping ───────────────────────────────────────────────────────────────
function mapType(raw) {
  const t = raw?.toLowerCase() ?? ''
  if (t.includes('permanent')) return 'permanent'
  if (t.includes('duo'))       return 'duo'
  if (t.includes('group'))     return 'group'
  if (t.includes('special'))   return 'special'
  return 'solo'
}

function dateStr(year) {
  return `${year}-01-01`
}

// ── Art fairs ──────────────────────────────────────────────────────────────────
const ART_FAIRS = [
  { project: 'Innate Curiosity',          year: 2026, fair: 'NAP+',                           location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2024, fair: 'NAP+',                           location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2022, fair: 'Unseen',                         location: 'Amsterdam, NL' },
  { project: 'The Social Landscape',      year: 2017, fair: '6voor6 Art Fair',                location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2017, fair: '6voor6 Art Fair',                location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2016, fair: 'This Art Fair',                  location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2015, fair: 'This Art Fair',                  location: 'Amsterdam, NL' },
  { project: 'The Social Media Project',  year: 2015, fair: 'KunstRAI',                       location: 'Amsterdam, NL' },
  { project: 'The Social Landscape',      year: 2014, fair: 'The Great Last Minute Art Fair', location: 'Rotterdam, NL' },
  { project: 'The Social Media Project',  year: 2014, fair: 'PAN',                            location: 'Amsterdam, NL' },
]

// ── Gallery exhibitions ────────────────────────────────────────────────────────
const EXHIBITIONS = [
  { project: 'The Zine Project',          year: 2026, gallery: 'Studio presentation',        location: 'by appointment, Amsterdam, NL', type: 'solo' },
  { project: 'The Social Landscape',      year: 2026, gallery: 'Leica Store',                location: 'Lisse, NL',                     type: 'permanent' },
  { project: 'The Zine Project',          year: 2025, gallery: 'Torch Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Landscape',      year: 2025, gallery: 'Torch Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2024, gallery: '40Y Torch Gallery',          location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Zine Project',          year: 2023, gallery: 'Josilda da Conceição',       location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2022, gallery: 'Torch Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2022, gallery: 'Luxfer & Lípa',              location: 'Česká Skalice, CZ',             type: 'group' },
  { project: 'The Social Media Project',  year: 2022, gallery: 'Caesuur & Lípa',             location: 'Middelburg, NL',                type: 'group' },
  { project: 'The Social Media Project',  year: 2020, gallery: 'Strayfield Gallery',         location: 'Copenhagen, DK',                type: 'solo' },
  { project: 'The Social Landscape',      year: 2020, gallery: 'Strayfield Gallery',         location: 'Hellerup, DK',                  type: 'permanent' },
  { project: 'The Social Media Project',  year: 2020, gallery: 'Strayfield Gallery',         location: 'Hellerup, DK',                  type: 'group' },
  { project: 'The Social Landscape',      year: 2019, gallery: 'Former ABN AMRO',            location: 'Amsterdam, NL',                 type: 'duo' },
  { project: 'The Social Media Project',  year: 2018, gallery: 'Torch Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2018, gallery: 'Amsterdam Central Station', location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'TORCH Gallery',              location: 'Amsterdam, NL',                 type: 'permanent' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'Hotel Not Hotel',            location: 'Amsterdam, NL',                 type: 'permanent' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'Arti et Amicitiae',          location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'Torch Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'ODAM at Georgies',           location: 'Amsterdam, NL',                 type: 'special' },
  { project: 'The Social Landscape',      year: 2018, gallery: 'Amsterdam Central Station', location: 'Amsterdam, NL',                 type: 'special' },
  { project: 'The Social Media Project',  year: 2018, gallery: 'Arti et Amicitiae',          location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Social Media Project',  year: 2018, gallery: 'ODAM',                       location: 'Amsterdam, NL',                 type: 'special' },
  { project: 'The Social Landscape',      year: 2017, gallery: 'Josilda da Conceição',       location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2017, gallery: 'Josilda da Conceição',       location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Social Media Project',  year: 2016, gallery: '30Works Gallery',            location: 'Cologne, DE',                   type: 'solo' },
  { project: 'The Social Landscape',      year: 2016, gallery: 'Bright Side Gallery',        location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2016, gallery: 'Bright Side Gallery',        location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Social Media Project',  year: 2016, gallery: 'OFFF by Night',              location: 'Antwerp, BE',                   type: 'special' },
  { project: 'The Social Media Project',  year: 2015, gallery: 'Walls Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Landscape',      year: 2015, gallery: 'Walls Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2015, gallery: 'Schau Fenster Gallery',      location: 'Berlin, DE',                    type: 'group' },
  { project: 'The Social Media Project',  year: 2015, gallery: 'FB69 Gallery',               location: 'Münster, DE',                   type: 'group' },
  { project: 'The Social Media Project',  year: 2014, gallery: 'Majke Hüsstege',             location: 'Den Bosch, NL',                 type: 'solo' },
  { project: 'The Social Landscape',      year: 2014, gallery: 'Majke Hüsstege',             location: 'Den Bosch, NL',                 type: 'solo' },
  { project: 'The Social Media Project',  year: 2014, gallery: 'Walls Gallery',              location: 'Amsterdam, NL',                 type: 'group' },
  { project: 'The Social Media Project',  year: 2013, gallery: 'Flaxon Ptootch',             location: 'London, UK',                    type: 'group' },
  { project: 'The Social Media Project',  year: 2013, gallery: 'Nuit Blanche',               location: 'Amsterdam, NL',                 type: 'special' },
  { project: 'The Social Media Project',  year: 2013, gallery: 'FOAM',                       location: 'Amsterdam, NL',                 type: 'special' },
  { project: 'The Social Media Project',  year: 2012, gallery: 'Walls Gallery',              location: 'Amsterdam, NL',                 type: 'solo' },
]

// ── Matching helpers ───────────────────────────────────────────────────────────
function getYear(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).getFullYear()
}

function normalize(s) {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function matchExhibition(existing, item) {
  const year = getYear(existing.startDate)
  if (year !== item.year) return false
  const titleMatch = normalize(existing.title ?? '').includes(normalize(item.project)) ||
                     normalize(item.project).includes(normalize(existing.title ?? ''))
  const galleryMatch = normalize(existing.gallery ?? '').includes(normalize(item.gallery)) ||
                       normalize(item.gallery).includes(normalize(existing.gallery ?? ''))
  return titleMatch && galleryMatch
}

function matchArtFair(existing, item) {
  const year = getYear(existing.startDate)
  if (year !== item.year) return false
  const nameMatch = normalize(existing.name ?? '').includes(normalize(item.project)) ||
                    normalize(item.project).includes(normalize(existing.name ?? ''))
  const fairMatch = normalize(existing.fair ?? '').includes(normalize(item.fair)) ||
                    normalize(item.fair).includes(normalize(existing.fair ?? ''))
  return nameMatch && fairMatch
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching existing exhibitions and art fairs...')

  const [existingExhibitions, existingArtFairs] = await Promise.all([
    client.fetch(`*[_type == "exhibition"]{ _id, title, gallery, location, startDate }`),
    client.fetch(`*[_type == "artFair"]{ _id, name, fair, location, startDate }`),
  ])

  console.log(`Found ${existingExhibitions.length} exhibitions, ${existingArtFairs.length} art fairs\n`)

  let updated = 0, created = 0

  // ── Art fairs ────────────────────────────────────────────────────────────────
  console.log('=== ART FAIRS ===')
  for (const item of ART_FAIRS) {
    const match = existingArtFairs.find(e => matchArtFair(e, item))
    if (match) {
      await client.patch(match._id).set({ showInCV: true }).commit()
      console.log(`  ✓ UPDATED  ${item.year} ${item.fair} — ${item.project}`)
      updated++
    } else {
      await client.create({
        _type: 'artFair',
        name: item.project,
        fair: item.fair,
        location: item.location,
        startDate: dateStr(item.year),
        showInCV: true,
      })
      console.log(`  + CREATED  ${item.year} ${item.fair} — ${item.project}`)
      created++
    }
  }

  // ── Exhibitions ──────────────────────────────────────────────────────────────
  console.log('\n=== EXHIBITIONS ===')
  for (const item of EXHIBITIONS) {
    const match = existingExhibitions.find(e => matchExhibition(e, item))
    if (match) {
      await client.patch(match._id).set({ showInCV: true, exhibitionType: item.type }).commit()
      console.log(`  ✓ UPDATED  ${item.year} ${item.gallery} — ${item.project}`)
      updated++
    } else {
      await client.create({
        _type: 'exhibition',
        title: item.project,
        gallery: item.gallery,
        location: item.location,
        startDate: dateStr(item.year),
        exhibitionType: item.type,
        showInCV: true,
      })
      console.log(`  + CREATED  ${item.year} ${item.gallery} — ${item.project}`)
      created++
    }
  }

  console.log(`\nDone: ${updated} updated, ${created} created`)
}

main().catch(console.error)

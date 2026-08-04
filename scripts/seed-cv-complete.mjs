/**
 * Creates/updates ALL CV exhibitions & art fairs from the definitive screenshot list.
 * Matches on: _type + gallery + year + exhibitionType (+ project for disambiguation).
 * Run: node scripts/seed-cv-complete.mjs
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

// ── Definitive CV data (from screenshot) ──────────────────────────────────────
// type: 'exhibition' | 'artFair'
// exhibitionType: 'solo' | 'duo' | 'group' | 'permanent' | 'special' | (artFairs use _type)

const CV_ITEMS = [

  // ── Innate Curiosity ─────────────────────────────────────────────────────────
  { project: 'Innate Curiosity', _type: 'artFair', fair: 'NAP+', location: 'Amsterdam, NL', year: 2026 },

  // ── The Zine Project ─────────────────────────────────────────────────────────
  { project: 'The Zine Project', _type: 'exhibition', gallery: 'Studio presentation', location: 'by appointment, Amsterdam, NL', year: 2026, exhibitionType: 'solo' },
  { project: 'The Zine Project', _type: 'exhibition', gallery: 'Torch Gallery',        location: 'Amsterdam, NL',                year: 2025, exhibitionType: 'solo' },
  { project: 'The Zine Project', _type: 'exhibition', gallery: 'Josilda da Conceição Gallery', location: 'Amsterdam, NL',       year: 2023, exhibitionType: 'solo' },
  { project: 'The Zine Project', _type: 'artFair',    fair: 'NAP+',                    location: 'Amsterdam, NL',               year: 2024 },

  // ── The Social Landscape (TenFifteen) ────────────────────────────────────────
  // Permanent installations
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Leica Store',       location: 'Lisse, NL',      year: 2026, exhibitionType: 'permanent' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Strayfield Gallery', location: 'Hellerup, DK',  year: 2020, exhibitionType: 'permanent' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'TORCH Gallery',      location: 'Amsterdam, NL', year: 2018, exhibitionType: 'permanent' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Hotel Not Hotel',    location: 'Amsterdam, NL', year: 2018, exhibitionType: 'permanent' },
  // Gallery presentations
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Torch Gallery',                   location: 'Amsterdam, NL', year: 2026, exhibitionType: 'group' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Torch Gallery',                   location: 'Amsterdam, NL', year: 2025, exhibitionType: 'group' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Former ABN AMRO',                 location: 'Amsterdam, NL', year: 2019, exhibitionType: 'duo'   },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Arti et Amicitiae',               location: 'Amsterdam, NL', year: 2018, exhibitionType: 'group' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Torch Gallery',                   location: 'Amsterdam, NL', year: 2018, exhibitionType: 'group' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'ODAM at Georgies',                location: 'Amsterdam, NL', year: 2018, exhibitionType: 'special' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Amsterdam Central Station',       location: 'Amsterdam, NL', year: 2018, exhibitionType: 'special' },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Josilda da Conceição Gallery',    location: 'Amsterdam, NL', year: 2017, exhibitionType: 'solo'   },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Bright Side Gallery',             location: 'Amsterdam, NL', year: 2016, exhibitionType: 'solo'   },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Walls Gallery',                   location: 'Amsterdam, NL', year: 2015, exhibitionType: 'solo'   },
  { project: 'The Social Landscape', _type: 'exhibition', gallery: 'Majke Hüsstege',                  location: 'Den Bosch, NL', year: 2014, exhibitionType: 'solo'   },
  // Art fairs
  { project: 'The Social Landscape', _type: 'artFair', fair: '6voor6 Art Fair',             location: 'Amsterdam, NL',  year: 2017 },
  { project: 'The Social Landscape', _type: 'artFair', fair: 'The Great Last Minute Art Fair', location: 'Rotterdam, NL', year: 2014 },

  // ── The Social Media Project ──────────────────────────────────────────────────
  // Solo presentations
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Torch Gallery',            location: 'Amsterdam, NL',     year: 2022, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Strayfield Gallery',        location: 'Copenhagen, DK',    year: 2020, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Torch Gallery',             location: 'Amsterdam, NL',     year: 2018, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Amsterdam Central Station', location: 'Amsterdam, NL',     year: 2018, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: '30Works Gallery',           location: 'Cologne, DE',       year: 2016, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Walls Gallery',             location: 'Amsterdam, NL',     year: 2015, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Majke Hüsstege',            location: 'Den Bosch, NL',     year: 2014, exhibitionType: 'solo' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Walls Gallery',             location: 'Amsterdam, NL',     year: 2012, exhibitionType: 'solo' },
  // Art fairs
  { project: 'The Social Media Project', _type: 'artFair', fair: 'Unseen',        location: 'Amsterdam, NL', year: 2022 },
  { project: 'The Social Media Project', _type: 'artFair', fair: '6voor6 Art Fair', location: 'Amsterdam, NL', year: 2017 },
  { project: 'The Social Media Project', _type: 'artFair', fair: 'This Art Fair',  location: 'Amsterdam, NL', year: 2016 },
  { project: 'The Social Media Project', _type: 'artFair', fair: 'This Art Fair',  location: 'Amsterdam, NL', year: 2015 },
  { project: 'The Social Media Project', _type: 'artFair', fair: 'KunstRAI',       location: 'Amsterdam, NL', year: 2015 },
  { project: 'The Social Media Project', _type: 'artFair', fair: 'PAN',            location: 'Amsterdam, NL', year: 2014 },
  // Group exhibitions
  { project: 'The Social Media Project', _type: 'exhibition', gallery: '40Y Torch Gallery',          location: 'Amsterdam, NL',      year: 2024, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Luxfer & Lípa',              location: 'Česká Skalice, CZ',  year: 2022, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Caesuur & Lípa',             location: 'Middelburg, NL',     year: 2022, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Strayfield Gallery',         location: 'Hellerup, DK',       year: 2020, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Arti et Amicitiae',          location: 'Amsterdam, NL',      year: 2018, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Josilda da Conceição Gallery', location: 'Amsterdam, NL',    year: 2017, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Bright Side Gallery',        location: 'Amsterdam, NL',      year: 2016, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Schau Fenster Gallery',      location: 'Berlin, DE',         year: 2015, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'FB69 Gallery',               location: 'Münster, DE',        year: 2015, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Walls Gallery',              location: 'Amsterdam, NL',      year: 2014, exhibitionType: 'group' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Flaxon Ptootch',             location: 'London, UK',         year: 2013, exhibitionType: 'group' },
  // Special projects
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'ODAM',         location: 'Amsterdam, NL', year: 2018, exhibitionType: 'special' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'OFFF by Night', location: 'Antwerp, BE',  year: 2016, exhibitionType: 'special' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'Nuit Blanche',  location: 'Amsterdam, NL', year: 2013, exhibitionType: 'special' },
  { project: 'The Social Media Project', _type: 'exhibition', gallery: 'FOAM',          location: 'Amsterdam, NL', year: 2013, exhibitionType: 'special' },
]

function norm(s) { return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') }
function dateStr(y) { return `${y}-07-01` }
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

async function main() {
  // Fetch projects
  const projects = await client.fetch(`*[_type == "project"]{ _id, title, cvTitle }`)
  const projectMap = Object.fromEntries(projects.map(p => [p.title, p._id]))
  console.log('Projects:', Object.keys(projectMap).join(', '), '\n')

  // ── Step 1: Clear all existing CV flags ────────────────────────────────────
  console.log('=== CLEARING EXISTING CV FLAGS ===')
  const [allEx, allAF] = await Promise.all([
    client.fetch(`*[_type == "exhibition" && showInCV == true]{ _id }`),
    client.fetch(`*[_type == "artFair"    && showInCV == true]{ _id }`),
  ])
  for (const doc of [...allEx, ...allAF]) {
    await client.patch(doc._id).unset(['cvProject']).set({ showInCV: false }).commit()
  }
  console.log(`  Cleared ${allEx.length} exhibitions + ${allAF.length} art fairs\n`)

  // ── Step 2: Fetch all docs for matching ────────────────────────────────────
  const [existingEx, existingAF] = await Promise.all([
    client.fetch(`*[_type == "exhibition"]{ _id, gallery, location, startDate, exhibitionType }`),
    client.fetch(`*[_type == "artFair"]{ _id, fair, location, startDate }`),
  ])

  // Build lookup maps: key → stack of _ids. Each match is consumed once,
  // so a second item with the same key creates a fresh document instead of overwriting.
  const exMap = new Map()
  for (const e of existingEx) {
    const y = e.startDate ? new Date(e.startDate).getFullYear() : 0
    const key = `${norm(e.gallery)}|${y}|${e.exhibitionType ?? ''}`
    if (!exMap.has(key)) exMap.set(key, [])
    exMap.get(key).push(e._id)
  }
  const afMap = new Map()
  for (const a of existingAF) {
    const y = a.startDate ? new Date(a.startDate).getFullYear() : 0
    const key = `${norm(a.fair)}|${y}`
    if (!afMap.has(key)) afMap.set(key, [])
    afMap.get(key).push(a._id)
  }
  const consume = (map, key) => { const s = map.get(key); return s?.length ? s.shift() : null }

  let updated = 0, created = 0, errors = 0

  for (const item of CV_ITEMS) {
    const projectId = projectMap[item.project]
    if (!projectId) {
      console.log(`  ! No project found: "${item.project}"`)
      errors++
      continue
    }
    const cvProject = { _type: 'reference', _ref: projectId }

    if (item._type === 'artFair') {
      const key = `${norm(item.fair)}|${item.year}`
      const existingId = consume(afMap, key)

      if (existingId) {
        await client.patch(existingId).set({ showInCV: true, cvProject, fair: item.fair, location: item.location }).commit()
        console.log(`  ✓ UPDATED artFair  ${item.year} ${item.fair} [${item.project}]`)
        updated++
      } else {
        const name = `${item.fair}, ${item.year} (${item.project})`
        await client.create({
          _type: 'artFair',
          name,
          fair: item.fair,
          location: item.location,
          startDate: dateStr(item.year),
          showInCV: true,
          cvProject,
          slug: { _type: 'slug', current: slugify(name) },
        })
        console.log(`  + CREATED artFair  ${item.year} ${item.fair} [${item.project}]`)
        created++
      }
    } else {
      const key = `${norm(item.gallery)}|${item.year}|${item.exhibitionType ?? ''}`
      const existingId = consume(exMap, key)

      if (existingId) {
        await client.patch(existingId).set({ showInCV: true, cvProject, exhibitionType: item.exhibitionType, gallery: item.gallery, location: item.location }).commit()
        console.log(`  ✓ UPDATED exhibition  ${item.year} ${item.gallery} [${item.project}]`)
        updated++
      } else {
        const title = `${item.gallery}, ${item.year} (${item.project})`
        await client.create({
          _type: 'exhibition',
          title,
          gallery: item.gallery,
          location: item.location,
          startDate: dateStr(item.year),
          exhibitionType: item.exhibitionType,
          showInCV: true,
          cvProject,
          slug: { _type: 'slug', current: slugify(title) },
        })
        console.log(`  + CREATED exhibition  ${item.year} ${item.gallery} [${item.project}]`)
        created++
      }
    }
  }

  console.log(`\nDone: ${updated} updated, ${created} created, ${errors} errors`)
}

main().catch(console.error)

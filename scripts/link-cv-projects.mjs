/**
 * Links cvProject reference on all exhibitions/art fairs that have showInCV == true.
 * Uses the same project-per-item mapping as sync-cv-exhibitions.mjs.
 *
 * Run: node scripts/link-cv-projects.mjs
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

// Project title → exhibition/art fair mapping (same as sync script)
const EXHIBITION_PROJECTS = {
  'Studio presentation':         'The Zine Project',
  'Leica Store':                 'The Social Landscape',
  'Torch Gallery':               'The Zine Project',   // 2025 solo = Zine
  '40Y Torch Gallery':           'The Social Media Project',
  'Josilda da Conceição':        'The Zine Project',
  'Luxfer & Lípa':               'The Social Media Project',
  'Caesuur & Lípa':              'The Social Media Project',
  'Strayfield Gallery':          'The Social Media Project',
  'Former ABN AMRO':             'The Social Landscape',
  'Amsterdam Central Station':   'The Social Media Project',
  'TORCH Gallery':               'The Social Landscape',
  'Hotel Not Hotel':             'The Social Landscape',
  'Arti et Amicitiae':           'The Social Landscape',
  'ODAM at Georgies':            'The Social Landscape',
  'ODAM':                        'The Social Media Project',
  '30Works Gallery':             'The Social Media Project',
  'Bright Side Gallery':         'The Social Media Project',
  'OFFF by Night':               'The Social Media Project',
  'Walls Gallery':               'The Social Media Project',
  'Schau Fenster Gallery':       'The Social Media Project',
  'FB69 Gallery':                'The Social Media Project',
  'Majke Hüsstege':              'The Social Media Project',
  'Flaxon Ptootch':              'The Social Media Project',
  'Nuit Blanche':                'The Social Media Project',
  'FOAM':                        'The Social Media Project',
}

// For exhibitions with multiple project options by year, use year+gallery combo
const EXHIBITION_PROJECTS_BY_YEAR = [
  // Torch Gallery: year decides which project
  { gallery: 'Torch Gallery', year: 2025, project: 'The Social Landscape' }, // social landscape solo 2025
  { gallery: 'Torch Gallery', year: 2023, project: 'The Zine Project' },
  { gallery: 'Torch Gallery', year: 2022, project: 'The Social Media Project' },
  { gallery: 'Torch Gallery', year: 2018, project: 'The Social Media Project' },
  // Josilda
  { gallery: 'Josilda da Conceição', year: 2023, project: 'The Zine Project' },
  { gallery: 'Josilda da Conceição', year: 2017, project: 'The Social Landscape' },
  // Arti et Amicitiae
  { gallery: 'Arti et Amicitiae', year: 2018, project: 'The Social Media Project' }, // both projects, SMP wins
  // Majke Hüsstege
  { gallery: 'Majke Hüsstege', year: 2014, project: 'The Social Media Project' },
  // Walls Gallery
  { gallery: 'Walls Gallery', year: 2015, project: 'The Social Media Project' },
  { gallery: 'Walls Gallery', year: 2014, project: 'The Social Media Project' },
  { gallery: 'Walls Gallery', year: 2012, project: 'The Social Media Project' },
  // Strayfield
  { gallery: 'Strayfield Gallery', year: 2020, project: 'The Social Media Project' },
]

const ART_FAIR_PROJECTS = {
  'NAP+':                        'The Social Media Project',
  'Unseen':                      'The Social Media Project',
  '6voor6 Art Fair':             'The Social Media Project',
  'This Art Fair':               'The Social Media Project',
  'KunstRAI':                    'The Social Media Project',
  'The Great Last Minute Art Fair': 'The Social Landscape',
  'PAN':                         'The Social Media Project',
}

// Override: NAP+ 2026 = Innate Curiosity
const ART_FAIR_PROJECTS_BY_YEAR = [
  { fair: 'NAP+', year: 2026, project: 'Innate Curiosity' },
  { fair: 'NAP+', year: 2024, project: 'The Zine Project' },
  { fair: '6voor6 Art Fair', year: 2017, project: 'The Social Landscape' },
]

// Exhibitions that need explicit year+gallery+type overrides
// (used when the same gallery appears under multiple projects)
const EXHIBITION_PROJECTS_BY_YEAR_TYPE = [
  { gallery: 'Strayfield Gallery', year: 2020, type: 'permanent', project: 'The Social Landscape' },
  { gallery: 'TORCH Gallery',      year: 2018, type: 'permanent', project: 'The Social Landscape' },
  { gallery: 'Torch Gallery',      year: 2018, type: 'permanent', project: 'The Social Landscape' },
  { gallery: 'Hotel Not Hotel',    year: 2018, type: 'permanent', project: 'The Social Landscape' },
]

function getYear(d) { return d ? new Date(d).getFullYear() : null }
function normalize(s) { return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') }

async function main() {
  console.log('Fetching Sanity projects...')
  const projects = await client.fetch(`*[_type == "project"]{ _id, title }`)
  const projectMap = Object.fromEntries(projects.map(p => [p.title, p._id]))
  console.log('Projects found:', Object.keys(projectMap).join(', '), '\n')

  const [exhibitions, artFairs] = await Promise.all([
    client.fetch(`*[_type == "exhibition" && showInCV == true]{ _id, title, gallery, startDate, exhibitionType }`),
    client.fetch(`*[_type == "artFair" && showInCV == true]{ _id, name, fair, startDate }`),
  ])

  console.log(`Found ${exhibitions.length} exhibitions, ${artFairs.length} art fairs with showInCV\n`)

  let patched = 0, skipped = 0

  // ── Exhibitions ──────────────────────────────────────────────────────────────
  console.log('=== EXHIBITIONS ===')
  for (const ex of exhibitions) {
    const year = getYear(ex.startDate)
    const gallery = ex.gallery ?? ''
    const exType = ex.exhibitionType ?? ''

    // 1. Check year+gallery+type override first (most specific)
    const typeOverride = EXHIBITION_PROJECTS_BY_YEAR_TYPE.find(r =>
      r.year === year &&
      normalize(r.type) === normalize(exType) &&
      (normalize(r.gallery) === normalize(gallery) ||
       normalize(gallery).includes(normalize(r.gallery)) ||
       normalize(r.gallery).includes(normalize(gallery)))
    )

    // 2. Check year+gallery override
    const override = !typeOverride && EXHIBITION_PROJECTS_BY_YEAR.find(r =>
      r.year === year && (
        normalize(r.gallery) === normalize(gallery) ||
        normalize(gallery).includes(normalize(r.gallery)) ||
        normalize(r.gallery).includes(normalize(gallery))
      )
    )

    // 3. Default lookup: fuzzy match against map keys
    const defaultEntry = Object.entries(EXHIBITION_PROJECTS).find(([key]) =>
      normalize(gallery).includes(normalize(key)) ||
      normalize(key).includes(normalize(gallery))
    )
    const projectTitle = typeOverride?.project ?? override?.project ?? defaultEntry?.[1]

    if (!projectTitle) {
      console.log(`  ? SKIP (no mapping)  ${year} ${gallery} — "${ex.title}"`)
      skipped++
      continue
    }
    const projectId = projectMap[projectTitle]
    if (!projectId) {
      console.log(`  ! ERROR project not found in Sanity: "${projectTitle}"`)
      skipped++
      continue
    }
    await client.patch(ex._id).set({ cvProject: { _type: 'reference', _ref: projectId } }).commit()
    console.log(`  ✓ ${year} ${gallery} → ${projectTitle}`)
    patched++
  }

  // ── Art Fairs ────────────────────────────────────────────────────────────────
  console.log('\n=== ART FAIRS ===')
  for (const af of artFairs) {
    const year = getYear(af.startDate)
    const fair = af.fair ?? ''

    const override = ART_FAIR_PROJECTS_BY_YEAR.find(r =>
      r.year === year && (
        normalize(r.fair) === normalize(fair) ||
        normalize(fair).includes(normalize(r.fair)) ||
        normalize(r.fair).includes(normalize(fair))
      )
    )
    const defaultEntry = Object.entries(ART_FAIR_PROJECTS).find(([key]) =>
      normalize(fair).includes(normalize(key)) ||
      normalize(key).includes(normalize(fair))
    )
    const projectTitle = override?.project ?? defaultEntry?.[1]

    if (!projectTitle) {
      console.log(`  ? SKIP (no mapping)  ${year} ${fair} — "${af.name}"`)
      skipped++
      continue
    }
    const projectId = projectMap[projectTitle]
    if (!projectId) {
      console.log(`  ! ERROR project not found in Sanity: "${projectTitle}"`)
      skipped++
      continue
    }
    await client.patch(af._id).set({ cvProject: { _type: 'reference', _ref: projectId } }).commit()
    console.log(`  ✓ ${year} ${fair} → ${projectTitle}`)
    patched++
  }

  console.log(`\nDone: ${patched} patched, ${skipped} skipped`)
}

main().catch(console.error)

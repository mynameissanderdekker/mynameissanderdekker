/**
 * Birds of Paradise — artworks importeren in mynameissanderdekker.com Sanity
 *
 * Run this in the mynameissanderdekker.com project folder:
 *   DRY_RUN=true node birds-of-paradise-for-mynameissanderdekker.mjs
 *   node birds-of-paradise-for-mynameissanderdekker.mjs
 *
 * The script will:
 *  1. Find the exhibition "the-zine-project" (2025 TORCH Gallery show)
 *  2. Compare the 33 works from the Birds of Paradise price list against existing works
 *  3. Update matching works with correct metadata
 *  4. Create missing works and link them to the exhibition
 *  5. Images are NOT uploaded (do separately if needed)
 *
 * Field names verified against src/sanity/schemas/artwork.ts:
 *  - dimensions is an OBJECT { widthCm, heightCm, depthCm }, not a flat string
 *  - edition is stored as editionTotal + editionAP (numbers), parsed from "1/7+2AP"
 *  - price field is priceExclVAT, not price/priceExVat
 *  - there is no priceOnRequest field — "price on request" = status: 'enquire' with no price
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n')

// Read token from .env.local in the current project
const envPath = resolve('.env.local')
const env = readFileSync(envPath, 'utf8')
function readEnvVar(name) {
  const m = env.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

const token = readEnvVar('SANITY_API_WRITE_TOKEN')
  || readEnvVar('SANITY_WRITE_TOKEN')
  || readEnvVar('SANITY_TOKEN')

if (!token) throw new Error('No write token found in .env.local')

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2026-06-18',
  token,
  useCdn: false,
})

// ─── ALL 33 WORKS FROM BIRDS OF PARADISE PRICE LIST ───────────────────────────

const pdfWorks = [
  {
    title: 'VIVE LA VIE!',
    year: '2021', widthCm: 90, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 1750,
  },
  {
    title: "LA VIE EST UNE FLEUR DONT L'AMOUR EST LE MIEL",
    year: '2021', widthCm: 60, heightCm: 90,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 1750,
  },
  {
    title: "VOULOIR, C'EST POUVOIR",
    year: '2021', widthCm: 45, heightCm: 30,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: "LA SEXUALITÉ EST UN ACTE DE LIBERTÉ, NON DE SOUMISSION",
    year: '2021', widthCm: 30, heightCm: 45,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: "C'EST JUSTE MOI",
    year: '2021', widthCm: 45, heightCm: 30,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: "'GIRLS IN PARIS' INSTALLATION",
    year: '2025', widthCm: 150, heightCm: 150, depthCm: 215,
    edition: '1/7+2AP',
    medium: 'Photo panels, transparent banners, metal tubes, compression fittings',
    priceOnRequest: true,
  },
  {
    title: 'PEEK-A-BOO PARADOX',
    year: '2022', widthCm: 99, heightCm: 66,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, colored plexiglass, vinyl graphic and black spacers',
    priceExVat: 2000,
  },
  {
    title: 'PEEPHOLE',
    year: '2022', widthCm: 75, heightCm: 50,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, colored plexiglass, black aluminum frame',
    priceExVat: 1400,
  },
  {
    title: 'OPTICAL PHENOMENON',
    year: '2022', widthCm: 45, heightCm: 30,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, museum glass, wooden frame',
    priceExVat: 750,
  },
  {
    title: 'PEEPER',
    year: '2022', widthCm: 40, heightCm: 40,
    edition: '4/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass/anti reflex, wooden frame, hand-painted panel, metal hinges and knob',
    priceExVat: 1750,
  },
  {
    title: 'MADOX',
    year: '2024', widthCm: 45, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, printed passe-partout, museum glass, wooden frame',
    priceExVat: 800,
  },
  {
    title: 'PAT',
    year: '2024', widthCm: 45, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, printed passe-partout, museum glass, wooden frame',
    priceExVat: 800,
  },
  {
    title: 'STEFA',
    year: '2024', widthCm: 45, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, printed passe-partout, museum glass, wooden frame',
    priceExVat: 800,
  },
  {
    title: 'WIKTOR',
    year: '2024', widthCm: 45, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, printed passe-partout, museum glass, wooden frame',
    priceExVat: 800,
  },
  {
    title: 'ANTHONY & OTTO',
    year: '2016', widthCm: 45, heightCm: 30,
    edition: '2/5+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: 'EVOLUTION OF IMITATION',
    year: '2016', widthCm: 45, heightCm: 30,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: 'EVOLUTION OF IMITATION II',
    year: '2018', widthCm: 45, heightCm: 30,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: 'UNLEASHED MOMENTS',
    year: '2013', widthCm: 40, heightCm: 60,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 950,
  },
  {
    title: 'EMBRACE YOUR FREEDOM',
    year: '2020', widthCm: 135, heightCm: 90,
    edition: '2/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass and aluminum frame',
    priceExVat: 2750,
  },
  {
    title: 'KRISZTINA',
    year: '2021', widthCm: 90, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass and aluminum frame + wax',
    priceExVat: 2000,
  },
  {
    title: 'MISOPHONIC FEAST',
    year: '2022', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 950,
  },
  {
    title: 'ROOTS OF THE SELF',
    year: '2022', widthCm: 45, heightCm: 30,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: 'MAGICAL FOUNTAIN',
    year: '2020', widthCm: 30, heightCm: 45,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, museum glass, wooden frame',
    priceExVat: 1750,
  },
  {
    title: 'THE FOREST FAIRY',
    year: '2020', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
    priceExVat: 950,
  },
  {
    title: 'NATURAL CONTORTION',
    year: '2020', widthCm: 30, heightCm: 45,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: 'VOYAGE INTO THE UNKNOWN',
    year: '2020', widthCm: 30, heightCm: 45,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, glass, and wooden frame',
    priceExVat: 750,
  },
  {
    title: "NATURE'S PLAYGROUND",
    year: '2020', widthCm: 66, heightCm: 44,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, wooden frame',
    priceExVat: 950,
  },
  {
    title: 'DUALIDAD MEXICANA',
    year: '2024', widthCm: 81, heightCm: 90,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, wooden frames, piano hinges and Mexican pin',
    priceExVat: 1750,
  },
  {
    title: 'BRANDON',
    year: '2025', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond',
    priceExVat: 950,
  },
  {
    title: 'ETHAN',
    year: '2025', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond',
    priceExVat: 950,
  },
  {
    title: 'MAUREEN',
    year: '2025', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond',
    priceExVat: 950,
  },
  {
    title: 'SHARON',
    year: '2025', widthCm: 60, heightCm: 40,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond',
    priceExVat: 950,
  },
  {
    title: 'QIYUN',
    year: '2025', widthCm: 90, heightCm: 60,
    edition: '1/7+2AP',
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond',
    priceExVat: 950,
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function slugify(title) {
  return title.toLowerCase()
    .replace(/[''']/g, '').replace(/[àáâ]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ûü]/g, 'u').replace(/[ç]/g, 'c')
    .normalize('NFD').replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function normTitle(s) {
  return s.toLowerCase().replace(/[''']/g, "'").normalize('NFC').trim()
}

// "1/7+2AP" → { editionTotal: 7, editionAP: 2 }  (the leading "1/" copy number has no
// home on the artwork document — editionTotal/editionAP describe the whole edition run)
function parseEdition(editionStr) {
  const m = editionStr.match(/^\d+\/(\d+)(?:\+(\d+)AP)?$/i)
  if (!m) {
    console.warn(`  ⚠ Could not parse edition string "${editionStr}" — leaving editionTotal/AP unset`)
    return {}
  }
  return {
    editionTotal: parseInt(m[1], 10),
    editionAP: m[2] ? parseInt(m[2], 10) : 0,
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

// Step 1: discover schema — find what _type is used for works
console.log('Discovering schema...')
const types = await client.fetch(`array::unique(*[!(_id in path("drafts.**"))]._type)[0..20]`)
console.log('Document types found:', types)

// Step 2: find the exhibition — try common type names
const exhibition = await client.fetch(
  `*[(_type == "exhibition" || _type == "project" || _type == "show") && (
    slug.current == "the-zine-project" || slug.current == "birds-of-paradise"
  )][0] { _id, _type, title, "slug": slug.current }`
)
console.log('\nExhibition:', exhibition)

if (!exhibition) {
  console.error('Exhibition not found! Check the slug or _type manually.')
  process.exit(1)
}

// Step 3: find existing works — try multiple possible types
const workType = await client.fetch(
  `*[(_type == "work" || _type == "artwork") && defined(title)][0]._type`
)
console.log('Work type:', workType)

const existingWorks = await client.fetch(
  `*[_type == $type && !(_id in path("drafts.**"))] { _id, title, images, exhibitions }`,
  { type: workType }
)
console.log(`\nExisting works: ${existingWorks.length}`)

const byTitle = new Map(existingWorks.map(w => [normTitle(w.title), w]))

// Step 4: process each PDF work
let updated = 0, created = 0, alreadyLinked = 0

function hasExhibitionRef(work) {
  const refs = work.exhibitions ?? work.projects ?? []
  return refs.some(r => r._ref === exhibition._id)
}

for (const work of pdfWorks) {
  const key = normTitle(work.title)
  const existing = byTitle.get(key)
  const { editionTotal, editionAP } = parseEdition(work.edition)

  const patchData = {
    medium: work.medium,
    dimensions: {
      widthCm: work.widthCm,
      heightCm: work.heightCm,
      ...(work.depthCm ? { depthCm: work.depthCm } : {}),
    },
    year: Number(work.year),
    ...(editionTotal != null ? { editionTotal, editionAP } : {}),
    ...(work.priceOnRequest
      ? {}
      : { priceIncVat: Math.round(work.priceExVat * 1.09), vatRate: '9' }),
  }

  if (existing) {
    console.log(`${DRY_RUN ? '[DRY RUN] Would update' : '→ Updating'}: ${work.title} (${existing._id})`)
    console.log(`    ${JSON.stringify(patchData)}`)
    if (!DRY_RUN) {
      const patch = client.patch(existing._id).set(patchData)
      if (!hasExhibitionRef(existing)) {
        patch.setIfMissing({ exhibitions: [] })
          .append('exhibitions', [{ _key: Math.random().toString(36).slice(2,10), _ref: exhibition._id, _type: 'reference' }])
      } else {
        alreadyLinked++
      }
      await patch.commit()
    } else if (hasExhibitionRef(existing)) {
      alreadyLinked++
    }
    updated++
  } else {
    const doc = {
      _type: workType,
      title: work.title,
      slug: { _type: 'slug', current: slugify(work.title) },
      exhibitions: [{ _key: Math.random().toString(36).slice(2,10), _ref: exhibition._id, _type: 'reference' }],
      status: work.priceOnRequest ? 'enquire' : 'available',
      ...patchData,
    }
    console.log(`${DRY_RUN ? '[DRY RUN] Would create' : '→ Creating'}: ${work.title}`)
    console.log(`    ${JSON.stringify(doc)}`)
    if (!DRY_RUN) {
      const result = await client.create(doc)
      console.log(`  ✓ Created: ${result._id}`)
    }
    created++
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Done! ${DRY_RUN ? 'Would update' : 'Updated'}: ${updated}, ${DRY_RUN ? 'would create' : 'created'}: ${created}, already linked: ${alreadyLinked}`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply.')

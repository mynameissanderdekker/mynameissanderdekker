/**
 * seed-social-media-project-artworks.mjs
 *
 * Seeds 11 artworks from the Torch Gallery Jan 2022 price list
 * and links them to 'The Social Media Project' projectSeries.
 *
 * Run: node scripts/seed-social-media-project-artworks.mjs
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

const FRAME  = 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glas & wooden frame'
const DIBOND = 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass and aluminum frame'

const artworks = [
  {
    title: 'NIMBY',
    year: 2021,
    medium: FRAME,
    dimensions: { widthCm: 60, heightCm: 40 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 995,
    options: [
      { label: '90 × 60 CM',  priceExclVAT: 1650 },
      { label: '135 × 90 CM', priceExclVAT: 2700 },
      { label: '165 × 110 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Horticulture II',
    year: 2020,
    medium: FRAME,
    dimensions: { widthCm: 40, heightCm: 60 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 995,
    options: [
      { label: '60 × 90 CM',  priceExclVAT: 1650 },
      { label: '90 × 135 CM', priceExclVAT: 2700 },
      { label: '110 × 165 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Bridge to the Supernatural',
    year: 2020,
    medium: FRAME,
    dimensions: { widthCm: 40, heightCm: 60 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 995,
    options: [
      { label: '60 × 90 CM',  priceExclVAT: 1650 },
      { label: '90 × 135 CM', priceExclVAT: 2700 },
      { label: '110 × 165 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'World Peace',
    year: 2020,
    medium: FRAME,
    dimensions: { widthCm: 45, heightCm: 30 },
    editionTotal: 5, editionAP: 2,
    priceExclVAT: 675,
    options: [
      { label: '60 × 40 CM',  priceExclVAT: 995  },
      { label: '90 × 60 CM',  priceExclVAT: 1650 },
      { label: '135 × 90 CM', priceExclVAT: 2700 },
      { label: '165 × 110 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Speedy Harmony',
    year: 2019,
    medium: DIBOND,
    dimensions: { widthCm: 165, heightCm: 110 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 3600,
    options: [
      { label: '60 × 40 CM',  priceExclVAT: 995  },
      { label: '90 × 60 CM',  priceExclVAT: 1650 },
      { label: '135 × 90 CM', priceExclVAT: 2700 },
    ],
  },
  {
    title: 'Anastasia',
    year: 2019,
    medium: FRAME,
    dimensions: { widthCm: 60, heightCm: 90 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 1650,
    options: [
      { label: '90 × 135 CM', priceExclVAT: 2700 },
      { label: '110 × 165 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Got No Time for That Shit!',
    year: 2018,
    medium: FRAME,
    dimensions: { widthCm: 60, heightCm: 90 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 1650,
    options: [
      { label: '90 × 135 CM', priceExclVAT: 2700 },
      { label: '110 × 165 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Dirtysocksgirl',
    year: 2017,
    medium: FRAME,
    dimensions: { widthCm: 45, heightCm: 30 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 675,
    options: [
      { label: '60 × 40 CM',  priceExclVAT: 995  },
      { label: '90 × 60 CM',  priceExclVAT: 1650 },
      { label: '135 × 90 CM', priceExclVAT: 2700 },
      { label: '165 × 110 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: "I'm Just Creating",
    year: 2017,
    medium: FRAME,
    dimensions: { widthCm: 60, heightCm: 40 },
    editionTotal: 5, editionAP: 2,
    priceExclVAT: 995,
    options: [
      { label: '90 × 60 CM',  priceExclVAT: 1650 },
      { label: '135 × 90 CM', priceExclVAT: 2700 },
      { label: '165 × 110 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'The Odd One Out',
    year: 2017,
    medium: FRAME,
    dimensions: { widthCm: 30, heightCm: 45 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 675,
    options: [
      { label: '40 × 60 CM',  priceExclVAT: 995  },
      { label: '60 × 90 CM',  priceExclVAT: 1650 },
      { label: '90 × 135 CM', priceExclVAT: 2700 },
      { label: '110 × 165 CM',priceExclVAT: 3600 },
    ],
  },
  {
    title: 'Employee of the Month',
    year: 2014,
    medium: FRAME,
    dimensions: { widthCm: 90, heightCm: 60 },
    editionTotal: 5, editionAP: 2,
    priceExclVAT: 1900,
    options: [
      { label: '135 × 90 CM', priceExclVAT: 3000 },
      { label: '165 × 110 CM',priceExclVAT: 3900 },
    ],
  },
]

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

console.log(`\n🎨  Creating ${artworks.length} artworks...\n`)
const createdIds = []

for (const aw of artworks) {
  const slug = slugify(aw.title)
  const existing = await client.fetch(`*[_type == "artwork" && slug.current == $slug][0]._id`, { slug })
  if (existing) {
    console.log(`  ⏭️   Skip  "${aw.title}"`)
    createdIds.push(existing)
    continue
  }

  const doc = {
    _type: 'artwork',
    title: aw.title,
    slug: { _type: 'slug', current: slug },
    year: aw.year,
    medium: aw.medium,
    dimensions: aw.dimensions,
    editionTotal: aw.editionTotal,
    editionAP: aw.editionAP,
    priceExclVAT: aw.priceExclVAT,
    vatRate: 9,
    status: 'enquire',
    showInWebshop: false,
    options: aw.options.map((o, i) => ({
      _type: 'artworkOption',
      _key: `opt-${i}`,
      label: o.label,
      priceExclVAT: o.priceExclVAT,
    })),
  }

  const created = await client.create(doc)
  console.log(`  ✅  "${aw.title}"`)
  createdIds.push(created._id)
}

// Link to 'The Social Media Project' series
const series = await client.fetch(
  `*[_type == "projectSeries" && title == "The Social Media Project"][0]{ _id, title, artworks }`
)

if (!series) {
  console.log('\n⚠️  "The Social Media Project" series not found — create it in Studio first.')
  console.log('IDs:', createdIds.join(', '))
  process.exit(0)
}

console.log(`\n📚  Found series: "${series.title}"`)
const alreadyLinked = new Set((series.artworks ?? []).map(r => r._ref))
const toAdd = createdIds
  .filter(id => !alreadyLinked.has(id))
  .map(id => ({ _type: 'reference', _ref: id, _key: id }))

if (toAdd.length === 0) {
  console.log('  All artworks already linked.\n')
} else {
  await client.patch(series._id).setIfMissing({ artworks: [] }).append('artworks', toAdd).commit()
  console.log(`  ✅  Linked ${toAdd.length} artworks to series.\n`)
}

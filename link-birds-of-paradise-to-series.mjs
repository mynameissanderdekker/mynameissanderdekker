/**
 * link-birds-of-paradise-to-series.mjs
 *
 * The Birds of Paradise import (birds-of-paradise-for-mynameissanderdekker.mjs)
 * linked all 33 works via artwork.exhibitions[] -> exh-zine-2025-torch, but the
 * /projects/the-zine-project page actually renders from the "project" document's
 * artworkSeries[]->artworks[] array (artworkSeries id 2ed1d550-87a0-4b40-9339-83e6afa82068),
 * which only had 12 of the 33 works. This script adds the missing ones.
 *
 * DRY_RUN=true node link-birds-of-paradise-to-series.mjs
 * node link-birds-of-paradise-to-series.mjs
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n')

const env = readFileSync(resolve('.env.local'), 'utf8')
function readEnvVar(name) {
  const m = env.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}
const token = readEnvVar('SANITY_WRITE_TOKEN')

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2026-06-18',
  token,
  useCdn: false,
})

const SERIES_ID = '2ed1d550-87a0-4b40-9339-83e6afa82068'

const TITLES = [
  'VIVE LA VIE!',
  "LA VIE EST UNE FLEUR DONT L'AMOUR EST LE MIEL",
  "VOULOIR, C'EST POUVOIR",
  "LA SEXUALITÉ EST UN ACTE DE LIBERTÉ, NON DE SOUMISSION",
  "C'EST JUSTE MOI",
  "'GIRLS IN PARIS' INSTALLATION",
  'PEEK-A-BOO PARADOX',
  'PEEPHOLE',
  'OPTICAL PHENOMENON',
  'PEEPER',
  'MADOX',
  'PAT',
  'STEFA',
  'WIKTOR',
  'ANTHONY & OTTO',
  'EVOLUTION OF IMITATION',
  'EVOLUTION OF IMITATION II',
  'UNLEASHED MOMENTS',
  'EMBRACE YOUR FREEDOM',
  'KRISZTINA',
  'MISOPHONIC FEAST',
  'ROOTS OF THE SELF',
  'MAGICAL FOUNTAIN',
  'THE FOREST FAIRY',
  'NATURAL CONTORTION',
  'VOYAGE INTO THE UNKNOWN',
  "NATURE'S PLAYGROUND",
  'DUALIDAD MEXICANA',
  'BRANDON',
  'ETHAN',
  'MAUREEN',
  'SHARON',
  'QIYUN',
]

function normTitle(s) {
  return s.toLowerCase().replace(/[''']/g, "'").normalize('NFC').trim()
}

const artworks = await client.fetch(`*[_type == "artwork" && !(_id in path("drafts.**"))]{ _id, title }`)
const byTitle = new Map(artworks.map(a => [normTitle(a.title), a]))

const series = await client.fetch(`*[_id == $id][0]{ _id, artworks }`, { id: SERIES_ID })
if (!series) throw new Error('artworkSeries document not found')

const existingRefs = new Set((series.artworks ?? []).map(r => r._ref))

let missingCount = 0
let notFoundCount = 0
const toAppend = []

for (const title of TITLES) {
  const match = byTitle.get(normTitle(title))
  if (!match) {
    console.warn(`⚠ Not found in artwork collection: "${title}"`)
    notFoundCount++
    continue
  }
  if (existingRefs.has(match._id)) {
    console.log(`✓ Already in series: ${match.title}`)
    continue
  }
  console.log(`${DRY_RUN ? '[DRY RUN] Would add' : '→ Adding'}: ${match.title} (${match._id})`)
  toAppend.push({ _key: Math.random().toString(36).slice(2, 10), _ref: match._id, _type: 'reference' })
  missingCount++
}

if (!DRY_RUN && toAppend.length > 0) {
  await client.patch(SERIES_ID).setIfMissing({ artworks: [] }).append('artworks', toAppend).commit()
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Done — ${missingCount} ${DRY_RUN ? 'would be added' : 'added'} to the series, ${notFoundCount} not found.`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply.')

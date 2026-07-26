/**
 * Import Innate Curiosity artworks into Sanity
 * Run: node scripts/import-artworks.mjs
 * Requires SANITY_WRITE_TOKEN in .env.local
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')]
    })
)

const token = env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('❌ SANITY_WRITE_TOKEN not found in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const artworks = [
  {
    _type: 'artwork',
    title: 'Innate Curiosity / The Peek — V1',
    slug: { _type: 'slug', current: 'innate-curiosity-the-peek-v1' },
    year: 2026,
    medium: 'Wooden frame, glass, recessed plastic passe-partout, aluminium venetian blinds, backlit photographic print on Fujicolor Crystal Archive paper, LED light panel, wall-mounted aluminium housing',
    dimensions: { widthCm: 67, heightCm: 67, depthCm: 35 },
    description: [
      {
        _type: 'block',
        _key: 'peek-desc-1',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'peek-span-1',
          text: 'A closed set of aluminium venetian blinds mounted to the wall, with a backlit photograph behind them. To see anything, the viewer has to open the blinds by hand, come closer, find the right angle. The image rewards effort and punishes the casual glance.',
        }],
      }
    ],
    editionTotal: 10,
    editionAP: 2,
    priceExclVAT: 1980,
    vatRate: 9,
    status: 'available',
    showInWebshop: false,
    showInWorks: true,
    featured: false,
  },
  {
    _type: 'artwork',
    title: 'Innate Curiosity / The Find — V1',
    slug: { _type: 'slug', current: 'innate-curiosity-the-find-v1' },
    year: 2026,
    medium: 'Original NS train wastebin, handmade magazine (HP Indigo digital print, 64 pages, A5), brown paper bag, mixed period debris',
    dimensions: { widthCm: 27, heightCm: 59, depthCm: 14 },
    description: [
      {
        _type: 'block',
        _key: 'find-desc-1',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'find-span-1',
          text: 'A Dutch railway wastebin. Inside, among period debris, a brown paper bag contains Whisper — a fictional 1980s adult magazine, entirely handmade by the artist, indistinguishable from the source material of its time. To see it, the viewer must reach into the bin and lift it out.',
        }],
      },
      {
        _type: 'block',
        _key: 'find-desc-2',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'find-span-2',
          marks: ['em'],
          text: 'Each work in the edition is unique. The period debris surrounding the magazine is individually composed by the artist.',
        }],
      }
    ],
    editionTotal: 10,
    editionAP: 2,
    priceExclVAT: 750,
    vatRate: 9,
    status: 'available',
    showInWebshop: false,
    showInWorks: true,
    featured: false,
  },
  {
    _type: 'artwork',
    title: 'Innate Curiosity / The Trace — V1',
    slug: { _type: 'slug', current: 'innate-curiosity-the-trace-v1' },
    year: 2026,
    medium: 'White plastic Monobloc chair, phone charging cable, vintage binoculars, food prop, individually curated objects',
    dimensions: { widthCm: 55, heightCm: 80, depthCm: 50 },
    description: [
      {
        _type: 'block',
        _key: 'trace-desc-1',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'trace-span-1',
          text: 'A white plastic garden chair with a charging cable resting on the seat. On the floor beside it, a pair of binoculars and a classic plastic tray of fries. Someone was here. He is not anymore.',
        }],
      },
      {
        _type: 'block',
        _key: 'trace-desc-2',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'trace-span-2',
          marks: ['em'],
          text: 'Each work in the edition is unique. The traces left behind are individually composed by the artist.',
        }],
      }
    ],
    editionTotal: 10,
    editionAP: 2,
    priceExclVAT: 750,
    vatRate: 9,
    status: 'available',
    showInWebshop: false,
    showInWorks: true,
    featured: false,
  },
  {
    _type: 'artwork',
    title: 'Innate Curiosity / Installation V1 (complete set)',
    slug: { _type: 'slug', current: 'innate-curiosity-installation-v1' },
    year: 2026,
    medium: 'Three-work installation: The Peek, The Find, The Trace',
    description: [
      {
        _type: 'block',
        _key: 'inst-desc-1',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'inst-span-1',
          text: 'The three works together form the complete installation. Each work is sold individually in an edition of 10 + 2 AP. Priced here as a complete set.',
        }],
      },
      {
        _type: 'block',
        _key: 'inst-desc-2',
        style: 'normal',
        children: [{
          _type: 'span',
          _key: 'inst-span-2',
          marks: ['em'],
          text: 'Each edition is unique. The contents are individually composed by the artist.',
        }],
      }
    ],
    editionTotal: 10,
    editionAP: 2,
    priceExclVAT: 3000,
    vatRate: 9,
    status: 'enquire',
    showInWebshop: false,
    showInWorks: false,
    featured: false,
  },
]

console.log(`📦 Importing ${artworks.length} artworks to Sanity...`)

for (const artwork of artworks) {
  try {
    const doc = await client.create(artwork)
    console.log(`✅ Created: ${doc.title} (${doc._id})`)
  } catch (err) {
    console.error(`❌ Failed: ${artwork.title}`, err.message)
  }
}

console.log('\n✨ Done! Open http://localhost:3000/studio to view your artworks.')

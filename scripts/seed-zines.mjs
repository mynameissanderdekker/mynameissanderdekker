/**
 * Seed script: create standalone zine documents
 *
 * Run: node scripts/seed-zines.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const ZINES = [
  {
    _id: 'zine-01-annemarijn',
    _type: 'zine',
    order: 1,
    number: 'Nº1',
    title: 'Annemarijn',
    featured: false,
    meta: 'September 2021 · Edition of 25',
    description: "It began with red wine, old rock songs and a trip together. Her Instagram tagline — 'fruit-eating forest fairy' — turned out to be surprisingly accurate.",
    coverImageUrl: `${BASE}/2026/05/Zine-N01-Annemarijn.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-02-girls-in-paris',
    _type: 'zine',
    order: 2,
    number: 'Nº2',
    title: 'Girls in Paris',
    featured: true,
    projectSlug: 'girls-in-paris',
    meta: 'September 2022 · Edition of 35',
    description: 'Eight women living in Paris, each navigating freedom and self-expression on her own terms — and each, in her own way, challenging the status quo.',
    coverImageUrl: `${BASE}/2026/05/Zine-N02-Girls-in-Paris.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-03-janna',
    _type: 'zine',
    order: 3,
    number: 'Nº3',
    title: 'Janna',
    featured: false,
    meta: 'September 2022 · Edition of 35',
    description: 'Janna is a performer who explores what it means to feel vulnerable, weird and sensual — all at once. She takes femininity fully into her own hands, turning it into a source of power.',
    coverImageUrl: `${BASE}/2026/05/Zine-N03-Janna.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-04-cats-dogs',
    _type: 'zine',
    order: 4,
    number: 'Nº4',
    title: 'Cats & Dogs',
    featured: false,
    meta: 'December 2022 · Edition of 35',
    description: 'During The Social Media Project, Dekker met not only remarkable people but also their cats and dogs. This zine is a tribute to those furry co-stars and the unconditional love they offer us humans.',
    coverImageUrl: `${BASE}/2026/05/Zine-N04-Cats-Dogs.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-05-mexico',
    _type: 'zine',
    order: 5,
    number: 'Nº5',
    title: 'Mexico',
    featured: false,
    meta: 'April 2023 · Edition of 35',
    description: "A tribute to Mexico's culture, its colours and the fleeting moments of happiness found along the way — shared with two of his closest friends and one local whose energy was made for the camera.",
    coverImageUrl: `${BASE}/2026/05/Zine-N05-Mexico.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-06-claudia',
    _type: 'zine',
    order: 6,
    number: 'Nº6',
    title: 'Claudia',
    featured: false,
    meta: 'September 2023 · Edition of 35',
    description: 'Claudia lives like she belongs in another era. Built from paper, foil, handwritten notes and aluminium sheets — with peepholes — this zine places Dekker in the role of the curious observer.',
    coverImageUrl: `${BASE}/2026/05/Zine-N06-Claudia.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-07-anniversary',
    _type: 'zine',
    order: 7,
    number: 'Nº7',
    title: '12.5Y Anniversary',
    featured: false,
    meta: 'December 2023 · Edition of 50',
    description: '12.5 years ago, Dekker moved to Amsterdam — unknowingly kickstarting his life as an artist. This zine is his tribute to the city, or more precisely, to the people who make it so beautiful.',
    coverImageUrl: `${BASE}/2026/05/Zine-N07-Anniversary-1.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-08-warsaw-saga',
    _type: 'zine',
    order: 8,
    number: 'Nº8',
    title: 'The Warsaw SAGA',
    featured: true,
    projectSlug: 'warsaw-saga',
    meta: 'June 2024 · Edition of 40',
    description: 'Poland has been named the worst country in the EU for LGBTQ+ individuals. Dekker went to Warsaw to meet people who stay true to themselves despite the hatred around them — and found joy, resilience and liberation in unexpected places.',
    coverImageUrl: `${BASE}/2026/05/Zine-N08-The-Warsaw-SAGA-1.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-09-asia',
    _type: 'zine',
    order: 9,
    number: 'Nº9',
    title: 'A.S.I.A.',
    featured: true,
    projectSlug: 'asia',
    meta: 'February 2025 · Edition of 40',
    description: 'Amsterdam has a reputation for tolerance. But even here, racism against people of Asian descent is a quiet, persistent reality. For A.S.I.A., Dekker sought out seven individuals who push back — simply by being fully, visibly themselves.',
    coverImageUrl: `${BASE}/2026/05/Zine-N09-ASIA-1.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-10-tenfifteen',
    _type: 'zine',
    order: 10,
    number: 'Nº10',
    title: 'TenFifteen',
    featured: false,
    meta: 'April 2025 · Edition of 150',
    description: 'This zine pulls a selection of images from the TenFifteen installation and puts them in your hands — each one with the story behind it. Includes a unique TenFifteen print to frame and hang at home.',
    coverImageUrl: `${BASE}/2026/05/Zine-N10-TenFifteen-1.jpg`,
    status: 'sold_out',
  },
  {
    _id: 'zine-11-collectors-box',
    _type: 'zine',
    order: 11,
    number: '',
    title: 'The Collectors Box',
    featured: false,
    meta: 'May 2025',
    description: 'As a final gesture, a limited collectors box was produced — designed to house all ten zines. Made for those who had followed and collected the series from the very beginning.',
    coverImageUrl: `${BASE}/2026/05/Box.jpg`,
    status: 'sold_out',
  },
]

async function main() {
  console.log('🌱 Seeding zine documents...\n')
  for (const zine of ZINES) {
    await client.createOrReplace(zine)
    console.log(`✓ ${zine.number || '  '} ${zine.title}`)
  }
  console.log(`\n✅ Done — ${ZINES.length} zines created.`)
}

main().catch(console.error)

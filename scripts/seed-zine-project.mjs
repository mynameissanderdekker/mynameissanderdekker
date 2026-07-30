/**
 * Seed script: The Zine Project
 *
 * Creates a project document using the pageBuilder block system.
 * All content is taken from the existing static page.
 *
 * Run from the project root:
 *   node scripts/seed-zine-project.mjs
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

// ── Zines (inline in the project document) ────────────────────────────────────

const zines = [
  {
    _type: 'zineItem', _key: 'z01',
    number: 'Nº1', title: 'Annemarijn', featured: false,
    meta: 'September 2021 · Edition of 25',
    description: "It began with red wine, old rock songs and a trip together. Her Instagram tagline — 'fruit-eating forest fairy' — turned out to be surprisingly accurate.",
    coverImageUrl: `${BASE}/2026/05/Zine-N01-Annemarijn.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z02',
    number: 'Nº2', title: 'Girls in Paris', featured: true, projectSlug: 'girls-in-paris',
    meta: 'September 2022 · Edition of 35',
    description: 'Eight women living in Paris, each navigating freedom, self-expression and sexuality on her own terms — and each, in her own way, fighting to challenge the status quo. Their portraits are paired with deeply personal stories about how they look, how they are judged, and how they push back.',
    coverImageUrl: `${BASE}/2026/05/Zine-N02-Girls-in-Paris.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z03',
    number: 'Nº3', title: 'Janna', featured: false,
    meta: 'September 2022 · Edition of 35',
    description: 'Janna is a performer who explores what it means to feel vulnerable, weird and sensual — all at once. She takes femininity fully into her own hands, turning it into a source of power.',
    coverImageUrl: `${BASE}/2026/05/Zine-N03-Janna.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z04',
    number: 'Nº4', title: 'Cats & Dogs', featured: false,
    meta: 'December 2022 · Edition of 35',
    description: 'During The Social Media Project, Dekker met not only remarkable people but also their cats and dogs. This zine is a tribute to those furry co-stars and the unconditional love they offer us humans.',
    coverImageUrl: `${BASE}/2026/05/Zine-N04-Cats-Dogs.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z05',
    number: 'Nº5', title: 'Mexico', featured: false,
    meta: 'April 2023 · Edition of 35',
    description: "A tribute to Mexico's culture, its colours and the fleeting moments of happiness found along the way — shared with two of his closest friends and one local whose energy was made for the camera.",
    coverImageUrl: `${BASE}/2026/05/Zine-N05-Mexico.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z06',
    number: 'Nº6', title: 'Claudia', featured: false,
    meta: 'September 2023 · Edition of 35',
    description: 'Claudia lives like she belongs in another era. Built from paper, foil, handwritten notes and aluminium sheets — with peepholes — this zine places Dekker in the role of the curious observer.',
    coverImageUrl: `${BASE}/2026/05/Zine-N06-Claudia.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z07',
    number: 'Nº7', title: '12.5Y Anniversary', featured: false,
    meta: 'December 2023 · Edition of 50',
    description: '12.5 years ago, Dekker moved to Amsterdam — unknowingly kickstarting his life as an artist. This zine is his tribute to the city, or more precisely, to the people who make it so beautiful.',
    coverImageUrl: `${BASE}/2026/05/Zine-N07-Anniversary-1.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z08',
    number: 'Nº8', title: 'The Warsaw SAGA', featured: true, projectSlug: 'warsaw-saga',
    meta: 'June 2024 · Edition of 40',
    description: 'Poland has been named the worst country in the EU for LGBTQ+ individuals. Dekker went to Warsaw to meet people who stay true to themselves despite the hatred around them — and found joy, resilience and liberation in unexpected places.',
    coverImageUrl: `${BASE}/2026/05/Zine-N08-The-Warsaw-SAGA-1.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z09',
    number: 'Nº9', title: 'A.S.I.A.', featured: true, projectSlug: 'asia',
    meta: 'February 2025 · Edition of 40',
    description: 'Amsterdam has a reputation for tolerance. But even here, racism against people of Asian descent is a quiet, persistent reality. For A.S.I.A., Dekker sought out seven individuals who push back — simply by being fully, visibly themselves.',
    coverImageUrl: `${BASE}/2026/05/Zine-N09-ASIA-1.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z10',
    number: 'Nº10', title: 'TenFifteen', featured: false,
    meta: 'April 2025 · Edition of 150',
    description: 'This zine pulls a selection of images from the TenFifteen installation and puts them in your hands — each one with the story behind it. Includes a unique TenFifteen print to frame and hang at home.',
    coverImageUrl: `${BASE}/2026/05/Zine-N10-TenFifteen-1.jpg`,
  },
  {
    _type: 'zineItem', _key: 'z11',
    number: '', title: 'The Collectors Box', featured: false,
    meta: 'May 2025',
    description: 'As a final gesture, a limited collectors box was produced — designed to house all ten zines. Made for those who had followed and collected the series from the very beginning.',
    coverImageUrl: `${BASE}/2026/05/Box.jpg`,
  },
]

// ── pageBuilder blocks ────────────────────────────────────────────────────────

const pageBuilder = [
  // 1. Top video
  {
    _type: 'heroVideo',
    _key: 'pb-video-top',
    url: `${BASE}/2026/05/C0190-3.mp4`,
  },

  // 2. Intro text
  {
    _type: 'textSection',
    _key: 'pb-intro',
    width: '8col',
    content: [
      {
        _type: 'block', _key: 'b1', style: 'normal',
        children: [{
          _type: 'span', _key: 's1',
          text: 'Like The Social Media Project before it, The Zine Project began on social media — but where that project was driven by the surprise of the encounter, the gap between who people appeared to be online and who they turned out to be in person, the zines went deeper. Each one was a sustained, intimate exploration of a single person, place or theme, built on trust, time and close collaboration.',
        }],
      },
      {
        _type: 'block', _key: 'b2', style: 'normal',
        children: [{
          _type: 'span', _key: 's2',
          text: 'Between 2021 and 2025, Dekker developed ten completely handmade zines, each published in a very limited edition. The subjects range widely — from intimate portraits and personal tributes to projects rooted in social urgency. From a vacation in Mexico to LGBTQ+ lives under pressure in Warsaw. From cats and dogs to racism in the Netherlands. Each project found its own form, its own tone, its own reason to exist.',
        }],
      },
      {
        _type: 'block', _key: 'b3', style: 'normal',
        children: [{
          _type: 'span', _key: 's3',
          text: 'Each zine had sold out within minutes of release. The series concluded in 2025 with an exhibition at TORCH Gallery Amsterdam that brought the entire project together for the first time.',
        }],
      },
    ],
  },

  // 3. Zine grid (featured + all)
  {
    _type: 'zineGrid',
    _key: 'pb-zinegrid',
    showFeatured: true,
    showAll: true,
  },

  // 4. Exhibition gallery (WordPress CDN images via externalUrls)
  {
    _type: 'galleryBlock',
    _key: 'pb-gallery',
    columns: 3,
    externalUrls: [
      `${BASE}/2025/04/DSC06719.jpg`,
      `${BASE}/2025/04/DSC01221.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-09.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-07.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-10.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-11.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-03.jpg`,
      `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-13.jpg`,
    ],
  },

  // 5. Closing video
  {
    _type: 'heroVideo',
    _key: 'pb-video-closing',
    url: `${BASE}/2026/06/Final-2K.mp4`,
  },
]

// ── Document ──────────────────────────────────────────────────────────────────

const zineProject = {
  _id: 'project-the-zine-project',
  _type: 'project',
  title: 'The Zine Project',
  slug: { _type: 'slug', current: 'the-zine-project' },
  dateRange: '2021 – 2025',
  isPage: true,
  order: 1,
  zines,
  pageBuilder,
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding The Zine Project (pageBuilder format)...\n')
  try {
    await client.createOrReplace(zineProject)
    console.log('✅ The Zine Project seeded with pageBuilder blocks:')
    console.log('   • heroVideo       — top video')
    console.log('   • textSection     — intro (3 paragraphs)')
    console.log('   • zineGrid        — featured + all zines')
    console.log('   • galleryBlock    — 8 exhibition photos (WordPress CDN)')
    console.log('   • heroVideo       — closing video')
    console.log('\n🗑  Once confirmed in browser, delete the static route:')
    console.log('   src/app/(site)/projects/the-zine-project/page.tsx')
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

seed()

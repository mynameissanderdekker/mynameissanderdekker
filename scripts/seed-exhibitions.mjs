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

// ── EXHIBITIONS ───────────────────────────────────────────────────────────────

const exhibitions = [
  // The Zine Project — Solo presentations
  { _id: 'exh-zine-2026-studio',    _type: 'exhibition', title: 'The Zine Project', gallery: 'Studio presentation (by appointment)', location: 'Amsterdam, NL', startDate: '2026-01-01', isSolo: true },
  { _id: 'exh-zine-2025-torch',     _type: 'exhibition', title: 'The Zine Project', gallery: 'Torch Gallery',                         location: 'Amsterdam, NL', startDate: '2025-01-01', isSolo: true },
  { _id: 'exh-zine-2023-josilda',   _type: 'exhibition', title: 'The Zine Project', gallery: 'Josilda da Conceição Gallery',           location: 'Amsterdam, NL', startDate: '2023-01-01', isSolo: true },

  // TenFifteen — Permanent installations
  { _id: 'exh-ten15-leica',         _type: 'exhibition', title: 'TenFifteen — The Social Landscape', gallery: 'Leica Store',           location: 'Lisse, NL',      startDate: '2026-01-01', isSolo: true, description: 'Permanent installation (since 2026)' },
  { _id: 'exh-ten15-strayfield',    _type: 'exhibition', title: 'TenFifteen — The Social Landscape', gallery: 'Strayfield Gallery',    location: 'Hellerup, DK',   startDate: '2020-01-01', isSolo: true, description: 'Permanent installation (since 2020)' },
  { _id: 'exh-ten15-torch',         _type: 'exhibition', title: 'TenFifteen — The Social Landscape', gallery: 'TORCH Gallery',         location: 'Amsterdam, NL',  startDate: '2018-01-01', isSolo: true, description: 'Permanent installation (since 2018)' },
  { _id: 'exh-ten15-hotelnothotel', _type: 'exhibition', title: 'TenFifteen — The Social Landscape', gallery: 'Hotel Not Hotel',       location: 'Amsterdam, NL',  startDate: '2018-01-01', isSolo: true, description: 'Permanent installation (since 2018)' },

  // The Social Media Project — Solo presentations
  { _id: 'exh-smp-2022-torch',      _type: 'exhibition', title: 'The Social Media Project', gallery: 'Torch Gallery',                 location: 'Amsterdam, NL',   startDate: '2022-01-01', isSolo: true },
  { _id: 'exh-smp-2020-strayfield', _type: 'exhibition', title: 'The Social Media Project', gallery: 'Strayfield Gallery',            location: 'Copenhagen, DK',  startDate: '2020-01-01', isSolo: true },
  { _id: 'exh-smp-2018-torch',      _type: 'exhibition', title: 'The Social Media Project', gallery: 'Torch Gallery',                 location: 'Amsterdam, NL',   startDate: '2018-06-01', isSolo: true },
  { _id: 'exh-smp-2018-acs',        _type: 'exhibition', title: 'The Social Media Project', gallery: 'Amsterdam Central Station',      location: 'Amsterdam, NL',   startDate: '2018-01-01', isSolo: true },
  { _id: 'exh-smp-2016-30works',    _type: 'exhibition', title: 'The Social Media Project', gallery: '30Works Gallery',               location: 'Cologne, DE',     startDate: '2016-01-01', isSolo: true },
  { _id: 'exh-smp-2015-walls',      _type: 'exhibition', title: 'The Social Media Project', gallery: 'Walls Gallery',                 location: 'Amsterdam, NL',   startDate: '2015-01-01', isSolo: true },
  { _id: 'exh-smp-2014-majke',      _type: 'exhibition', title: 'The Social Media Project', gallery: 'Majke Hüsstege',                location: 'Den Bosch, NL',   startDate: '2014-01-01', isSolo: true },
  { _id: 'exh-smp-2012-walls',      _type: 'exhibition', title: 'The Social Media Project', gallery: 'Walls Gallery',                 location: 'Amsterdam, NL',   startDate: '2012-01-01', isSolo: true },
]

// ── ART FAIRS ─────────────────────────────────────────────────────────────────

const artFairs = [
  { _id: 'fair-ic-2026-nap',  _type: 'artFair', name: 'Innate Curiosity — NAP+ 2026', fair: 'NAP+', location: 'Amsterdam, NL', startDate: '2026-01-01' },
]

// ── Run ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`Seeding ${exhibitions.length} exhibitions...`)
  for (const doc of exhibitions) {
    await client.createOrReplace(doc)
    console.log(`  ✓ ${doc._id}`)
  }

  console.log(`Seeding ${artFairs.length} art fairs...`)
  for (const doc of artFairs) {
    await client.createOrReplace(doc)
    console.log(`  ✓ ${doc._id}`)
  }

  console.log('Done.')
}

run().catch(err => { console.error(err); process.exit(1) })

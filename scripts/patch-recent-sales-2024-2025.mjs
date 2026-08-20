/**
 * patch-recent-sales-2024-2025.mjs
 * Adds artworks and sales from 2023–2025 (reconstructed from memory after CSV corruption).
 *
 * Run: node scripts/patch-recent-sales-2024-2025.mjs
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

function ref(id) { return { _type: 'reference', _ref: id } }

// ─────────────────────────────────────────────────────────────────────────────
// NEW ARTWORKS
// ─────────────────────────────────────────────────────────────────────────────

const newArtworks = [
  {
    _id: 'artwork-hist-la-vie-est-une-fleur',
    _type: 'artwork',
    title: "LA VIE EST UNE FLEUR DONT L'AMOUR EST LE MIEL",
    slug: { _type: 'slug', current: 'la-vie-est-une-fleur' },
    year: 2021,
    medium: 'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass & wooden frame',
    dimensions: { widthCm: 45, heightCm: 30 },
    editionTotal: 7,
    editionAP: 2,
    // Description contains a quote by Victor Hugo — keep verbatim
  },
  {
    _id: 'artwork-hist-the-peeper',
    _type: 'artwork',
    title: 'The PEEPER',
    slug: { _type: 'slug', current: 'the-peeper' },
    year: 2022,
    medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass / anti reflex, wooden frame, hand-painted panel, metal hinges and knob',
    dimensions: { widthCm: 40, heightCm: 40 },
    editionTotal: 7,
    editionAP: 2,
  },
  // ALL 10 ZINES + COLLECTORS BOX — sold as a set, not a regular webshop item
  {
    _id: 'artwork-hist-10-zines-collectors-box',
    _type: 'artwork',
    title: 'All 10 Zines + Collector\'s Box',
    slug: { _type: 'slug', current: 'all-10-zines-collectors-box' },
    year: 2025,
    medium: 'Complete set of 10 artist zines with collector\'s box',
    status: 'sold_out',
    additionalStatusInfo: 'Sold as complete set — not sold individually',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// NEW CONTACTS (createIfNotExists)
// ─────────────────────────────────────────────────────────────────────────────

const newContacts = [
  {
    _id: 'contact-hist-jan-pot',
    _type: 'contact',
    firstName: 'Jan',
    lastName: 'Pot',
    email: 'jan-pot@placeholder.art',
    type: 'collector',
    notes: 'Bought All 10 Zines + Collector\'s Box as a set at Torch expo (April 2025). Placeholder email.',
    purchases: [
      {
        _key: 'p-jan-pot-zines',
        artwork: ref('artwork-hist-10-zines-collectors-box'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2025-04-12',
        price: 750,
      },
    ],
  },
  {
    _id: 'contact-hist-alain-verleysen',
    _type: 'contact',
    firstName: 'Alain',
    lastName: 'Verleysen',
    email: 'alain-verleysen@placeholder.art',
    type: 'collector',
    notes: 'The PEEPER — edition number unknown. Bought at Torch 40Y expo (2024). Placeholder email.',
    purchases: [
      {
        _key: 'p-alain-peeper',
        artwork: ref('artwork-hist-the-peeper'),
        copyNumber: '?', // edition number not confirmed
        soldVia: 'gallery',
        date: '2024-01-01', // approximate — Torch 40Y 2024
      },
    ],
  },
  {
    _id: 'contact-hist-duncan-meeder',
    _type: 'contact',
    firstName: 'Duncan',
    lastName: 'Meeder',
    email: 'duncan-meeder@placeholder.art',
    type: 'collector',
    notes: 'The PEEPER — edition number unknown. Bought at Torch 40Y expo (2024). Placeholder email. (Not the same as Duncan Leica.)',
    purchases: [
      {
        _key: 'p-duncan-meeder-peeper',
        artwork: ref('artwork-hist-the-peeper'),
        copyNumber: '?', // edition number not confirmed
        soldVia: 'gallery',
        date: '2024-01-01',
      },
    ],
  },
  {
    _id: 'contact-hist-bj-kruiswijk',
    _type: 'contact',
    firstName: 'B.J.',
    lastName: 'Kruiswijk',
    email: 'bj-kruiswijk@placeholder.art',
    type: 'collector',
    notes: 'The PEEPER Ed 4/7. Bought at Torch expo (April 12, 2025). Placeholder email.',
    purchases: [
      {
        _key: 'p-bj-peeper',
        artwork: ref('artwork-hist-the-peeper'),
        copyNumber: '4',
        soldVia: 'gallery',
        date: '2025-04-12',
        price: 1750,
      },
    ],
  },
  {
    _id: 'contact-hist-josilda-expo-2023-anon',
    _type: 'contact',
    firstName: 'Unknown',
    lastName: '(Josilda expo 2023)',
    email: 'josilda-expo-2023-anon@placeholder.art',
    type: 'collector',
    notes: "LA VIE EST UNE FLEUR Ed 1 — buyer name unknown. Sold via Josilda da Conceição Gallery expo 2023. Update when name is confirmed.",
    purchases: [
      {
        _key: 'p-josilda-anon-la-vie',
        artwork: ref('artwork-hist-la-vie-est-une-fleur'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2023-01-01', // approximate
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PATCH EXISTING CONTACT: Guido De Bruyn — add The PEEPER purchase
// ─────────────────────────────────────────────────────────────────────────────

async function patchGuidoPeeper() {
  // Guido already exists (contact-hist-guido-de-bruyn) with So Fashion + Out of the blue
  // Append The PEEPER without overwriting
  await client
    .patch('contact-hist-guido-de-bruyn')
    .setIfMissing({ purchases: [] })
    .append('purchases', [{
      _key: 'p-guido-peeper',
      artwork: ref('artwork-hist-the-peeper'),
      copyNumber: '?', // edition number not confirmed
      soldVia: 'gallery',
      date: '2024-01-01', // Torch 40Y 2024
    }])
    .commit()
  console.log('✓  Guido De Bruyn ← The PEEPER (Torch 40Y 2024)')
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== patch-recent-sales-2024-2025.mjs ===\n')

  console.log(`Adding ${newArtworks.length} artworks...`)
  for (const doc of newArtworks) {
    try {
      await client.createOrReplace(doc)
      console.log(`✓  ${doc.title}`)
    } catch (err) {
      console.error(`✗  ${doc.title}: ${err.message}`)
    }
  }

  console.log(`\nAdding ${newContacts.length} contacts...`)
  for (const doc of newContacts) {
    try {
      await client.createIfNotExists(doc)
      console.log(`✓  ${doc.firstName} ${doc.lastName ?? ''}`.trim())
    } catch (err) {
      console.error(`✗  ${doc.firstName}: ${err.message}`)
    }
  }

  console.log('\nPatching Guido De Bruyn...')
  try {
    await patchGuidoPeeper()
  } catch (err) {
    console.error(`✗  Guido De Bruyn patch: ${err.message}`)
  }

  console.log('\nDone!')
  console.log('\nTodo — update when you remember:')
  console.log('  - The PEEPER: edition numbers for Guido, Alain, Duncan (currently "?")')
  console.log("  - LA VIE: buyer name for Ed 1 (Josilda expo 2023)")
}

main().catch(err => { console.error(err); process.exit(1) })

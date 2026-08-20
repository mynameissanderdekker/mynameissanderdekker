/**
 * patch-misc-artworks.mjs
 * Adds a handful of artworks and contacts discovered during CSV import cleanup.
 *
 * Run: node scripts/patch-misc-artworks.mjs
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

const artworks = [
  {
    _id: 'artwork-hist-air-gitar-isabel',
    _type: 'artwork',
    title: 'Air gitar (Isabel)',
    slug: { _type: 'slug', current: 'air-gitar-isabel' },
    notes: 'Artist proof. Given to Isabel Nollen.',
  },
  {
    _id: 'artwork-hist-meisje-achter-blak-usa',
    _type: 'artwork',
    title: 'Meisje achter blak USA',
    slug: { _type: 'slug', current: 'meisje-achter-blak-usa' },
    notes: 'Given to Marloes van Vugt as gift.',
  },
]

const contacts = [
  {
    _id: 'contact-hist-isabel-nollen',
    _type: 'contact',
    firstName: 'Isabel',
    lastName: 'Nollen',
    email: 'isabel-nollen@placeholder.art',
    type: 'collector',
    notes: 'Received Air gitar (Isabel) — artist proof. Placeholder email.',
    purchases: [
      {
        _key: 'p-isabel-air-gitar',
        artwork: ref('artwork-hist-air-gitar-isabel'),
        copyNumber: '1 AP',
        soldVia: 'direct',
      },
    ],
  },
  {
    _id: 'contact-hist-marloes-van-vugt',
    _type: 'contact',
    firstName: 'Marloes',
    lastName: 'van Vugt',
    email: 'mme.vanvugt@gmail.com',
    type: 'collector',
    notes: 'Received Meisje achter blak USA as gift.',
    purchases: [
      {
        _key: 'p-marloes-meisje-achter-blak',
        artwork: ref('artwork-hist-meisje-achter-blak-usa'),
        copyNumber: '1',
        soldVia: 'direct',
      },
    ],
  },
]

async function main() {
  console.log('=== patch-misc-artworks.mjs ===\n')

  for (const doc of artworks) {
    try {
      await client.createOrReplace(doc)
      console.log(`✓  artwork: ${doc.title}`)
    } catch (err) {
      console.error(`✗  ${doc.title}: ${err.message}`)
    }
  }

  for (const doc of contacts) {
    try {
      await client.createIfNotExists(doc)
      console.log(`✓  contact: ${doc.firstName} ${doc.lastName}`)
    } catch (err) {
      console.error(`✗  ${doc.firstName}: ${err.message}`)
    }
  }

  console.log('\nDone!')
  console.log('\nNog te doen:')
  console.log('  - Orders 6173, 5150, 2391, 5170: koper + artwork onbekend — handmatig opzoeken')
  console.log('  - Duncan Leica (contact-hist-duncan-leica) vs Duncan Meeder (contact-hist-duncan-meeder):')
  console.log('    zelfde persoon? Zo ja, één record verwijderen en aankopen samenvoegen')
}

main().catch(err => { console.error(err); process.exit(1) })

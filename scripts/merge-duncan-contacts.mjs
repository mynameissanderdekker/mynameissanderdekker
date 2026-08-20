/**
 * merge-duncan-contacts.mjs
 * Merges contact-hist-duncan-meeder into contact-hist-duncan-leica.
 * Updates name/email, moves The PEEPER purchase, deletes the duplicate.
 *
 * Run: node scripts/merge-duncan-contacts.mjs
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

async function main() {
  // 1. Update contact-hist-duncan-leica with correct name/email + PEEPER purchase
  await client
    .patch('contact-hist-duncan-leica')
    .set({
      firstName: 'Duncan',
      lastName: 'Meeder',
      email: 'sales@fotohennyhoogeveen.nl',
      notes: 'Photographer/contact at Foto Henny Hoogeveen. Anastasia Ed 2 + Embrace Your Freedom Ed 1 (both trade, Dec 2024 via Torch). Also bought The PEEPER (Torch 40Y 2024, edition unknown).',
    })
    .append('purchases', [{
      _key: 'p-duncan-meeder-peeper',
      artwork: { _type: 'reference', _ref: 'artwork-hist-the-peeper' },
      copyNumber: '?',
      soldVia: 'gallery',
      date: '2024-01-01',
    }])
    .commit()
  console.log('✓ contact-hist-duncan-leica updated (Duncan Meeder, Foto Henny Hoogeveen)')

  // 2. Delete the duplicate
  await client.delete('contact-hist-duncan-meeder')
  console.log('✓ contact-hist-duncan-meeder deleted')

  console.log('\nDone — één record voor Duncan Meeder.')
}

main().catch(err => { console.error(err); process.exit(1) })

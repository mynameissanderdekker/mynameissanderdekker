/**
 * Fixes the two pre-existing TenFifteen permanent installation docs
 * that the seed script missed because their showInCV was null.
 *
 * Run: node scripts/fix-permanent-installs.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const TSL_PROJECT_ID = 'project-tenfifteen'
const cvProject = { _type: 'reference', _ref: TSL_PROJECT_ID }

const FIXES = [
  {
    _id: 'exh-ten15-strayfield',
    gallery: 'Strayfield Gallery',
    location: 'Hellerup, DK',
    startDate: '2020-07-01',
    exhibitionType: 'permanent',
  },
  {
    _id: 'exh-ten15-hotelnothotel',
    gallery: 'Hotel Not Hotel',
    location: 'Amsterdam, NL',
    startDate: '2018-07-01',
    exhibitionType: 'permanent',
  },
]

async function main() {
  for (const fix of FIXES) {
    const { _id, ...fields } = fix
    await client.patch(_id).set({ ...fields, showInCV: true, cvProject }).commit()
    console.log(`✓ Fixed ${fix.gallery} (${fix._id})`)
  }
  console.log('\nDone. Refresh http://localhost:3000/about')
}

main().catch(console.error)

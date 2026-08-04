/**
 * Fixes NAP+ 2024 art fair: was wrongly linked to The Zine Project,
 * should be linked to The Social Media Project.
 *
 * Run: node scripts/fix-artfair-cvproject.mjs
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

await client.patch('vu76N7Rvcpr7D8P8kQ4WMj')
  .set({ cvProject: { _type: 'reference', _ref: 'project-the-social-media-project' } })
  .commit()

console.log('✓ Fixed: NAP+ 2024 → The Social Media Project')

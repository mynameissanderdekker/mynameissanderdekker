/**
 * Patches It Is Us project:
 * - Adds CTA text block at the end of pageBuilder
 *
 * Run: node scripts/patch-it-is-us.mjs
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

const ctaBlock = {
  _type: 'textSection',
  _key: 'pb-it-is-us-cta',
  width: '8col',
  textAlign: 'center',
  content: [
    {
      _type: 'block',
      _key: 'cta-p1',
      style: 'normal',
      children: [
        { _type: 'span', _key: 'cta-s1', text: 'Interested in bringing It Is Us to your venue? ' },
        {
          _type: 'span',
          _key: 'cta-s2',
          text: 'Get in touch.',
          marks: ['cta-link'],
        },
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'cta-link',
          href: 'https://www.mynameissanderdekker.com/contact',
        },
      ],
    },
  ],
}

const project = await client.fetch(
  `*[_type == "project" && slug.current == "it-is-us"][0]{ _id, "pageBuilder": pageBuilder[]._key }`
)

if (!project) {
  console.error('❌ Project not found')
  process.exit(1)
}

// Check if CTA already exists
if (project.pageBuilder?.includes('pb-it-is-us-cta')) {
  console.log('ℹ️  CTA block already exists, skipping.')
  process.exit(0)
}

await client
  .patch(project._id)
  .append('pageBuilder', [ctaBlock])
  .commit()

console.log('✓ CTA block added to It Is Us')

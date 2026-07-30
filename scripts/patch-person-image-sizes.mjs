/**
 * patch-person-image-sizes.mjs
 *
 * Sets imageSize + imageAlign on specific personBlocks.
 *
 * Run with:  node scripts/patch-person-image-sizes.mjs
 */

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

// name → { imageSize, imageAlign }
const OVERRIDES = {
  'Natalia':   { imageSize: '2/4', imageAlign: 'center' },
  'Berno':     { imageSize: '3/4', imageAlign: 'center' },
  'Tess & Ian':{ imageSize: '3/4', imageAlign: 'center' },
  'Anthony':   { imageSize: '2/4', imageAlign: 'center' },
}

const project = await client.fetch(
  `*[_type == "project" && slug.current == "the-social-media-project"][0]{ _id, pageBuilder }`
)

if (!project) { console.error('❌ Project not found'); process.exit(1) }

const updatedBlocks = project.pageBuilder.map(block => {
  if (block._type !== 'personBlock') return block
  const override = OVERRIDES[block.name]
  if (!override) return block
  console.log(`  ✅  ${block.name} → ${override.imageSize} ${override.imageAlign}`)
  return { ...block, ...override }
})

await client.patch(project._id).set({ pageBuilder: updatedBlocks }).commit()
console.log('\n✅  Done!\n')

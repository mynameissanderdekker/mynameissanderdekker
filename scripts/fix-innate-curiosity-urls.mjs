/**
 * fix-innate-curiosity-urls.mjs
 *
 * The innate-curiosity project page had buttonUrl values pointing to
 * slugs that never existed (innate-curiosity-the-peek-v1 etc).
 * This script replaces them with the correct slugs.
 *
 * Run: node scripts/fix-innate-curiosity-urls.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const SLUG_MAP = {
  'innate-curiosity-the-peek-v1':  'series-i-the-peek',
  'innate-curiosity-the-find-v1':  'series-i-the-find',
  'innate-curiosity-the-trace-v1': 'series-i-the-trace',
}

// Deep-walk a value and fix any matching buttonUrl slugs
function fixUrls(val) {
  if (typeof val === 'string') {
    let fixed = val
    for (const [wrong, correct] of Object.entries(SLUG_MAP)) {
      fixed = fixed.replace(wrong, correct)
      // Also strip any remaining localhost prefix
      fixed = fixed.replace(/^https?:\/\/localhost(:\d+)?/, '')
    }
    return [fixed, fixed !== val]
  }
  if (Array.isArray(val)) {
    let changed = false
    const next = val.map(item => {
      const [v, c] = fixUrls(item)
      if (c) changed = true
      return v
    })
    return [next, changed]
  }
  if (val && typeof val === 'object') {
    let changed = false
    const next = {}
    for (const [k, v] of Object.entries(val)) {
      const [nv, c] = fixUrls(v)
      if (c) changed = true
      next[k] = nv
    }
    return [next, changed]
  }
  return [val, false]
}

// Fetch project docs (published + drafts)
const docs = await client.fetch(
  `*[_type == "project" && slug.current == "innate-curiosity"]{ ... }`
)
console.log(`Found ${docs.length} document(s) for innate-curiosity\n`)

for (const doc of docs) {
  const { _id, _type, _rev, _createdAt, _updatedAt, ...fields } = doc
  const [newFields, changed] = fixUrls(fields)
  if (!changed) {
    console.log(`✓ ${_id} — no changes needed`)
    continue
  }
  console.log(`→ Patching ${_id}`)
  await client.patch(_id).set(newFields).commit()
  console.log(`  ✓ Done`)
}

console.log('\nFinished. Refresh the site to verify the links.')

/**
 * fix-localhost-urls.mjs
 *
 * Finds all Sanity documents that contain localhost URLs in any field
 * and replaces them with the live domain.
 *
 * Targets: buttonUrl in PageBuilder cards, and any other string field
 * containing http://localhost:3000.
 *
 * DRY_RUN=true  → prints changes, no writes
 * Run: node scripts/fix-localhost-urls.mjs
 * Dry: DRY_RUN=true node scripts/fix-localhost-urls.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n')

const LIVE = 'https://www.mynameissanderdekker.com'
const LOCAL_RE = /https?:\/\/localhost(:\d+)?/g

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// Deep-walk a value; call replacer on every string found.
// Returns [newValue, changed] where changed=true if anything was modified.
function walk(val) {
  if (typeof val === 'string') {
    if (!LOCAL_RE.test(val)) return [val, false]
    LOCAL_RE.lastIndex = 0
    const next = val.replace(LOCAL_RE, LIVE)
    return [next, true]
  }
  if (Array.isArray(val)) {
    let changed = false
    const next = val.map(item => {
      const [v, c] = walk(item)
      if (c) changed = true
      return v
    })
    return [next, changed]
  }
  if (val && typeof val === 'object') {
    let changed = false
    const next = {}
    for (const [k, v] of Object.entries(val)) {
      const [nv, c] = walk(v)
      if (c) changed = true
      next[k] = nv
    }
    return [next, changed]
  }
  return [val, false]
}

// Fetch ALL documents (published only, no drafts)
const docs = await client.fetch(
  `*[!(_id in path("drafts.**"))]{ ... }`
)
console.log(`Scanning ${docs.length} documents...\n`)

let patched = 0

for (const doc of docs) {
  const { _id, _type, _rev, _createdAt, _updatedAt, ...fields } = doc
  const [newFields, changed] = walk(fields)
  if (!changed) continue

  console.log(`→ ${_type} / ${_id}`)

  // Print what changed
  function diff(orig, next, path = '') {
    if (typeof orig === 'string' && orig !== next) {
      console.log(`    ${path}: "${orig}" → "${next}"`)
      return
    }
    if (Array.isArray(orig)) {
      orig.forEach((item, i) => diff(item, next[i], `${path}[${i}]`))
      return
    }
    if (orig && typeof orig === 'object') {
      for (const k of Object.keys(orig)) {
        diff(orig[k], next[k], path ? `${path}.${k}` : k)
      }
    }
  }
  diff(fields, newFields)

  if (!DRY_RUN) {
    await client.patch(_id).set(newFields).commit()
    patched++
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN]' : 'Done —'} ${patched || '(would patch)'} documents fixed.`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply.')

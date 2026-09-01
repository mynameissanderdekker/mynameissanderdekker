/**
 * merge-duplicate-artworks.mjs
 *
 * Merges 13 `artwork-hist-*` duplicate documents into their real catalog
 * counterparts (created by the earlier historical-sales seed/patch scripts,
 * which re-created artworks that already existed as catalog entries):
 *
 *   1. Rewrites purchases[].artwork refs on affected contacts from the
 *      hist id to the canonical catalog id.
 *   2. Deletes the hist document, plus its draft counterpart if one exists.
 *
 * Safe to re-run: ref rewrite is a no-op once refs already point at the
 * canonical id, and deleting an already-deleted id is a no-op.
 *
 * Run:       node scripts/merge-duplicate-artworks.mjs
 * Dry run:   node scripts/merge-duplicate-artworks.mjs --dry-run
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// hist id → canonical catalog id
const MERGE_MAP = {
  'artwork-hist-world-peace':               '0f6jo63Fbok163BvDmpQn4',
  'artwork-hist-got-no-time-for-that-shit':  '0f6jo63Fbok163BvDmpQya',
  'artwork-hist-im-just-creating':           '0f6jo63Fbok163BvDmpRIK',
  'artwork-hist-employee-of-the-month':      '0f6jo63Fbok163BvDmpRTq',
  'artwork-hist-anthony-and-otto':           '179kh736VLd2XUiRq4PnBX',
  'artwork-hist-embrace-your-freedom':       '179kh736VLd2XUiRq4PnU3',
  'artwork-hist-the-maestro':                '960c4097-eaa3-475a-a387-b85a7ce232ae',
  'artwork-hist-nimby':                      'GskSHzltiom27vUz3q2t1u',
  'artwork-hist-new-found-freedom':          'GskSHzltiom27vUz3q2tOq',
  'artwork-hist-speedy-harmony':             'NJpDeWPGlsYAY2Gy8PLBsV',
  'artwork-hist-anastasia':                  'k57DXB4TxK58qNiTm5fISA',
  'artwork-hist-horticulture-ii':            'iDneq7i7OtjTndYyXoLlAP',
  'artwork-hist-nyc-rooftop':                'k57DXB4TxK58qNiTm5eFcU',
}

async function preflightCheck() {
  const histIds = Object.keys(MERGE_MAP)
  const canonicalIds = Object.values(MERGE_MAP)
  const docs = await client.fetch(
    `*[_id in $ids]{_id, title}`,
    { ids: [...histIds, ...canonicalIds] }
  )
  const byId = new Map(docs.map(d => [d._id, d.title]))

  let ok = true
  let alreadyMerged = 0
  for (const [histId, canonicalId] of Object.entries(MERGE_MAP)) {
    if (!byId.has(histId)) {
      alreadyMerged++ // hist doc already deleted by a prior run — nothing left to do for this pair
      continue
    }
    if (!byId.has(canonicalId)) {
      console.error(`✗  Missing canonical doc: ${canonicalId} (for ${histId})`)
      ok = false
    }
  }
  if (!ok) {
    throw new Error('Preflight check failed — aborting before any writes.')
  }
  console.log(`Preflight OK — ${histIds.length - alreadyMerged} pair(s) left to merge, ${alreadyMerged} already done.\n`)
}

async function rewritePurchaseRefs() {
  const oldIds = Object.keys(MERGE_MAP)
  const contacts = await client.fetch(
    `*[_type == "contact" && count(purchases[artwork._ref in $oldIds]) > 0]{_id, firstName, lastName, purchases}`,
    { oldIds }
  )

  console.log(`Found ${contacts.length} contact(s) with purchases referencing duplicate artworks.`)

  let refsRewritten = 0
  for (const c of contacts) {
    const patches = {}
    for (const p of c.purchases) {
      const newId = MERGE_MAP[p.artwork?._ref]
      if (newId) {
        patches[`purchases[_key=="${p._key}"].artwork._ref`] = newId
        refsRewritten++
      }
    }
    if (Object.keys(patches).length === 0) continue

    const label = `${c.firstName} ${c.lastName ?? ''}`.trim()
    console.log(`  ${DRY_RUN ? 'Would rewrite' : '✓  Rewrote'} ${Object.keys(patches).length} ref(s) for ${label}`)
    if (!DRY_RUN) {
      await client.patch(c._id).set(patches).commit()
    }
  }
  console.log(`\nRefs ${DRY_RUN ? 'to rewrite' : 'rewritten'}: ${refsRewritten}\n`)
}

// Finds every {_type: 'reference', _ref: <oldId>} inside a document, anywhere
// in its structure, and returns GROQ-patch paths to each one (using `_key`
// selectors for array items). Catches reference patterns beyond the
// `contact.purchases` shape handled above (e.g. projectSeries.artworks[]).
function findRefPaths(node, oldIds, path = []) {
  const hits = []
  if (!node || typeof node !== 'object') return hits

  if (node._type === 'reference' && oldIds.includes(node._ref)) {
    hits.push(path)
    return hits
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const seg = item && item._key ? `[_key=="${item._key}"]` : `[${i}]`
      hits.push(...findRefPaths(item, oldIds, [...path, seg]))
    })
  } else {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('_')) continue
      hits.push(...findRefPaths(value, oldIds, [...path, key]))
    }
  }
  return hits
}

function pathToString(path) {
  return path.reduce((acc, seg) => (seg.startsWith('[') ? acc + seg : acc ? `${acc}.${seg}` : seg), '')
}

async function rewriteOtherReferences() {
  const oldIds = Object.keys(MERGE_MAP)
  const refDocs = await client.fetch(`*[references($oldIds) && _type != "contact"]{_id, _type}`, { oldIds })

  console.log(`Found ${refDocs.length} other document(s) referencing duplicate artworks.`)

  for (const { _id, _type } of refDocs) {
    const doc = await client.getDocument(_id)
    const paths = findRefPaths(doc, oldIds)
    if (paths.length === 0) continue

    const patches = {}
    for (const path of paths) {
      const pathStr = pathToString(path)
      const oldRef = path.reduce((n, seg) => {
        if (seg.startsWith('[_key=="')) {
          const key = seg.slice(8, -2)
          return n.find(x => x._key === key)
        }
        return n[seg]
      }, doc)
      patches[`${pathStr}._ref`] = MERGE_MAP[oldRef._ref]
    }

    console.log(`  ${DRY_RUN ? 'Would rewrite' : '✓  Rewrote'} ${paths.length} ref(s) in ${_type} "${_id}"`)
    if (!DRY_RUN) {
      await client.patch(_id).set(patches).commit()
    }
  }
  console.log('')
}

async function deleteHistDocs() {
  const histIds = Object.keys(MERGE_MAP)
  console.log(`${DRY_RUN ? 'Would delete' : 'Deleting'} ${histIds.length} duplicate artwork document(s) (+ any drafts)...`)

  for (const id of histIds) {
    for (const target of [id, `drafts.${id}`]) {
      if (DRY_RUN) {
        console.log(`  −  ${target}`)
        continue
      }
      try {
        await client.delete(target)
        console.log(`  ✓  ${target}`)
      } catch (err) {
        console.error(`  ✗  ${target}: ${err.message}`)
      }
    }
  }
}

async function main() {
  console.log(DRY_RUN ? '=== merge-duplicate-artworks.mjs (DRY RUN) ===\n' : '=== merge-duplicate-artworks.mjs ===\n')

  await preflightCheck()
  await rewritePurchaseRefs()
  await rewriteOtherReferences()
  await deleteHistDocs()

  console.log('\nDone! Open Studio to verify.')
}

main().catch(err => {
  console.error(`\nFatal: ${err.message}`)
  process.exit(1)
})

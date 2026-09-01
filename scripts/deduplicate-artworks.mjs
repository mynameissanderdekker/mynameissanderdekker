/**
 * deduplicate-artworks.mjs
 *
 * Fixes artwork duplicates:
 *  1. NYC Rooftop — delete artwork-hist-nyc-rooftop, remap contact purchases → k57DXB4TxK58qNiTm5eFcU
 *  2. The Peeper  — delete 56Aw9PqdKBoWxRYUC0wYTp (empty), keep artwork-hist-the-peeper
 *  3. Varietes    — delete artwork-hist-varietes-frankrijk, keep artwork-hist-varietes
 *
 * Run: node scripts/deduplicate-artworks.mjs
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

// ── 1. NYC Rooftop ────────────────────────────────────────────────────────────
// Keep: k57DXB4TxK58qNiTm5eFcU (2 images, original)
// Delete: artwork-hist-nyc-rooftop
// Remap: any contact purchase ref pointing to artwork-hist-nyc-rooftop → k57DXB4TxK58qNiTm5eFcU

async function fixNycRooftop() {
  const OLD = 'artwork-hist-nyc-rooftop'
  const NEW = 'k57DXB4TxK58qNiTm5eFcU'

  const contacts = await client.fetch(
    `*[_type == "contact" && count(purchases[artwork._ref == $old]) > 0]{ _id, purchases }`,
    { old: OLD }
  )
  console.log(`NYC Rooftop: ${contacts.length} contacts to remap`)

  for (const c of contacts) {
    const updated = c.purchases.map(p =>
      p.artwork?._ref === OLD
        ? { ...p, artwork: { _type: 'reference', _ref: NEW } }
        : p
    )
    await client.patch(c._id).set({ purchases: updated }).commit()
    console.log(`  ✓ remapped ${c._id}`)
  }

  await client.delete(OLD)
  console.log(`  ✓ deleted ${OLD}`)
}

// ── 2. The Peeper ─────────────────────────────────────────────────────────────
// Keep: artwork-hist-the-peeper (purchases point here)
// Delete: 56Aw9PqdKBoWxRYUC0wYTp (empty, no purchases)

async function fixPeeper() {
  const DELETE_ID = '56Aw9PqdKBoWxRYUC0wYTp'
  await client.delete(DELETE_ID)
  console.log(`Peeper: deleted ${DELETE_ID}`)
}

// ── 3. Varietes / Varietes Frankrijk ─────────────────────────────────────────
// Keep: artwork-hist-varietes
// Delete: artwork-hist-varietes-frankrijk
// Remap any purchases pointing to artwork-hist-varietes-frankrijk

async function fixVarietes() {
  const OLD = 'artwork-hist-varietes-frankrijk'
  const NEW = 'artwork-hist-varietes'

  const contacts = await client.fetch(
    `*[_type == "contact" && count(purchases[artwork._ref == $old]) > 0]{ _id, purchases }`,
    { old: OLD }
  )
  console.log(`Varietes: ${contacts.length} contacts to remap`)

  for (const c of contacts) {
    const updated = c.purchases.map(p =>
      p.artwork?._ref === OLD
        ? { ...p, artwork: { _type: 'reference', _ref: NEW } }
        : p
    )
    await client.patch(c._id).set({ purchases: updated }).commit()
    console.log(`  ✓ remapped ${c._id}`)
  }

  await client.delete(OLD)
  console.log(`  ✓ deleted ${OLD}`)
}

async function main() {
  console.log('=== deduplicate-artworks.mjs ===\n')
  await fixNycRooftop()
  console.log()
  await fixPeeper()
  console.log()
  await fixVarietes()
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })

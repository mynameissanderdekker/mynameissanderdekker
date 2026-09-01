/**
 * Expositievelden gelijktrekken met de gallery-template.
 *
 * Twee dingen:
 *
 * 1. `description` was platte tekst en is nu portable text. Vijf exposities
 *    hebben er een; die worden omgezet naar één alinea per regel.
 *
 * 2. `press[]` op de expositie verdwijnt. De koppeling loopt voortaan één kant
 *    op — vanuit het persbericht (`press.exhibitions[]`) — omdat twee lijsten
 *    die je handmatig gelijk moet houden altijd uit elkaar lopen. Wat hier nog
 *    staat en aan de andere kant ontbreekt, wordt eerst overgezet.
 *
 *   DRY=1 node scripts/migrate-exhibition-fields.mjs
 *         node scripts/migrate-exhibition-fields.mjs
 */

import { createClient } from '@sanity/client'
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import crypto from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

try {
  for (const line of readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const DRY = process.env.DRY === '1'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN
if (!token && !DRY) {
  console.error('Geen SANITY_API_WRITE_TOKEN gevonden in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

const docs = await client.fetch(
  `*[_type == "exhibition"]{ _id, title, description, "pressRefs": press[]._ref, artworkSeries }`
)

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-exhibitions-${stamp}.json`, JSON.stringify(docs, null, 2))
console.log(`Backup: backup-exhibitions-${stamp}.json\n`)

// ── 1. description: tekst → portable text ────────────────────────────────────
const toBlocks = (text) =>
  String(text)
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => ({
      _key: crypto.randomUUID().slice(0, 12),
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{ _key: crypto.randomUUID().slice(0, 12), _type: 'span', text: para, marks: [] }],
    }))

let converted = 0
for (const d of docs) {
  if (typeof d.description !== 'string' || !d.description.trim()) continue
  const blocks = toBlocks(d.description)
  console.log(`description: ${d.title ?? d._id}`)
  console.log(`  "${d.description.slice(0, 70)}${d.description.length > 70 ? '…' : ''}" → ${blocks.length} alinea('s)`)
  if (!DRY) await client.patch(d._id).set({ description: blocks }).commit()
  converted++
}

// ── 2. press[] omkeren en opruimen ───────────────────────────────────────────
let moved = 0
let unsetPress = 0
for (const d of docs) {
  const refs = (d.pressRefs ?? []).filter(Boolean)
  if (refs.length === 0) continue

  for (const pressId of refs) {
    const already = await client.fetch(
      `count(*[_id == $p && $e in exhibitions[]._ref]) > 0`,
      { p: pressId, e: d._id }
    )
    if (already) continue
    console.log(`press: "${d.title ?? d._id}" toevoegen aan persbericht ${pressId}`)
    if (!DRY) {
      await client
        .patch(pressId)
        .setIfMissing({ exhibitions: [] })
        .append('exhibitions', [{ _key: crypto.randomUUID(), _type: 'reference', _ref: d._id }])
        .commit()
    }
    moved++
  }

  if (!DRY) await client.patch(d._id).unset(['press']).commit()
  unsetPress++
}

console.log(
  `\n${DRY ? 'DRY run — er is niets gewijzigd.' : 'Klaar.'}` +
    `\n  ${converted} description(s) omgezet` +
    `\n  ${moved} koppeling(en) overgezet naar het persbericht` +
    `\n  ${unsetPress} expositie(s) waarvan press[] weggaat`
)
console.log('\nartworkSeries blijft staan — die zet je zelf om via de nieuwe artwork-picker.')

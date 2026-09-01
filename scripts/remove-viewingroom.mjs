/**
 * Het `viewingRoom`-type opruimen.
 *
 * Dit was de eerste opzet voor een deelbare selectie. Vervangen door
 * `privateSale` — in de Studio "Price Lists". Het schema is weg; dit ruimt de
 * achtergebleven documenten op, want een document van een type dat niet meer
 * bestaat blijft in de dataset staan en duikt op in zoekresultaten.
 *
 * Er komt eerst een backup naast te staan.
 *
 *   DRY=1 node scripts/remove-viewingroom.mjs
 *         node scripts/remove-viewingroom.mjs
 */

import { createClient } from '@sanity/client'
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

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
  // Ook de concepten.
}).withConfig({ perspective: 'raw' })

const docs = await client.fetch(`*[_type == "viewingRoom"]`)

if (docs.length === 0) {
  console.log('Geen viewingRoom-documenten — al opgeruimd.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-viewingrooms-${stamp}.json`, JSON.stringify(docs, null, 2))
console.log(`Backup: backup-viewingrooms-${stamp}.json\n`)

for (const d of docs) {
  // Verwijst er nog iets naar? Dan eerst kijken, niet blind weggooien.
  const refs = await client.fetch(`*[references($id)]{ _id, _type }`, { id: d._id })
  console.log(`  ${d._id.padEnd(44)} "${d.title ?? '—'}"  verwijzingen: ${refs.length}`)
  if (refs.length > 0) {
    console.log(`    LET OP: ${refs.map((r) => `${r._type}/${r._id}`).join(', ')}`)
    console.log('    Overgeslagen — ruim die verwijzing eerst op.')
    continue
  }
  if (!DRY) await client.delete(d._id)
}

if (DRY) {
  console.log('\nDRY run — er is niets verwijderd.')
} else {
  const left = await client.fetch(`count(*[_type == "viewingRoom"])`)
  console.log(`\nKlaar. ${left} viewingRoom-document(en) over.`)
}

/**
 * `zine` → `publication`.
 *
 * Een zine is geen eigen soort ding: het is een publicatie met de categorie
 * 'Zine', naast Book, Poster en Bag. Het documenttype heette hier nog `zine`
 * uit de tijd dat er alleen zines waren, terwijl het in de Studio al
 * "Publication" heette. Deze migratie maakt de naam gelijk aan wat het is —
 * en aan `publication` in de gallery-template.
 *
 * Sanity laat `_type` niet muteren. Verwijderen en opnieuw aanmaken met
 * hetzelfde `_id` is de enige weg. Twee losse awaits, niet één transactie:
 * in dezelfde transactie ziet Sanity het als één document dat van type
 * verandert, en weigert het.
 *
 * Het `_id` blijft gelijk, dus verwijzingen vanuit projectSeries blijven staan.
 *
 *   DRY=1 node scripts/migrate-zine-to-publication.mjs   # tonen
 *         node scripts/migrate-zine-to-publication.mjs   # uitvoeren
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
})

// Ook concepten: laat je die staan, dan houdt Sanity een drafts.<id> van een
// type dat niet meer bestaat, en klapt de Studio op dat document.
const docs = await client.fetch(`*[_type == "zine"] | order(_id asc)`)

if (docs.length === 0) {
  console.log('Geen zine-documenten meer — al gemigreerd.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = `backup-zine-to-publication-${stamp}.json`
writeFileSync(backup, JSON.stringify(docs, null, 2))
console.log(`Backup: ${backup}`)
console.log(`${docs.length} document(en)\n`)

for (const doc of docs) {
  const label = `${doc.number ? doc.number + ' ' : ''}${doc.title ?? doc._id}`
  console.log(`  ${doc._id.padEnd(40)} ${label}`)
  if (DRY) continue

  // Velden die Sanity zelf beheert gaan niet mee terug naar binnen.
  const { _rev, _createdAt, _updatedAt, _type, ...rest } = doc

  // Losse awaits: `_type` is immutable, dus dit moet echt weg-en-opnieuw zijn.
  await client.delete(doc._id)
  await client.create({ ...rest, _id: doc._id, _type: 'publication' })
}

if (DRY) {
  console.log('\nDRY run — er is niets gewijzigd.')
} else {
  const left = await client.fetch(`count(*[_type == "zine"])`)
  const made = await client.fetch(`count(*[_type == "publication"])`)
  console.log(`\nKlaar. ${made} publicaties, ${left} zines over.`)
  if (left > 0) console.error('LET OP: er staan nog zine-documenten. Draai het script nog eens.')
}

/**
 * `location`: notes → note, en `since` naar het werk.
 *
 * `since` stond op het locatiedocument met de omschrijving "date since which
 * this artwork is at this location" — op een document dat door tientallen
 * werken gedeeld wordt. Vijftig werken in dezelfde opslag zouden dan één
 * ontvangstdatum delen. De datum verhuist naar `artwork.locationSince`, per
 * werk dat naar die plek verwijst.
 *
 * `notes` heet nu `note`, zoals in de gallery-template.
 *
 *   DRY=1 node scripts/migrate-location-fields.mjs
 *         node scripts/migrate-location-fields.mjs
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
  // Ook de concepten, anders blijft daar een veld staan dat het schema niet
  // meer kent.
}).withConfig({ perspective: 'raw' })

const locs = await client.fetch(
  `*[_type == "location" && (defined(notes) || defined(since))]{ _id, name, notes, note, since }`
)

if (locs.length === 0) {
  console.log('Niets te migreren.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-locations-${stamp}.json`, JSON.stringify(locs, null, 2))
console.log(`Backup: backup-locations-${stamp}.json\n`)

let renamed = 0
let moved = 0

for (const l of locs) {
  const label = l.name ?? l._id

  if (typeof l.notes === 'string' && l.notes && !l.note) {
    console.log(`${label}: notes → note`)
    if (!DRY) await client.patch(l._id).set({ note: l.notes }).commit()
    renamed++
  }
  if (l.notes !== undefined && !DRY) await client.patch(l._id).unset(['notes']).commit()

  if (l.since) {
    // Naar élk werk dat hier ligt en nog geen eigen datum heeft.
    const works = await client.fetch(
      `*[_type == "artwork" && currentLocation._ref == $id && !defined(locationSince)]{ _id, title }`,
      { id: l._id.replace(/^drafts\./, '') }
    )
    for (const w of works) {
      console.log(`${label}: since ${l.since} → "${w.title ?? w._id}"`)
      if (!DRY) await client.patch(w._id).set({ locationSince: l.since }).commit()
      moved++
    }
    if (works.length === 0) console.log(`${label}: since ${l.since} — geen werken op deze plek, vervalt`)
    if (!DRY) await client.patch(l._id).unset(['since']).commit()
  }
}

console.log(
  `\n${DRY ? 'DRY run — er is niets gewijzigd.' : 'Klaar.'}` +
  `\n  ${renamed} × notes → note` +
  `\n  ${moved} × since → artwork.locationSince`
)

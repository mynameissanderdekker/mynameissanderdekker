/**
 * `artFair`: name + fair → title, en notes → description.
 *
 * De beurs had twee tekstvelden: `name` met het **project** ("The Social Media
 * Project") en `fair` met de **beurs** ("Unseen", "PAN", "KunstRAI"). Het
 * project staat al in `cvProject` — in negen van de tien gevallen was `name`
 * daar een letterlijke kopie van. De titel wordt dus de beurs, zoals `title`
 * op de expositie en in de gallery-template.
 *
 * `notes` was een kaal tekstveld en wordt `description` met opmaak, ook als op
 * de expositie. Bij geen enkele beurs is het gevuld, dus er valt niets om te
 * zetten — het veld wordt alleen opgeruimd.
 *
 * `name` verdwijnt niet zomaar: staat er iets anders in dan het project, dan
 * blijft dat behouden achter de beursnaam. Bij "Innate Curiosity — NAP+ 2026"
 * hoeft dat niet, want de beurs staat er al in.
 *
 *   DRY=1 node scripts/migrate-artfair-title.mjs
 *         node scripts/migrate-artfair-title.mjs
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
  // Ook de concepten: laat je die staan, dan houden ze een verplicht `title`
  // dat leeg is en klapt de Studio op dat document.
}).withConfig({ perspective: 'raw' })

const fairs = await client.fetch(
  `*[_type == "artFair" && (defined(name) || defined(fair) || defined(notes))]
     | order(startDate asc){ _id, name, fair, title, notes, startDate, "project": cvProject->title }`
)

if (fairs.length === 0) {
  console.log('Niets te migreren.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-artfairs-${stamp}.json`, JSON.stringify(fairs, null, 2))
console.log(`Backup: backup-artfairs-${stamp}.json`)
console.log(`${fairs.length} beurzen\n`)

let done = 0

for (const f of fairs) {
  // Al een titel? Dan niets overschrijven — dit script mag twee keer draaien.
  let title = f.title
  if (!title) {
    title = f.fair ?? f.name
    // Zei `name` iets méér dan het project, en staat de beurs er niet al in,
    // dan hoort dat erbij.
    const extra = f.name && f.name !== f.project && f.fair && !f.name.includes(f.fair)
      ? f.name
      : null
    if (extra) title = `${f.fair} — ${extra}`
  }

  const unset = []
  if (f.name !== undefined)  unset.push('name')
  if (f.fair !== undefined)  unset.push('fair')
  if (f.notes !== undefined) unset.push('notes')

  const jaar = f.startDate ? f.startDate.slice(0, 4) : '····'
  console.log(`  ${jaar}  ${String(f.name ?? '—').padEnd(30)} + ${String(f.fair ?? '—').padEnd(26)} →  ${title}`)

  if (!DRY) {
    let patch = client.patch(f._id)
    if (!f.title) patch = patch.set({ title })
    if (unset.length) patch = patch.unset(unset)
    await patch.commit()
  }
  done++
}

if (DRY) {
  console.log('\nDRY run — er is niets gewijzigd.')
} else {
  const left = await client.fetch(`count(*[_type == "artFair" && !defined(title)])`)
  console.log(`\nKlaar. ${done} bijgewerkt, ${left} zonder titel over.`)
}

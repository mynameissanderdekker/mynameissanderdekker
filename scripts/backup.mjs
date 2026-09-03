#!/usr/bin/env node
/**
 * Volledige back-up van de inhoud van dit Sanity-project.
 *
 * Waarom een eigen script en niet `sanity dataset export`: die vraagt de CLI
 * en een login, en dit moet ook draaien vanuit een sessie of een cron. Dit
 * script haalt élk document op — inclusief concepten — en schrijft ze weg als
 * NDJSON: één document per regel, precies het formaat dat
 * `sanity dataset import` weer inleest.
 *
 *   node --env-file=.env.local scripts/backup.mjs
 *   node --env-file=.env.local scripts/backup.mjs --dir ~/backups
 *
 * Terugzetten (voorzichtig, dit overschrijft):
 *   npx sanity dataset import <bestand>.ndjson production --replace
 *
 * **Wat hier NIET in zit: de afbeeldingen zelf.** Documenten verwijzen naar
 * assets op Sanity's CDN; die blijven daar staan en gaan niet mee in dit
 * bestand. Voor een echte ramp-back-up (project kwijt) heb je daarnaast
 * `sanity dataset export` nodig, dat de bestanden meeneemt. Voor het
 * dagelijkse risico — een script dat te veel wist, een verkeerde migratie —
 * is dit precies wat je nodig hebt.
 */

import { createClient } from '@sanity/client'
import { createWriteStream, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, basename } from 'node:path'

const args = process.argv.slice(2)
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null
const DIR = (dirArg ?? join(homedir(), 'backups', 'gingerbeard')).replace(/^~/, homedir())
mkdirSync(DIR, { recursive: true })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN
if (!projectId || !token) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID en een schrijftoken zijn nodig (staan in .env.local).')
  process.exit(1)
}

// `raw` zodat concepten meekomen: die bevatten werk dat nog niet gepubliceerd
// is, en dat wil je in een back-up net zo goed hebben.
const client = createClient({ projectId, dataset, apiVersion: '2026-06-18', token, useCdn: false })
  .withConfig({ perspective: 'raw' })

const stempel = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const naam = `${basename(process.cwd())}-${dataset}-${stempel}.ndjson`
const pad = join(DIR, naam)

// In blokken ophalen: één query over 5000 documenten loopt tegen limieten aan.
// Sorteren op _id en telkens verder vanaf het laatste id — stabiel, ook als er
// tijdens de back-up iets verandert.
const out = createWriteStream(pad, { encoding: 'utf8' })
let laatste = ''
let n = 0
const perTyp = {}

for (;;) {
  const batch = await client.fetch(
    `*[_id > $na] | order(_id asc) [0...1000]`,
    { na: laatste }
  )
  if (!batch.length) break
  for (const doc of batch) {
    out.write(JSON.stringify(doc) + '\n')
    perTyp[doc._type] = (perTyp[doc._type] ?? 0) + 1
    n++
  }
  laatste = batch[batch.length - 1]._id
  process.stdout.write(`\r  ${n} documenten…`)
}
await new Promise((r) => out.end(r))

const { size } = await import('node:fs').then((fs) => fs.promises.stat(pad))
console.log(`\r  ${n} documenten, ${(size / 1024 / 1024).toFixed(1)} MB`)
console.log(`  → ${pad}\n`)
for (const [t, c] of Object.entries(perTyp).sort((a, b) => b[1] - a[1])) {
  console.log(`     ${String(c).padStart(5)}  ${t}`)
}
console.log('\nLet op: afbeeldingen zitten hier niet in — die staan op Sanity.')
console.log('Terugzetten:  npx sanity dataset import "' + pad + '" ' + dataset + ' --replace')

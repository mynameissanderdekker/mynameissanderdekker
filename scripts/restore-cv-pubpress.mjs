/**
 * Restores the pubPressColumns field on the cvPage document.
 * Run with: node scripts/restore-cv-pubpress.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

function id() {
  return Math.random().toString(36).slice(2, 10)
}

function item(text, url) {
  return { _type: 'pubPressItem', _key: id(), text, ...(url ? { url } : {}) }
}

function group(groupTitle, items) {
  return { _type: 'pubPressGroup', _key: id(), groupTitle, items }
}

function column(columnTitle, groups) {
  return { _type: 'pubPressColumn', _key: id(), columnTitle, groups }
}

const pubPressColumns = [
  column('SELF-PUBLISHED BOOKS', [
    group('The Zine Project (2021–2025)', [
      item('Zine Nº10 — TenFifteen'),
      item('Zine Nº9 — A.S.I.A.'),
      item('Zine Nº8 — The Warsaw SAGA'),
      item('Zine Nº7 — 12.5Y Sander Dekker'),
      item('Zine Nº6 — Claudia'),
      item('Zine Nº5 — Mexico'),
      item('Zine Nº4 — Cats & Dogs'),
      item('Zine Nº3 — Janna'),
      item('Zine Nº2 — Girls in Paris'),
      item('Zine Nº1 — Annemarijn'),
      item('ISBN 9789082111347'),
    ]),
    group('My Name Is Sander Dekker', [
      item('Volume 2 — ISBN 9789082111330'),
      item('Volume 1.5 — ISBN 9789082111323'),
      item('Volume 1 — ISBN 9789082111316'),
    ]),
  ]),
  column('PRESS, PUBLICATIONS & MEDIA (SELECTION)', [
    group('National newspapers (NL)', [
      item('Het Parool (29-06-2018, 15-06-2018, 17-12-2016, 05-12-2014)'),
      item('De Volkskrant (30-11-2019, 07-11-2015)'),
    ]),
    group('Magazines & cultural platforms', [
      item('BLINK Korea'),
      item('CODE Magazine'),
      item('Juxtapoz'),
      item('Le Petit Voyeur'),
      item('Lodown Magazine'),
      item('Purple France'),
      item('Snoecks'),
      item('VICE Creators'),
      item('VICE Magazine'),
    ]),
    group('Art platforms & indexes', [
      item('Gallery Viewer (2023, 2025)'),
    ]),
    group('Video & broadcast', [
      item('ABC Video'),
    ]),
  ]),
]

async function main() {
  console.log('Restoring pubPressColumns to cvPage...')
  await client
    .patch('cvPage')
    .set({ pubPressColumns })
    .commit()
  console.log('Done.')
}

main().catch(console.error)

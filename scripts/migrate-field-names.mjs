/**
 * Veldnamen gelijktrekken met de gallery-template.
 *
 * Dezelfde betekenis hoorde overal dezelfde naam te hebben; zolang dat niet zo
 * is, kun je geen code delen tussen de twee templates.
 *
 *   showInWebshop     → availableInShop        (artwork + zine)
 *   framedDimensions  → roomImageWidth         (object {widthCm} → kaal getal)
 *   featured          → shopFeatured           (artwork + zine)
 *   order             → shopOrder              (alleen artwork)
 *
 * `order` blijft staan op zine, project, projectSeries, worksSection en
 * artworkFilter: daar betekent het hetzelfde maar hoort het niet bij de shop.
 * Alleen het artwork-veld krijgt de shop-naam.
 *
 *   DRY=1 node scripts/migrate-field-names.mjs
 *         node scripts/migrate-field-names.mjs
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

const docs = await client.fetch(
  `*[_type in ["artwork", "zine"] &&
     (defined(showInWebshop) || defined(framedDimensions) || defined(featured)
      || (_type == "artwork" && defined(order)))]{
    _id, _type, title,
    showInWebshop, availableInShop,
    framedDimensions, roomImageWidth,
    featured, shopFeatured,
    order, shopOrder
  }`
)

if (docs.length === 0) {
  console.log('Niets te migreren.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-fieldnames-${stamp}.json`, JSON.stringify(docs, null, 2))
console.log(`Backup: backup-fieldnames-${stamp}.json`)
console.log(`${docs.length} document(en)\n`)

let shop = 0
let width = 0
let feat = 0
let ord = 0

for (const d of docs) {
  const set = {}
  const unset = []

  // Niets overschrijven wat al is ingevuld: draai je dit twee keer, dan mag een
  // handmatige correctie niet alsnog worden platgeschreven.
  if (typeof d.showInWebshop === 'boolean' && typeof d.availableInShop !== 'boolean') {
    set.availableInShop = d.showInWebshop
    shop++
  }
  if (d.showInWebshop !== undefined && d.showInWebshop !== null) unset.push('showInWebshop')

  const w = d.framedDimensions?.widthCm
  if (typeof w === 'number' && typeof d.roomImageWidth !== 'number') {
    set.roomImageWidth = w
    width++
  }
  if (d.framedDimensions !== undefined && d.framedDimensions !== null) unset.push('framedDimensions')

  if (typeof d.featured === 'boolean' && typeof d.shopFeatured !== 'boolean') {
    set.shopFeatured = d.featured
    feat++
  }
  if (d.featured !== undefined && d.featured !== null) unset.push('featured')

  // Alleen op artwork: op zine en de paginatypes betekent `order` hetzelfde
  // maar hoort het niet bij de shop, dus daar blijft de naam staan.
  if (d._type === 'artwork') {
    if (typeof d.order === 'number' && typeof d.shopOrder !== 'number') {
      set.shopOrder = d.order
      ord++
    }
    if (d.order !== undefined && d.order !== null) unset.push('order')
  }

  if (Object.keys(set).length === 0 && unset.length === 0) continue

  const parts = Object.entries(set).map(([k, v]) => `${k}=${v}`)
  console.log(`${d._type}: ${d.title ?? d._id}  ${parts.join('  ') || '(alleen opruimen)'}`)

  if (!DRY) {
    let patch = client.patch(d._id)
    if (Object.keys(set).length) patch = patch.set(set)
    if (unset.length) patch = patch.unset(unset)
    await patch.commit()
  }
}

console.log(
  `\n${DRY ? 'DRY run — er is niets gewijzigd.' : 'Klaar.'}` +
    `\n  ${shop} × showInWebshop → availableInShop` +
    `\n  ${width} × framedDimensions.widthCm → roomImageWidth` +
    `\n  ${feat} × featured → shopFeatured` +
    `\n  ${ord} × order → shopOrder (alleen artwork)`
)

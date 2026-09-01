/**
 * Zet de velden van `artwork` in de volgorde waarin je een werk invult.
 *
 * Dit is geen migratie — het herschikt alleen de schemadefinitie, zodat het
 * formulier in beide templates dezelfde route volgt: eerst wat je weet als het
 * werk voor je staat, dan hoe je het toont, dan hoe je het verkoopt.
 *
 * Werkt op blokniveau met accolade-telling, niet met zoek-en-vervang: een veld
 * kan een `hidden`-functie of een geneste `fields`-array bevatten, en die mag je
 * niet halverwege doorknippen.
 *
 *   node scripts/reorder-artwork-fields.mjs
 *   node scripts/reorder-artwork-fields.mjs --check   # alleen tonen
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHECK = process.argv.includes('--check')

/** De gedeelde volgorde. Velden die hier niet in staan houden hun plek, achteraan. */
export const ORDER = [
  // ── Wat het werk is ──
  'artist', 'title', 'year', 'medium', 'slug',
  // ── Maten ── (Torch heeft losse velden, de artist-template één object)
  'dimensions', 'widthCm', 'heightCm', 'depthCm', 'dimensionsExclFrame',
  'weightKg', 'dimensionNotes',
  // ── Soort en oplage ──
  'category', 'publicationCategory',
  'editionType', 'editionTotal', 'editionAP', 'editionNumber',
  // ── Beeld en prijs ──
  'images', 'priceIncVat', 'vatRate', 'priceExclVAT', 'description',
  // ── Beschikbaarheid ──
  'status', 'reservation', 'reservedFor', 'reservedUntil', 'reservedNote',
  'showOnArtistPage',
  // ── Aan de muur ──
  'showViewOnWall', 'roomImage', 'roomImageWidth',
  // ── Documenten ──
  'coaPanel', 'qrCode',
  // ── Waar het is ──
  'storageCode', 'publicationCode', 'shownIn', 'exhibitions', 'artFairs',
  'currentLocation', 'locationSince', 'locationNote',
  'trackValue', 'insuranceValue', 'commissionPct', 'provenance',
  'additionalStatusInfo', 'buyers',
  // ── Publicatie-eigenschappen ──
  'isPublication', 'isbn', 'pageCount', 'publisher',
  // ── Webshop ──
  'availableInShop', 'shopFeatured', 'onSale', 'salePrice', 'stock',
  'shippingNote', 'shippingClass', 'shopOrder', 'shopVariants', 'options',
  // ── Sync ──
  'syncBadge', 'torchId', 'torchSoldCount', 'mnsdkSoldCount',
]

/** Knipt de velden-array in blokken, met accolade-telling zodat niets breekt. */
export function splitFields(src, startIdx, endIdx) {
  const blocks = []
  let i = startIdx
  while (i < endIdx) {
    // Naar het begin van het volgende blok
    while (i < endIdx && !/[{]/.test(src[i])) i++
    if (i >= endIdx) break
    // Terug naar het begin van de regel, inclusief eventueel 'defineField('
    let lineStart = src.lastIndexOf('\n', i) + 1
    let blockStart = lineStart
    // Voorafgaand commentaar meenemen
    for (;;) {
      const prevEnd = blockStart - 1
      const prevStart = src.lastIndexOf('\n', prevEnd - 1) + 1
      const prevLine = src.slice(prevStart, prevEnd)
      if (/^\s*\/\//.test(prevLine)) blockStart = prevStart
      else break
    }
    let depth = 0
    let j = i
    for (; j < endIdx; j++) {
      const c = src[j]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) break
      }
    }
    // Voorbij de sluitende accolade: ')' bij defineField, dan de komma
    let k = j + 1
    while (k < endIdx && /[)\s,]/.test(src[k])) {
      if (src[k] === ',') { k++; break }
      k++
    }
    const text = src.slice(blockStart, k)
    const m = text.match(/name:\s*'(\w+)'/)
    blocks.push({ name: m ? m[1] : null, text })
    i = k
  }
  return blocks
}

export function reorder(blocks) {
  const rank = new Map(ORDER.map((n, idx) => [n, idx]))
  return [...blocks].sort((a, b) => {
    const ra = rank.has(a.name) ? rank.get(a.name) : 1000 + blocks.indexOf(a)
    const rb = rank.has(b.name) ? rank.get(b.name) : 1000 + blocks.indexOf(b)
    return ra - rb
  })
}

// ── Artist template ──────────────────────────────────────────────────────────
const file = join(__dirname, '..', 'src', 'sanity', 'schemas', 'artwork.ts')
const src = readFileSync(file, 'utf8')

const typeStart = 0
const fieldsKey = src.indexOf('\n  fields: [', typeStart)
const start = src.indexOf('[', fieldsKey) + 1

// Einde van de velden-array: tel accolades én blokhaken vanaf `start`
let depth = 1
let end = start
for (; end < src.length; end++) {
  const c = src[end]
  if (c === '[') depth++
  else if (c === ']') { depth--; if (depth === 0) break }
}

const blocks = splitFields(src, start, end).filter((b) => b.text.trim())
const known = blocks.filter((b) => b.name).length
console.log(`${blocks.length} blokken gevonden, ${known} met een naam`)

const sorted = reorder(blocks)
const changed = sorted.filter((b, i) => b !== blocks[i]).length
console.log(`${changed} blokken verplaatst`)

if (CHECK) {
  console.log('\nNieuwe volgorde:')
  for (const b of sorted) console.log('  ', b.name ?? '(naamloos)')
  process.exit(0)
}

const body = '\n' + sorted.map((b) => b.text.replace(/^\n+|\s+$/g, '')).join('\n') + '\n  '
const out = src.slice(0, start) + body + src.slice(end)

// Veiligheidscontrole: geen enkel veld mag verdwijnen
for (const b of blocks) {
  if (b.name && !out.includes(`name: '${b.name}'`)) {
    console.error(`AFGEBROKEN: ${b.name} is verdwenen — er is niets weggeschreven`)
    process.exit(1)
  }
}

writeFileSync(file, out)
console.log('Geschreven.')

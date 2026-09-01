/**
 * patch-edition-numbers.mjs
 *
 * Reads Sheet1-Tabel 1.csv and for every artwork:
 *   1. Sets editionTotal + editionAP:2 on the Sanity artwork document
 *   2. For each named sale row: updates copyNumber + sale notes on the
 *      matching contact's purchase record (or adds it if missing)
 *
 * Run: node scripts/patch-edition-numbers.mjs
 * Dry: node scripts/patch-edition-numbers.mjs --dry-run
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const DRY = process.argv.includes('--dry-run')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// ── Normalizer ────────────────────────────────────────────────────────────────
function norm(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[‘’‚‛′]/g, '')          // curly/smart apostrophes
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip diacritics
    .replace(/['''".,!?#&\-_/()]/g, '') // punctuation incl. slash + parens
    .replace(/\s+/g, ' ')
    .trim()
}

// CSV name → normalized canonical name (must match a Sanity contact name)
const ALIASES = {
  // Strayfield
  'strayfiled gallery':               'strayfield gallery',
  'strayfield':                       'strayfield gallery',
  'strayfield gallery':               'strayfield gallery',
  // Hotel Not Hotel
  'hnh':                              'hotel not hotel',
  'hnh vrouw':                        'hotel not hotel',
  'hotel not hotel vrouw':            'hotel not hotel',
  'to hnh':                           'hotel not hotel',
  'bruno hnh':                        'hotel not hotel',
  'bruno   hnh':                      'hotel not hotel',
  // Walls clients (anonymous buyers via Walls Gallery)
  'walls customer':                   'walls client',
  'walls':                            'walls client',
  'walls gallery':                    'walls client',
  'walls g t s customer':             'walls client',
  'walls customer spanje':            'walls client',
  'customer brix':                    'walls client',  // Brix café anonymous
  // Bernd Roloff
  'bernd roloff germany':             'bernd roloff',
  'bernd roloff':                     'bernd roloff',
  // Duncan Leica
  'ducan leica':                      'duncan leica',
  // G&T's
  'g t s tanya':                      'tanya gt',
  'g t s george':                     'george gt',
  // Pim
  'pim brix':                         'pim brix',
  'pim   brix':                       'pim brix',
  'pim   brix ':                      'pim brix',
  // Majke
  'majke huisstege':                  'majke husstege',
  'majke hüsstege':                   'majke husstege',
  // Marjolein
  'marjolein berghs   hendrix':       'marjolein berghs hendrix',
  'marjolein berghs   hendrix ':      'marjolein berghs hendrix',
  'marjolein hendrix':                'marjolein berghs hendrix',
  // Rob via Jody
  'rob van jody verver':              'rob via jody',
  'rob  van jody verver ':            'rob via jody',
  // Kristian Hornsleth (typo in CSV)
  'kristian hornslet':                'kristian hornsleth',
  'kristian hornsleth':               'kristian hornsleth',
  'kristian hornslett':               'kristian hornsleth',
  // Branko
  'branko':                           'branko van kooten',
  // Jody
  'jody':                             'jody verver',
  'klant mo':                         'mo gallery',
  // Emma Ruimschotel
  'emma ruimschotel this art fair':   'emma ruimschotel',
  // Kurt Gaugler
  'kurt gaugler via brix':            'kurt gaugler',
  // Job Staal
  'job staal volkshotel':             'job staal',
  // My mom / Ouders = Anneke Dekker
  'my mom':                           'anneke dekker',
  'ouders':                           'anneke dekker',
  'parents':                          'anneke dekker',
  // Roy Sapuletej (trailing space in CSV)
  'roy sapuletej ':                   'roy sapuletej',
  // Serato ADE
  'serato ade':                       'serato ade',
  // Misc
  'patty morgan':                     'patty morgan',
  'super stories':                    'super stories',
  'red cross':                        'rode kruis veiling',
  'rode kruis voor veiling':          'rode kruis veiling',
  'nvcs konigs':                      'nvcs konigs',
  'fransie':                          'fransie',
  'joris el jefe':                    'joris el jefe',
  'la vie est une fleur customer':    null, // skip
  'aan wie ook al weer':              null, // skip — unknown
  'customer this art fair':           null, // skip — anonymous
  'customer':                         null, // skip
  'gift mo':                          null, // skip
}

// Customer names that are anonymous / venues — skip purchase patches for these
const SKIP_CUSTOMERS = new Set([
  '', 'walls customer', 'walls gallery', 'walls/g&t s customer',
  'brix customer', 'aaf customer', 'ouders', 'parents',
  'webshop', 'x', 'torch gallery', 'sander', 'sander dekker',
  'josilda da conceicao', 'via marloes', 'marloes',
])

// ── Parse CSV ─────────────────────────────────────────────────────────────────
// Returns array of { title, editionTotal, sales: [{num, status, size, material, price, customer, soldBy, date, channel}] }

function parseCsv(path) {
  const text = readFileSync(path, 'utf8')
  // Collapse quoted multi-line cells (titles that span lines)
  const normalised = text.replace(/"([^"]*)"/gs, (_, inner) => inner.replace(/\n/g, ' ').trim())
  const lines = normalised.split('\n')

  const artworks = []
  let current = null

  for (const raw of lines) {
    const cols = raw.split(';').map(c => c.trim())
    const col1 = cols[1] ?? ''
    const col2 = cols[2] ?? ''

    // Artwork title row: col1 has "(Editie N)" in it, col2 is empty/header
    const titleMatch = col1.match(/^(.+?)\s*\(Editie\s*(\d+)\)/i)
    if (titleMatch) {
      current = {
        title: titleMatch[1].trim(),
        editionTotal: parseInt(titleMatch[2], 10),
        sales: [],
      }
      artworks.push(current)
      continue
    }

    // Sale row: col1 is empty, col2 is a number (or "N AP")
    if (!current) continue
    const numMatch = col2.match(/^(\d+(?:-\d+)?)\s*(AP)?$/i)
    if (!numMatch) continue
    const isAP = !!numMatch[2]
    const num  = numMatch[1]

    const status   = cols[3] ?? ''
    const size     = cols[4] ?? ''
    const material = cols[5] ?? ''
    const price    = cols[6] ?? ''
    const customer = cols[8] ?? ''
    const soldBy   = cols[9] ?? ''
    const date     = cols[10] ?? ''
    const channel  = cols[11] ?? ''

    // Skip rows with no customer or status
    if (!customer && !status) continue

    current.sales.push({ num, isAP, status, size, material, price, customer, soldBy, date, channel })
  }

  return artworks.filter(a => a.title) // drop nameless (Editie 10) rows
}

// ── Load Sanity data ──────────────────────────────────────────────────────────

async function loadSanity() {
  const [artworks, contacts] = await Promise.all([
    client.fetch(`*[_type == "artwork"]{ _id, title, "slug": slug.current, editionTotal, editionAP }`),
    client.fetch(`*[_type == "contact"]{ _id, firstName, lastName, company, name, purchases }`),
  ])

  // title/slug → artwork
  const awBySlug  = new Map(artworks.map(a => [a.slug, a]))
  const awByNorm  = new Map(artworks.map(a => [norm(a.title), a]))

  // name → contact (prefer company name, fall back to full name)
  const ctByNorm  = new Map()
  for (const c of contacts) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ')
    const keys = [c.name, c.company, fullName].filter(Boolean)
    for (const k of keys) {
      const n = norm(k)
      if (n && !ctByNorm.has(n)) ctByNorm.set(n, c)
    }
  }

  return { awBySlug, awByNorm, ctByNorm, contacts }
}

// CSV title → canonical Sanity title (for titles that don't match after normalization)
const ARTWORK_ALIASES = {
  'rabit hole':                    'rabbit hole',
  'sorry we re dead':              'sorry we re dead',   // curly quote → space, matches after norm
  'it s a wrap':                   'its a wrap',
  'i m just creating':             'im just creating',
  'i m just creating':             'im just creating',
  'the jungle':                    'the jungle',
  'catching popcorn':              'catching popcorn',
}

function findArtwork(awByNorm, csvTitle) {
  const n = norm(csvTitle)

  // Apply alias
  const aliased = ARTWORK_ALIASES[n] ?? n
  if (awByNorm.has(aliased)) return awByNorm.get(aliased)
  if (awByNorm.has(n)) return awByNorm.get(n)

  // Partial/prefix match
  for (const [k, v] of awByNorm) {
    if (k.startsWith(n) || n.startsWith(k)) return v
  }
  // Substring match (CSV title contained within Sanity title, e.g. "Day at the museum")
  for (const [k, v] of awByNorm) {
    if (k.includes(n) || n.includes(k)) return v
  }
  return null
}

function findContact(ctByNorm, csvCustomer) {
  const n = norm(csvCustomer)
  if (SKIP_CUSTOMERS.has(n)) return null
  if (ctByNorm.has(n)) return ctByNorm.get(n)
  // Partial / word-overlap match
  const words = n.split(' ').filter(w => w.length > 2)
  for (const [k, v] of ctByNorm) {
    if (words.length > 0 && words.every(w => k.includes(w))) return v
  }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function ensureBaseContacts() {
  // Create placeholder contacts that collect anonymous-but-grouped buyers
  const base = [
    { _id: 'contact-hist-walls-client',   firstName: 'Walls',    lastName: 'Client',    notes: 'Anonymous buyer(s) via Walls Gallery / Brix' },
    { _id: 'contact-hist-rode-kruis-veiling', firstName: 'Rode Kruis', lastName: 'Veiling', notes: 'Red Cross charity auction donation' },
    { _id: 'contact-hist-joris-el-jefe',  firstName: 'Joris',    lastName: '(El Jefe)', notes: '' },
    { _id: 'contact-hist-fransie',        firstName: 'Fransie',  lastName: '',          notes: '' },
    { _id: 'contact-hist-mo-gallery',     firstName: 'Mo',       lastName: 'Gallery',   notes: '' },
    { _id: 'contact-hist-serato-ade',     firstName: 'Serato',   lastName: 'ADE',       notes: 'ADE 2015 purchase' },
    { _id: 'contact-hist-kurt-gaugler',   firstName: 'Kurt',     lastName: 'Gaugler',   notes: 'via Brix / Bright Side' },
  ]
  for (const c of base) {
    await client.createIfNotExists({ _type: 'contact', ...c })
  }
}

async function main() {
  console.log(`=== patch-edition-numbers.mjs ${DRY ? '[DRY RUN]' : ''} ===\n`)
  if (!DRY) await ensureBaseContacts()

  const csvPath = resolve(__dir, '../Uploads/../uploads', 'Sheet1-Tabel 1.csv')
  // Try a few locations
  let csvData
  for (const p of [
    resolve(__dir, '../uploads/Sheet1-Tabel 1.csv'),
    resolve(__dir, '../../uploads/Sheet1-Tabel 1.csv'),
    // Also check next to the script
    resolve(__dir, 'Sheet1-Tabel 1.csv'),
  ]) {
    try { csvData = parseCsv(p); console.log(`CSV: ${p}\n`); break } catch {}
  }
  if (!csvData) { console.error('CSV not found — copy Sheet1-Tabel 1.csv next to this script or into uploads/'); process.exit(1) }

  console.log(`Parsed ${csvData.length} artworks from CSV\n`)

  const { awByNorm, ctByNorm } = await loadSanity()
  // Mutable contact purchases cache
  const contactCache = new Map()
  const allContacts = await client.fetch(`*[_type == "contact"]{ _id, firstName, lastName, company, name, purchases }`)
  for (const c of allContacts) contactCache.set(c._id, c)

  // Rebuild ctByNorm pointing into contactCache
  const ctMap = new Map()
  for (const c of allContacts) {
    const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ')
    const keys = [c.name, c.company, fullName].filter(Boolean)
    for (const k of keys) {
      const n = norm(k)
      if (n && !ctMap.has(n)) ctMap.set(n, c._id)
    }
  }

  let awPatched = 0, awMiss = 0
  let pUpdated = 0, pAdded = 0, pMiss = 0, pSkip = 0

  for (const { title, editionTotal, sales } of csvData) {
    const aw = findArtwork(awByNorm, title)
    if (!aw) {
      console.log(`⚠️  Artwork not found: "${title}"`)
      awMiss++; continue
    }

    // 1. Patch editionTotal + editionAP on artwork
    if (!DRY) {
      await client.patch(aw._id).set({ editionTotal, editionAP: 2 }).commit()
    }
    awPatched++

    // 2. Patch purchases for each named sale
    for (const sale of sales) {
      const { num, isAP, status, size, material, price, customer, soldBy, date, channel } = sale
      if (!customer) { pSkip++; continue }
      if (SKIP_CUSTOMERS.has(norm(customer))) { pSkip++; continue }

      // Build copy number string
      const copyNum = isAP
        ? `${num}AP/${editionTotal}+2AP`
        : `${num}/${editionTotal}${editionTotal <= 10 ? '+2AP' : ''}`

      // Build notes string
      const noteParts = [size, material, price && price !== '€0,00' ? price : '', date, channel].filter(Boolean)
      const notes = noteParts.join(' · ')

      // Find contact
      const contactId = findContactId(ctMap, customer)
      if (!contactId) {
        console.log(`  ⚠️  Contact not matched: "${customer}" (${title} #${num})`)
        pMiss++; continue
      }

      const contact = contactCache.get(contactId)
      const existing = contact.purchases ?? []
      const matching = existing.filter(p => p.artwork?._ref === aw._id)

      if (matching.length === 0) {
        // Add missing purchase
        console.log(`  ➕  Add purchase: ${customer} → ${title} #${num}`)
        const newPurchase = {
          _type: 'purchase',
          _key: `p-${aw._id.slice(-6)}-${num.replace(/\s/g,'')}`,
          artwork: { _type: 'reference', _ref: aw._id },
          copyNumber: copyNum,
          notes,
        }
        const updated = [...existing, newPurchase]
        if (!DRY) {
          await client.patch(contactId).set({ purchases: updated }).commit()
          contactCache.set(contactId, { ...contact, purchases: updated })
        }
        pAdded++
      } else {
        // Update existing (prefer one without copyNumber set)
        const target = matching.find(p => !p.copyNumber || p.copyNumber === '?') ?? matching[0]
        const newCopy = (!target.copyNumber || target.copyNumber === '?') ? copyNum : target.copyNumber
        const notesMerged = target.notes?.includes(notes.slice(0, 12))
          ? target.notes
          : [target.notes, notes].filter(Boolean).join(' · ')

        if (newCopy === target.copyNumber && notesMerged === target.notes) continue // nothing to do

        const updatedPurchases = existing.map(p =>
          p._key === target._key ? { ...p, copyNumber: newCopy, notes: notesMerged } : p
        )
        if (!DRY) {
          await client.patch(contactId).set({ purchases: updatedPurchases }).commit()
          contactCache.set(contactId, { ...contact, purchases: updatedPurchases })
        }
        pUpdated++
      }
    }
  }

  console.log(`
Artworks:  ${awPatched} patched  (${awMiss} not found)
Purchases: ${pAdded} added · ${pUpdated} updated · ${pMiss} contact not matched · ${pSkip} skipped (anonymous)
${DRY ? '\n[DRY RUN — no changes written]' : ''}`)
}

function findContactId(ctMap, csvCustomer) {
  const n = norm(csvCustomer)
  if (SKIP_CUSTOMERS.has(n)) return null

  // Apply alias map first
  if (n in ALIASES) {
    const alias = ALIASES[n]
    if (alias === null) return null  // explicitly skipped
    const aliased = norm(alias)
    if (ctMap.has(aliased)) return ctMap.get(aliased)
  }

  // Direct match
  if (ctMap.has(n)) return ctMap.get(n)

  // Word-overlap fallback (min 2 words, each > 2 chars)
  const words = n.split(' ').filter(w => w.length > 2)
  if (words.length < 2) return null
  for (const [k, id] of ctMap) {
    if (words.every(w => k.includes(w))) return id
  }
  return null
}

main().catch(err => { console.error(err); process.exit(1) })

/**
 * import-purchases.mjs
 *
 * Koppelt WooCommerce bestellingen aan contacten in Sanity.
 * Matcht item-naam op artwork-titel, email op contact.
 *
 * Gebruik: node scripts/import-purchases.mjs
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const cols = []
  let current = '', inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = '' }
    else { current += ch }
  }
  cols.push(current.trim())
  return cols
}

// ── Artwork matching ──────────────────────────────────────────────────────────

// Persoonsnamen die als product voorkomen (verwijderde producten) — overslaan
const SKIP_ITEMS = new Set([
  'alexandre fisselier','fleur souverein','thomas parry','stefan meier',
  'jeroen botter','mark meijering','adis hromic','ryan merrett','ryan merrett 2',
  'vinhi','lansy siessie','maureen',
])

function normalize(str) {
  return str.toLowerCase()
    .replace(/nº/g, 'n')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

// Handmatige aliassen voor titels die afwijken
const ALIASES = {
  'limited edition: day at the museum (framed)': 'Special Edition: Day At The Museum',
  'limited edition: day at the museum':          'Special Edition: Day At The Museum',
  "limited edition print: 'lady of the manor' - print only": "Limited edition: Lady of the Manor",
  "limited edition print: 'lady of the manor'":              "Limited edition: Lady of the Manor",
  "limited edition: 'lady of the manor' - print only":      "Limited edition: Lady of the Manor",
  "limited edition: 'lady of the manor'":                   "Limited edition: Lady of the Manor",
  "limited edition: 'horsing around' - print only":         "Limited edition: Horsing Around",
  "limited edition: 'horsing around'":                      "Limited edition: Horsing Around",
  'my name is sander dekker 1 (#1)':  'My name is Sander Dekker Nº 1',
  'my name is sander dekker 1 (#2)':  'My name is Sander Dekker Nº 1',
  'my name is sander dekker 1 (#3)':  'My name is Sander Dekker Nº 1',
  'my name is sander dekker 1 (#4)':  'My name is Sander Dekker Nº 1',
  'my name is sander dekker nº 1':    'My name is Sander Dekker Nº 1',
  'tenfifteen wallpaper - wd-70600-01 + 02 (2 different rolls)': 'TenFifteen Wallpaper',
  'tenfifteen wallpaper - wd-70600-01':                           'TenFifteen Wallpaper',
  'tenfifteen wallpaper':                                         'TenFifteen Wallpaper',
}

function matchArtwork(itemName, artworks) {
  const itemNorm = normalize(itemName)

  // Skip persoonsnamen
  if (SKIP_ITEMS.has(itemName.toLowerCase().trim())) return null

  // Handmatige alias
  const aliasTitle = ALIASES[itemName.toLowerCase().trim()]
  if (aliasTitle) {
    const found = artworks.find(aw => aw.title === aliasTitle)
    if (found) return found
  }

  // Exacte match
  for (const aw of artworks) {
    if (normalize(aw.title) === itemNorm) return aw
  }

  // Strip varianten: alles na '+', '(pre', '(private', '(personal', '(combi', '#ap', '(sander dekker)'
  const base = itemName
    .replace(/\s*\(sander dekker\)/i, '')
    .replace(/\s*\+.*$/i, '')
    .replace(/\s*\(pre[-\s]?(sale|order).*$/i, '')
    .replace(/\s*\(private\).*$/i, '')
    .replace(/\s*\(personal.*$/i, '')
    .replace(/\s*- combi.*$/i, '')
    .replace(/\s*#ap.*$/i, '')
    .trim()
  const baseNorm = normalize(base)

  for (const aw of artworks) {
    if (normalize(aw.title) === baseNorm) return aw
  }

  // Gedeeltelijke match: artwork-titel zit volledig in item (of andersom)
  for (const aw of artworks) {
    const awNorm = normalize(aw.title)
    if (itemNorm.includes(awNorm) || awNorm.includes(baseNorm)) return aw
  }

  // Zine/Book nummer match: "Zine Nº 7" → match op "zine n 7"
  const numMatch = itemName.match(/(?:zine|book|special edition)\s*n[oº]?\.?\s*(\d+)/i)
  if (numMatch) {
    const num = numMatch[1]
    for (const aw of artworks) {
      if (normalize(aw.title).includes(`n ${num}`) || normalize(aw.title).includes(`n${num}`)) return aw
    }
  }

  return null
}

// ── Hoofd ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📦  Artworks ophalen uit Sanity…')
  const artworks = await sanity.fetch(
    `*[_type == "artwork"]{ _id, title, slug }`
  )
  console.log(`   ${artworks.length} artworks geladen`)

  console.log('👥  Contacten ophalen uit Sanity…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(email)]{ _id, firstName, lastName, email, purchases }`
  )
  const contactByEmail = new Map(contacts.map(c => [c.email.toLowerCase(), c]))
  console.log(`   ${contacts.length} contacten geladen\n`)

  // ── CSV parsen ──────────────────────────────────────────────────────────────
  const csvPath = join(__dirname, '../') + 'orders-2026-07-25-09-23-59.csv'
  const tryPaths = [
    csvPath,
    '/Users/sanderdekker/Library/Application Support/Claude/local-agent-mode-sessions/492ea184-70ff-411e-83ca-7137e9ed330b/01915c66-6ab8-48c8-ac8a-f2e357f5386b/local_7676f062-5f6c-48f3-849d-a4f04459a690/uploads/orders-2026-07-25-09-23-59.csv',
  ]
  let csvRaw = null
  for (const p of tryPaths) {
    try { csvRaw = readFileSync(p, 'utf8'); break } catch {}
  }
  if (!csvRaw) {
    // Check scripts folder
    try { csvRaw = readFileSync(join(__dirname, 'orders-2026-07-25-09-23-59.csv'), 'utf8') } catch {}
  }
  if (!csvRaw) {
    console.error('❌  CSV niet gevonden. Kopieer het naar de scripts/ map:')
    console.error('    cp ~/Downloads/orders-*.csv ~/mynameissanderdekker/scripts/orders.csv')
    process.exit(1)
  }

  const lines = csvRaw.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const h = (name) => headers.indexOf(name)

  // Groepeer per bestelling
  const orders = {}
  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    const orderNum = cols[h('Order Number')]
    const email    = cols[h('Email (Billing)')]?.toLowerCase()
    const item     = cols[h('Item Name')]
    const price    = parseFloat(cols[h('Item Cost')]) || 0
    const total    = parseFloat(cols[h('Order Total Amount')]) || 0

    if (!orderNum || !email) continue
    if (!orders[orderNum]) orders[orderNum] = { email, items: [], total }
    if (item) orders[orderNum].items.push({ item, price })
  }

  // ── Koppelen ──────────────────────────────────────────────────────────────
  let matched = 0, skipped = 0, noContact = 0, noArtwork = 0

  const purchasesByContact = new Map() // contactId → [{artworkId, price, orderNum}]

  for (const [orderNum, order] of Object.entries(orders)) {
    const contact = contactByEmail.get(order.email)
    if (!contact) { noContact++; continue }

    for (const { item, price } of order.items) {
      const artwork = matchArtwork(item, artworks)
      if (!artwork) {
        if (!SKIP_ITEMS.has(item.toLowerCase().trim())) {
          console.log(`⚠️  Geen artwork voor: "${item}" (order ${orderNum})`)
          noArtwork++
        }
        continue
      }

      // Controleer of deze aankoop al bestaat
      const existing = contact.purchases ?? []
      const alreadyIn = existing.some(p =>
        p.artwork?._ref === artwork._id && p.editionNumber === `Order #${orderNum}`
      )
      if (alreadyIn) { skipped++; continue }

      if (!purchasesByContact.has(contact._id)) purchasesByContact.set(contact._id, [])
      purchasesByContact.get(contact._id).push({
        _key: `${orderNum}-${artwork._id.slice(-8)}`,
        artwork: { _type: 'reference', _ref: artwork._id },
        editionNumber: `Order #${orderNum}`,
        price,
      })
      matched++
    }
  }

  // ── Opslaan in Sanity ─────────────────────────────────────────────────────
  console.log(`\n✍️   ${matched} aankopen koppelen aan ${purchasesByContact.size} contacten…\n`)

  for (const [contactId, purchases] of purchasesByContact) {
    const contact = contacts.find(c => c._id === contactId)
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    try {
      const result = await sanity.patch(contactId).setIfMissing({ purchases: [] }).append('purchases', purchases).commit()
      console.log(`✓ ${name} — ${purchases.length} aankopen (id: ${result._id})`)
    } catch (err) {
      console.error(`⚠️  ${name}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Aankopen gekoppeld:  ${matched}`)
  console.log(`   Al aanwezig:         ${skipped}`)
  console.log(`   Geen contact:        ${noContact} bestellingen`)
  console.log(`   Geen artwork match:  ${noArtwork} items`)
}

main().catch(console.error)

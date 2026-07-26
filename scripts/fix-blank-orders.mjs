/**
 * fix-blank-orders.mjs
 *
 * Koppelt WooCommerce bestellingen met lege Item Name aan Sanity contacten.
 * Productnamen zijn handmatig opgezocht via Gmail order-emails en prijspatronen.
 *
 * Gebruik: node scripts/fix-blank-orders.mjs
 */

import { createClient } from '@sanity/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ── Handmatige mapping: order# → [artwork titel, prijs] ──────────────────────
//
// Bronnen:
//   ✓ = bevestigd via Gmail order-email of screenshot
//   ~ = afgeleid op basis van prijs/periode
//   ? = onzeker (zie TODO onderaan)
//
// Prijzen: artikel-prijs (excl. verzending), op basis van bekende productprijzen

const BLANK_ORDER_MAP = {
  // ── 2019: Limited editions ────────────────────────────────────────────────
  '2379': [{ title: 'Limited edition: Lady of the Manor',  price: 100 }], // ✓ Gmail
  '2391': [{ title: 'Limited edition: Horsing Around',     price: 100 }], // ✓ Gmail

  // ── Mrt–apr 2020: Lady of the Manor + losse bestellingen ─────────────────
  '5077': [{ title: 'My name is Sander Dekker Nº 1.5',    price: 30  }], // ~ €36.95 totaal
  '5103': [{ title: 'My name is Sander Dekker Nº 2',      price: 40  }], // ✓ Stripe €40
  '5117': [{ title: 'My name is Sander Dekker Nº 2',      price: 40  }], // ~ €40 totaal (pickup)
  '5118': [{ title: 'Limited edition: Lady of the Manor',  price: 150 }], // ✓ Gmail

  // ── Mei 2020: lancering Nº 2 (en Nº 1.5) ────────────────────────────────
  // Enkele bestelling Nº 2
  '5147': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5148': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5149': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5150': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5151': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5152': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5153': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5154': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5156': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5157': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5161': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5162': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5166': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €64 int
  '5170': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €60 int
  '5171': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5172': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5173': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5174': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5175': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5176': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5177': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5178': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5179': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €60 int
  '5180': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5181': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €64 int
  '5183': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5184': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5185': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ~ €34 NL (= Nº 1.5)
  '5186': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ Gmail
  '5187': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5189': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5190': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €60 int
  '5191': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5192': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5193': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5194': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5196': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5197': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5198': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5200': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5202': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5204': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €60 int
  '5210': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5211': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int
  '5212': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5215': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €45 NL
  '5216': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49 int
  '5217': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €55 int

  // Combi: Nº 1.5 + Nº 2 (€70–85 totaal)
  '5163': [ // ~ €70 = Nº 1.5 + Nº 2 (pre-sale lancering)
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 40 },
  ],
  '5164': [
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 40 },
  ],
  '5165': [
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 40 },
  ],
  '5167': [
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 40 },
  ],
  '5168': [
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 40 },
  ],
  '5169': [ // ~ €75 = Nº 1.5 (€30) + Nº 2 (€45)
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 45 },
  ],

  // ── Jun–jul 2020 ──────────────────────────────────────────────────────────
  '5229': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ gebruiker
  '5231': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50
  '5232': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €57.50
  '5234': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ Gmail
  '5235': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50
  '5239': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €57.50
  '5299': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ gebruiker

  // ── Okt 2020 ──────────────────────────────────────────────────────────────
  '5530': [ // ✓ screenshot: Nº 1.5 + Nº 2, local pickup
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 45 },
  ],
  '5201': [ // ? gebruiker: denk ik Nº 2 + Nº 1.5 (€85)
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 2',   price: 45 },
  ],
  '5532': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50
  '5550': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ Gmail

  // ── Nov 2020 – jan 2021 ───────────────────────────────────────────────────
  '6007': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ gebruiker
  '6032': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €57.50
  '6033': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50
  '6066': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ✓ Gmail
  '6071': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50
  '6156': [{ title: 'My name is Sander Dekker Nº 2', price: 45 }], // ~ €49.50

  // ── Jan–mrt 2021: lancering Nº 1 ─────────────────────────────────────────
  '6164': [{ title: 'My name is Sander Dekker Nº 2',   price: 45 }], // ✓ Gmail
  '6167': [ // ✓ Gmail: Nº 1.5 + Nº 1
    { title: 'My name is Sander Dekker Nº 1.5', price: 30 },
    { title: 'My name is Sander Dekker Nº 1',   price: 75 },
  ],
  '6171': [{ title: 'My name is Sander Dekker Nº 1', price: 75 }], // ✓ Gmail
  '6172': [{ title: 'My name is Sander Dekker Nº 1', price: 75 }], // ✓ Gmail
  '6173': [{ title: 'My name is Sander Dekker Nº 1', price: 75 }], // ✓ Gmail
  '6174': [{ title: 'My name is Sander Dekker Nº 1', price: 75 }], // ✓ Gmail
  '6176': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ✓ Gmail
  '6182': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ✓ Gmail
  '6183': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ✓ Gmail
  '6188': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ✓ Gmail

  // ── Sep 2021: late bestellingen ───────────────────────────────────────────
  '6476': [{ title: 'My name is Sander Dekker Nº 2',   price: 45 }], // ~ €49.50
  '6480': [{ title: 'My name is Sander Dekker Nº 2',   price: 45 }], // ~ €49.50
  '6481': [{ title: 'My name is Sander Dekker Nº 1',   price: 75 }], // ~ €87.50 = Nº 1
  '6482': [{ title: 'My name is Sander Dekker Nº 1',   price: 75 }], // ~ €87.50 = Nº 1
  '6483': [{ title: 'My name is Sander Dekker Nº 1',   price: 75 }], // ~ €79.50 = Nº 1
  '6484': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ~ €34.50 = Nº 1.5
  '6485': [{ title: 'My name is Sander Dekker Nº 1.5', price: 30 }], // ~ €34.50 = Nº 1.5

  // ── Bevestigd door gebruiker ──────────────────────────────────────────────
  '5213': [ // ✓ gebruiker: Lady of the Manor (€150) + Nº 2 (€45) + verzending DE = €205
    { title: 'Limited edition: Lady of the Manor',  price: 150 },
    { title: 'My name is Sander Dekker Nº 2',       price: 45  },
  ],

  // '241','245','246': test-orders 2018, overgeslagen
}

// Email-adressen die NIET in de mapping zijn opgenomen
const SKIP_EMAILS = new Set(['huanjianqiu@gmail.com'])

// ── Hoofd ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📦  Artworks ophalen uit Sanity…')
  const artworks = await sanity.fetch(`*[_type == "artwork"]{ _id, title }`)
  const artworkByTitle = new Map(artworks.map(a => [a.title, a]))
  console.log(`   ${artworks.length} artworks geladen`)

  console.log('👥  Contacten ophalen uit Sanity…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(email)]{ _id, firstName, lastName, email, purchases }`
  )
  const contactByEmail = new Map(contacts.map(c => [c.email.toLowerCase(), c]))
  console.log(`   ${contacts.length} contacten geladen\n`)

  // ── CSV parsen voor email per order ───────────────────────────────────────
  const { readFileSync } = await import('fs')
  let csvRaw
  for (const p of [
    join(__dirname, 'orders-2026-07-25-09-23-59.csv'),
    join(__dirname, '../orders-2026-07-25-09-23-59.csv'),
  ]) {
    try { csvRaw = readFileSync(p, 'utf8'); break } catch {}
  }
  if (!csvRaw) throw new Error('CSV niet gevonden. Kopieer hem naar scripts/')

  function parseCSVLine(line) {
    const cols = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  }

  const lines = csvRaw.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const h = name => headers.indexOf(name)

  const emailByOrder = {}
  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    const num = cols[h('Order Number')]
    const email = cols[h('Email (Billing)')]?.toLowerCase()
    if (num && email && !emailByOrder[num]) emailByOrder[num] = email
  }

  // ── Koppelen ───────────────────────────────────────────────────────────────
  let matched = 0, skipped = 0, noContact = 0, noArtwork = 0, warned = 0

  const purchasesByContact = new Map()

  for (const [orderNum, items] of Object.entries(BLANK_ORDER_MAP)) {
    const email = emailByOrder[orderNum]
    if (!email || SKIP_EMAILS.has(email)) continue

    const contact = contactByEmail.get(email)
    if (!contact) {
      console.log(`⚠️  Geen contact voor order #${orderNum} (${email})`)
      noContact++
      continue
    }

    for (const { title, price } of items) {
      const artwork = artworkByTitle.get(title)
      if (!artwork) {
        console.log(`❌  Artwork niet gevonden: "${title}" (order ${orderNum})`)
        noArtwork++
        warned++
        continue
      }

      const existing = contact.purchases ?? []
      const key = `${orderNum}-${artwork._id.slice(-8)}`
      const alreadyIn = existing.some(p =>
        p.artwork?._ref === artwork._id && p.editionNumber === `Order #${orderNum}`
      )
      if (alreadyIn) { skipped++; continue }

      if (!purchasesByContact.has(contact._id)) purchasesByContact.set(contact._id, [])
      purchasesByContact.get(contact._id).push({
        _key: key,
        artwork: { _type: 'reference', _ref: artwork._id },
        editionNumber: `Order #${orderNum}`,
        price,
      })
      matched++
    }
  }

  // ── Opslaan ────────────────────────────────────────────────────────────────
  console.log(`\n✍️   ${matched} aankopen koppelen aan ${purchasesByContact.size} contacten…\n`)

  for (const [contactId, purchases] of purchasesByContact) {
    const contact = contacts.find(c => c._id === contactId)
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    try {
      await sanity.patch(contactId).setIfMissing({ purchases: [] }).append('purchases', purchases).commit()
      const items = purchases.map(p => {
        const title = artworks.find(a => a._id === p.artwork._ref)?.title ?? '?'
        return `${title} (#${p.editionNumber.replace('Order #', '')})`
      }).join(', ')
      console.log(`✓ ${name} — ${items}`)
    } catch (err) {
      console.error(`⚠️  ${name}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Aankopen gekoppeld:  ${matched}`)
  console.log(`   Al aanwezig:         ${skipped}`)
  console.log(`   Geen contact:        ${noContact}`)
  console.log(`   Artwork niet gevonden: ${noArtwork}`)
  if (warned > 0) console.log('\n⚠️  Controleer ontbrekende artworks hierboven.')
}

main().catch(console.error)

/**
 * import-woocommerce.mjs
 *
 * Importeert WooCommerce-bestellingen (orders-2026-07-25-09-23-59.csv) naar Sanity-contacten.
 *
 * Gebruik:
 *   node scripts/import-woocommerce.mjs
 *
 * Wat het doet:
 *  - Groepeert rijen per Order Number (meerdere items per bestelling)
 *  - Maakt per uniek e-mailadres een contact aan (of werkt bij)
 *  - Slaat alle aankopen op in het `notes`-veld
 *  - Producten waarvan de naam een klantnaam lijkt (verwijderd uit WooCommerce)
 *    krijgen het label "Werk onbekend — vul later in" + prijs zodat je het kunt herleiden
 */

import { createClient } from '@sanity/client'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
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

const CSV_PATH = join(__dirname, 'woocommerce-orders.csv')

if (!existsSync(CSV_PATH)) {
  console.error('❌  Bestand niet gevonden:', CSV_PATH)
  process.exit(1)
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

async function readCSV(path) {
  return new Promise((resolve, reject) => {
    const rows = []
    const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
    let headers = null
    rl.on('line', (line) => {
      if (!line.trim()) return
      const cols = parseCSVLine(line)
      if (!headers) { headers = cols.map(h => h.replace(/^"|"$/g, '').trim()); return }
      const row = {}
      headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim() })
      rows.push(row)
    })
    rl.on('close', () => resolve(rows))
    rl.on('error', reject)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function formatPrice(str) {
  const n = parseFloat(str.replace(',', '.'))
  if (isNaN(n)) return str
  return `€${n.toFixed(2)}`
}

// Detecteert of een Item Name waarschijnlijk een klantnaam is
// (product is verwijderd uit WooCommerce)
const KNOWN_PRODUCT_PREFIXES = [
  'book:', 'zine', 'special edition', 'showroom piece', 'tenfifteen',
  'wallpaper', 'print', 'poster', 'set ', 'combi',
]

function isProductName(name) {
  if (!name) return false
  const lower = name.toLowerCase()
  return KNOWN_PRODUCT_PREFIXES.some(p => lower.startsWith(p)) || lower.startsWith('zine n')
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────

async function main() {
  console.log('📋  WooCommerce CSV inlezen…')
  const rows = await readCSV(CSV_PATH)
  console.log(`   ${rows.length} rijen gevonden`)

  // Groepeer per Order Number
  const orderMap = new Map()
  for (const row of rows) {
    const id = row['Order Number']
    if (!id) continue
    if (!orderMap.has(id)) orderMap.set(id, [])
    orderMap.get(id).push(row)
  }
  console.log(`   ${orderMap.size} unieke bestellingen`)

  // Groepeer per e-mail (contact)
  const contactMap = new Map() // email → { contact info, orders[] }

  for (const [orderId, items] of orderMap) {
    const first = items[0]
    const email = first['Email (Billing)']?.toLowerCase()
    if (!email || !email.includes('@')) continue

    const status = first['Order Status']
    if (!['completed', 'processing'].includes(status.toLowerCase())) continue

    const firstName  = cap(first['First Name (Billing)']) || ''
    const lastName   = first['Last Name (Billing)'] || ''
    const company    = first['Company (Billing)'] || ''
    const street     = first['Address 1&2 (Billing)'] || ''
    const postalCode = first['Postcode (Billing)'] || ''
    const city       = cap(first['City (Billing)']) || ''
    const country    = first['Country Code (Billing)']?.toUpperCase() || ''
    const phone      = first['Phone (Billing)']?.replace(/\s+/g, '') || ''
    const total      = first['Order Total Amount']

    // Bouw aankoop-omschrijving
    const itemLines = items.map(item => {
      const name = item['Item Name'] || ''
      const qty  = item['Quantity (- Refund)'] || '1'
      const cost = formatPrice(item['Item Cost'] || '0')

      if (!name || !isProductName(name)) {
        // Verwijderd product of klantnaam — open laten
        const label = name
          ? `[Werk onbekend: "${name}"]`
          : '[Werk onbekend]'
        return `  • ${label} × ${qty} — ${cost} — vul later in`
      }
      return `  • ${name} × ${qty} — ${cost}`
    })

    const orderNote = [
      `Order #${orderId} | Totaal: ${formatPrice(total)}`,
      ...itemLines,
    ].join('\n')

    if (!contactMap.has(email)) {
      contactMap.set(email, {
        email,
        firstName,
        lastName,
        company:    company    || undefined,
        phone:      phone      || undefined,
        street:     street     || undefined,
        postalCode: postalCode || undefined,
        city:       city       || undefined,
        country:    country    || undefined,
        orders: [],
      })
    }

    contactMap.get(email).orders.push(orderNote)
  }

  console.log(`   ${contactMap.size} unieke klanten`)
  console.log('\n📤  Importeren naar Sanity…\n')

  let created = 0, updated = 0, errors = 0

  for (const [email, data] of contactMap) {
    const purchasesNote = data.orders.join('\n\n')

    try {
      const existing = await sanity.fetch(
        `*[_type == "contact" && email == $email][0]{ _id, notes }`,
        { email }
      )

      if (existing) {
        // Voeg alleen nieuwe orders toe (controleer op order-ID)
        const currentNotes = existing.notes ?? ''
        const newOrders = data.orders.filter(o => {
          const match = o.match(/Order #(\d+)/)
          return match ? !currentNotes.includes(`Order #${match[1]}`) : true
        })

        const patch = sanity.patch(existing._id)
          .setIfMissing({
            firstName:  data.firstName,
            lastName:   data.lastName,
            type: 'collector',
          })
          // Altijd adres bijwerken (kan nu gevuld zijn)
          .set(Object.fromEntries(
            Object.entries({
              company:    data.company,
              phone:      data.phone,
              street:     data.street,
              postalCode: data.postalCode,
              city:       data.city,
              country:    data.country,
            }).filter(([, v]) => v !== undefined)
          ))

        if (newOrders.length > 0) {
          const appendNote = newOrders.join('\n\n')
          patch.set({ notes: currentNotes ? `${currentNotes}\n\n${appendNote}` : appendNote })
        }

        await patch.commit({ visibility: 'async' })
        updated++
        process.stdout.write(`✓ bijgewerkt: ${email}\n`)
      } else {
        await sanity.create({
          _type: 'contact',
          email,
          firstName:  data.firstName,
          lastName:   data.lastName,
          company:    data.company,
          phone:      data.phone,
          street:     data.street,
          postalCode: data.postalCode,
          city:       data.city,
          country:    data.country,
          source: 'woocommerce',
          type: 'collector',
          notes: purchasesNote,
        })
        created++
        process.stdout.write(`+ aangemaakt: ${email}\n`)
      }
    } catch (err) {
      console.error(`⚠️  ${email}: ${err.message}`)
      errors++
    }

    // Kleine pauze om rate limits te voorkomen
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Nieuw aangemaakt: ${created}`)
  console.log(`   Bijgewerkt:       ${updated}`)
  if (errors > 0) console.log(`   Fouten:          ${errors}`)
  console.log('\n💡  Open Sanity Studio → Contacten om de "[Werk onbekend]" aankopen in te vullen.')
}

main().catch(console.error)

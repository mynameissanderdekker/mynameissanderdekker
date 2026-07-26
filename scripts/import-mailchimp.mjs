/**
 * import-mailchimp.mjs
 *
 * Importeert Mailchimp-abonnees (subscribed_email_segment_preview_export_*.csv)
 * naar Sanity als 'contact' documenten.
 *
 * Gebruik:
 *   node scripts/import-mailchimp.mjs
 *
 * Vereist: scripts/mailchimp-export.csv
 * Kolommen: First Name, Last Name, Email Address, CONFIRM_TIME, CC, TIMEZONE, TAGS
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

const CSV_PATH = join(__dirname, 'mailchimp-export.csv')

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
      if (!headers) {
        // Strip aanhalingstekens van headers
        headers = cols.map(h => h.replace(/^"|"$/g, '').trim())
        return
      }
      const row = {}
      headers.forEach((h, i) => { row[h] = (cols[i] ?? '').replace(/^"|"$/g, '').trim() })
      rows.push(row)
    })
    rl.on('close', () => resolve(rows))
    rl.on('error', reject)
  })
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────

async function main() {
  console.log('📋  Mailchimp CSV inlezen…')
  const rows = await readCSV(CSV_PATH)
  console.log(`   ${rows.length} abonnees gevonden\n`)

  let created = 0, updated = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const email = row['Email Address']?.toLowerCase()
    if (!email || !email.includes('@')) { skipped++; continue }

    const firstName   = row['First Name'] || ''
    const lastName    = row['Last Name']  || ''
    const confirmedAt = row['CONFIRM_TIME'] || ''
    const countryCode = row['CC'] || ''
    const timezone    = row['TIMEZONE'] || ''

    // Bepaal locatie op basis van country code
    const location = countryCode ? countryCode.toUpperCase() : undefined

    let subscribedAt
    try {
      subscribedAt = confirmedAt ? new Date(confirmedAt).toISOString() : new Date().toISOString()
    } catch {
      subscribedAt = new Date().toISOString()
    }

    try {
      const existing = await sanity.fetch(
        `*[_type == "contact" && email == $email][0]{ _id, subscribed, source }`,
        { email }
      )

      if (existing) {
        // Contact bestaat al (bijv. via WooCommerce import) — voeg nieuwsbrief toe
        const patch = sanity.patch(existing._id).setIfMissing({
          firstName,
          lastName,
          location,
        })

        if (!existing.subscribed) {
          patch.set({ subscribed: true, subscribedAt })
        }

        await patch.commit({ visibility: 'async' })
        updated++
        process.stdout.write(`✓ bijgewerkt: ${email}\n`)
      } else {
        await sanity.create({
          _type: 'contact',
          email,
          firstName,
          lastName,
          location,
          subscribed: true,
          subscribedAt,
          source: 'mailchimp',
          type: 'newsletter',
        })
        created++
        process.stdout.write(`+ aangemaakt: ${email}\n`)
      }
    } catch (err) {
      console.error(`⚠️  ${email}: ${err.message}`)
      errors++
    }

    // Kleine pauze om rate limits te voorkomen
    await new Promise(r => setTimeout(r, 120))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Nieuw aangemaakt: ${created}`)
  console.log(`   Bijgewerkt:       ${updated}`)
  console.log(`   Overgeslagen:     ${skipped}`)
  if (errors > 0) console.log(`   Fouten:          ${errors}`)
}

main().catch(console.error)

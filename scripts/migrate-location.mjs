/**
 * migrate-location.mjs
 *
 * Splitst het `location`-veld ("Amsterdam, NL") in `city` + `country`
 * voor alle bestaande contacten in Sanity.
 *
 * Gebruik:
 *   node scripts/migrate-location.mjs
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
  apiVersion: '2026-07-24',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ISO landcodes die we herkennen
const COUNTRY_CODES = new Set([
  'NL','BE','DE','FR','GB','US','DK','AT','FI','IT','ES','CH','AU','CA','SE','NO','PT','JP',
  'PL','CZ','HU','RO','SK','SI','HR','BG','LT','LV','EE','IE','LU','MT','CY','GR','TR',
  'RU','UA','CN','JP','KR','IN','BR','MX','AR','ZA','NG','EG','MA',
])

function parseLocation(location) {
  if (!location) return { city: undefined, country: undefined }

  // Als het alleen een landcode is (bijv. "NL", "DE")
  if (COUNTRY_CODES.has(location.trim().toUpperCase())) {
    return { city: undefined, country: location.trim().toUpperCase() }
  }

  // Formaat "Amsterdam, NL" of "Amsterdam, Netherlands"
  const parts = location.split(',').map(p => p.trim())

  if (parts.length >= 2) {
    const last = parts[parts.length - 1].toUpperCase()
    if (COUNTRY_CODES.has(last)) {
      // "Amsterdam, NL" → city: Amsterdam, country: NL
      const city = parts.slice(0, -1).join(', ')
      return { city, country: last }
    }
  }

  // Kon niet parsen — sla op als stad, land onbekend
  return { city: location, country: undefined }
}

async function main() {
  console.log('🔍  Contacten ophalen met location-veld…')

  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(location)]{ _id, location, city, country }`,
  )

  console.log(`   ${contacts.length} contacten gevonden met location-veld\n`)

  let updated = 0, skipped = 0, errors = 0

  for (const contact of contacts) {
    // Sla over als city/country al ingevuld zijn
    if (contact.city || contact.country) {
      skipped++
      continue
    }

    const { city, country } = parseLocation(contact.location)

    if (!city && !country) {
      skipped++
      continue
    }

    try {
      const patch = sanity.patch(contact._id)
      if (city)    patch.set({ city })
      if (country) patch.set({ country })
      // Verwijder het oude location-veld
      patch.unset(['location'])

      await patch.commit({ visibility: 'async' })
      updated++
      process.stdout.write(`✓ ${contact.location} → ${city ?? '–'} | ${country ?? '–'}\n`)
    } catch (err) {
      console.error(`⚠️  ${contact._id}: ${err.message}`)
      errors++
    }

    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Bijgewerkt:   ${updated}`)
  console.log(`   Overgeslagen: ${skipped}`)
  if (errors > 0) console.log(`   Fouten:       ${errors}`)
}

main().catch(console.error)

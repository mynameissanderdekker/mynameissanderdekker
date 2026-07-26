/**
 * import-contacts-vcf.mjs
 *
 * Matcht Mac Contacts (VCF export) op bestaande Sanity-contacten via e-mailadres.
 * Vult ontbrekende velden aan: foto, telefoonnummer, adres.
 * Overschrijft GEEN bestaande data.
 *
 * Gebruik:
 *   node scripts/import-contacts-vcf.mjs
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

const VCF_PATH = join(__dirname, '../scripts/../') + 'Dhr Sander Dekker and 1.692 others.vcf'
// Probeer ook de uploads map
const VCF_PATHS = [
  join(__dirname, '../Dhr Sander Dekker and 1.692 others.vcf'),
  '/Users/sanderdekker/Library/Application Support/Claude/local-agent-mode-sessions/492ea184-70ff-411e-83ca-7137e9ed330b/01915c66-6ab8-48c8-ac8a-f2e357f5386b/local_7676f062-5f6c-48f3-849d-a4f04459a690/uploads/Dhr Sander Dekker and 1.692 others.vcf',
]

const COUNTRY_MAP = {
  'nederland': 'NL', 'netherlands': 'NL', 'nl': 'NL',
  'belgië': 'BE', 'belgie': 'BE', 'belgium': 'BE', 'be': 'BE',
  'duitsland': 'DE', 'germany': 'DE', 'deutschland': 'DE', 'de': 'DE',
  'frankrijk': 'FR', 'france': 'FR', 'fr': 'FR',
  'verenigd koninkrijk': 'GB', 'united kingdom': 'GB', 'gb': 'GB', 'uk': 'GB',
  'verenigde staten': 'US', 'united states': 'US', 'usa': 'US', 'us': 'US',
  'denemarken': 'DK', 'denmark': 'DK', 'dk': 'DK',
  'oostenrijk': 'AT', 'austria': 'AT', 'at': 'AT',
  'zwitserland': 'CH', 'switzerland': 'CH', 'ch': 'CH',
  'italië': 'IT', 'italie': 'IT', 'italy': 'IT', 'it': 'IT',
  'spanje': 'ES', 'spain': 'ES', 'españa': 'ES', 'es': 'ES',
  'zweden': 'SE', 'sweden': 'SE', 'sverige': 'SE', 'se': 'SE',
  'noorwegen': 'NO', 'norway': 'NO', 'norge': 'NO', 'no': 'NO',
  'australië': 'AU', 'australia': 'AU', 'au': 'AU',
  'canada': 'CA', 'ca': 'CA',
  'portugal': 'PT', 'pt': 'PT',
  'japan': 'JP', 'jp': 'JP',
  'finland': 'FI', 'fi': 'FI',
}

function mapCountry(str) {
  if (!str) return null
  const key = str.toLowerCase().trim()
  return COUNTRY_MAP[key] ?? null
}

// ── VCF Parser ────────────────────────────────────────────────────────────────

function parseVCF(raw) {
  // Unfold: regel die begint met spatie/tab is vervolg van vorige regel
  const unfolded = raw.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const vcards = []
  let current = null

  for (const line of lines) {
    if (line === 'BEGIN:VCARD') {
      current = { emails: [], phones: [], addresses: [], photoB64: null }
      continue
    }
    if (line === 'END:VCARD') {
      if (current) vcards.push(current)
      current = null
      continue
    }
    if (!current) continue

    // Key:Value — key kan parameters hebben (KEY;param=val;...)
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const keyPart = line.slice(0, colonIdx).toUpperCase()
    const value   = line.slice(colonIdx + 1).trim()

    // Strip itemnr prefix (item1.EMAIL → EMAIL)
    const cleanKey = keyPart.replace(/^ITEM\d+\./, '')

    if (cleanKey === 'FN') {
      current.fullName = value
    } else if (cleanKey.startsWith('EMAIL')) {
      if (value) current.emails.push(value.toLowerCase())
    } else if (cleanKey.startsWith('TEL')) {
      if (value) current.phones.push(value)
    } else if (cleanKey.startsWith('ADR')) {
      // VCF ADR: pobox;ext;street;city;state;postal;country
      const parts = value.split(';')
      current.addresses.push({
        street:     (parts[2] ?? '').trim() || null,
        city:       (parts[3] ?? '').trim() || null,
        postalCode: (parts[5] ?? '').trim() || null,
        countryRaw: (parts[6] ?? '').trim() || null,
      })
    } else if (cleanKey.startsWith('PHOTO')) {
      // Base64 foto — al unfolded dus één lange string
      current.photoB64 = value.replace(/\s/g, '')
    }
  }

  return vcards
}

// ── Hoofd ─────────────────────────────────────────────────────────────────────

async function main() {
  // Zoek VCF bestand
  let vcfPath = null
  for (const p of VCF_PATHS) {
    try { readFileSync(p, { encoding: 'utf8', flag: 'r' }).slice(0, 10); vcfPath = p; break } catch {}
  }
  if (!vcfPath) {
    console.error('❌  VCF bestand niet gevonden. Zet het in de scripts/ map als "contacts.vcf".')
    console.error('    Verwachte paden:')
    VCF_PATHS.forEach(p => console.error('    -', p))
    process.exit(1)
  }
  console.log('📂  Lees:', vcfPath)

  console.log('📇  VCF parsen…')
  const raw    = readFileSync(vcfPath, 'utf8')
  const vcards = parseVCF(raw)
  console.log(`   ${vcards.length} vcards gevonden`)

  // Bouw email → vcard index (voorkeur aan vcards met foto)
  const byEmail = new Map()
  for (const vc of vcards) {
    for (const email of vc.emails) {
      const existing = byEmail.get(email)
      if (!existing || (!existing.photoB64 && vc.photoB64)) {
        byEmail.set(email, vc)
      }
    }
  }
  console.log(`   ${byEmail.size} unieke e-mailadressen`)

  // Bouw naam → vcard index als fallback (voor-+achternaam genormaliseerd)
  const byName = new Map()
  for (const vc of vcards) {
    if (vc.fullName) {
      const key = vc.fullName.toLowerCase().replace(/[^a-z]/g, '')
      if (!byName.has(key)) byName.set(key, vc)
    }
  }

  console.log('\n📋  Sanity contacten ophalen…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(email)]{
      _id, firstName, lastName, email,
      phone, street, postalCode, city, country, photo
    }`
  )
  console.log(`   ${contacts.length} contacten geladen\n`)

  let matched = 0, photos = 0, phones = 0, addresses = 0, skipped = 0

  for (const contact of contacts) {
    const email = contact.email?.toLowerCase()
    let vc = byEmail.get(email)

    // Fallback: match op naam
    if (!vc) {
      const nameKey = `${contact.firstName ?? ''}${contact.lastName ?? ''}`.toLowerCase().replace(/[^a-z]/g, '')
      if (nameKey.length >= 5) vc = byName.get(nameKey) ?? null
    }

    if (!vc) { skipped++; continue }

    matched++
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    const patch = sanity.patch(contact._id)
    let hasChanges = false

    // ── Foto ──────────────────────────────────────────────────────────────────
    if (!contact.photo && vc.photoB64) {
      try {
        const buf = Buffer.from(vc.photoB64, 'base64')
        const asset = await sanity.assets.upload('image', buf, {
          filename: `contact-${contact._id}.jpg`,
          contentType: 'image/jpeg',
        })
        patch.set({
          photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
        })
        photos++
        hasChanges = true
        process.stdout.write(`📸 `)
      } catch (err) {
        process.stdout.write(`⚠️foto(${err.message.slice(0,30)}) `)
      }
    }

    // ── Telefoon ──────────────────────────────────────────────────────────────
    if (!contact.phone && vc.phones.length > 0) {
      // Voorkeur: nummers die beginnen met +
      const intl = vc.phones.find(p => p.startsWith('+')) ?? vc.phones[0]
      patch.set({ phone: intl })
      phones++
      hasChanges = true
    }

    // ── Adres ─────────────────────────────────────────────────────────────────
    if (!contact.street && vc.addresses.length > 0) {
      // Neem eerste adres met een straat
      const adr = vc.addresses.find(a => a.street) ?? vc.addresses[0]
      const countryISO = mapCountry(adr.countryRaw)
      const setFields = {}
      if (adr.street)     setFields.street     = adr.street
      if (adr.postalCode) setFields.postalCode  = adr.postalCode
      if (adr.city)       setFields.city        = adr.city
      if (countryISO && !contact.country) setFields.country = countryISO
      if (Object.keys(setFields).length > 0) {
        patch.set(setFields)
        addresses++
        hasChanges = true
      }
    }

    if (hasChanges) {
      await patch.commit({ visibility: 'async' })
      console.log(`✓ ${name}`)
    }

    await new Promise(r => setTimeout(r, 120))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Contacten gematcht:   ${matched} / ${contacts.length}`)
  console.log(`   Foto's toegevoegd:    ${photos}`)
  console.log(`   Telefoonnrs toegev.:  ${phones}`)
  console.log(`   Adressen toegevoegd:  ${addresses}`)
  console.log(`   Geen match in VCF:    ${skipped}`)
}

main().catch(console.error)

/**
 * Eén adres → addresses[]
 *
 * Het adres in `galleryInfo` was tegelijk bezoekadres en factuuradres. Bij een
 * pop-up of een tweede ruimte zijn dat verschillende dingen: op de site mogen
 * er meerdere staan, op de factuur hoort er precies één.
 *
 * Dit script kopieert het bestaande adres naar het eerste item van de lijst,
 * met beide vinkjes aan. `galleryInfo` blijft staan tot alle code de lijst
 * leest.
 *
 *   DRY=1 node scripts/migrate-addresses.mjs
 *         node scripts/migrate-addresses.mjs
 */

import { createClient } from '@sanity/client'
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import crypto from 'node:crypto'

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

// Beide vormen ophalen: de gallery-template bewaart het adres in galleryInfo,
// de artist-template in invoiceSettings.
const docs = await client.fetch(
  `*[_type == "siteSettings"]{ _id, addresses, email, galleryInfo, invoiceSettings }`
)

if (docs.length === 0) {
  console.log('Geen siteSettings gevonden.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
writeFileSync(`backup-siteSettings-${stamp}.json`, JSON.stringify(docs, null, 2))
console.log(`Backup: backup-siteSettings-${stamp}.json\n`)

for (const doc of docs) {
  const src = doc.galleryInfo ?? doc.invoiceSettings ?? {}

  // E-mail los van de adressen behandelen: draai je dit script nadat je al een
  // adres hebt toegevoegd, dan mag het e-mailadres niet alsnog blijven liggen.
  if (!doc.email && src.email) {
    console.log(`${doc._id}: email = ${src.email}`)
    if (!DRY) {
      await client.patch(doc._id).set({ email: src.email }).commit()
      console.log('  → geschreven')
    }
  }

  if (doc.addresses?.length) {
    console.log(`${doc._id}: heeft al ${doc.addresses.length} adres(sen) — adreslijst overgeslagen`)
    continue
  }
  const street = src.address ?? src.street
  if (!street && !src.city) {
    console.log(`${doc._id}: geen adres gevonden — overgeslagen`)
    continue
  }

  const entry = {
    _key: crypto.randomUUID(),
    _type: 'siteAddress',
    // De artist-template gaat standaard uit van een studio.
    label: src.addressLabel ?? 'studio',
    ...(street ? { street } : {}),
    ...(src.postalCode ? { postalCode: src.postalCode } : {}),
    ...(src.city ? { city: src.city } : {}),
    ...(src.country ? { country: src.country } : {}),
    ...(src.phone ? { phone: src.phone } : {}),
    // Het bestaande adres deed beide dingen, dus beide vinkjes aan.
    // Een studioadres is meestal privé; stond het oude veld niet ingevuld,
    // dan zetten we hem uit in plaats van aan.
    showOnWebsite: src.addressIsPublic ?? false,
    useForInvoices: true,
  }

  console.log(`${doc._id}: ${[entry.street, entry.postalCode, entry.city].filter(Boolean).join(', ')}`)
  console.log(`  label=${entry.label}  website=${entry.showOnWebsite}  invoices=true`)

  // E-mail stond ook in galleryInfo en hoort op het hoogste niveau, naast de
  // adressenlijst.
  if (!DRY) {
    await client.patch(doc._id).set({ addresses: [entry] }).commit()
    console.log('  → geschreven')
  }
}

console.log(DRY ? '\nDRY run — er is niets gewijzigd.' : '\nKlaar.')

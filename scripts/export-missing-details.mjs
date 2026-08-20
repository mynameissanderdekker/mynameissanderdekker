/**
 * export-missing-details.mjs
 * Exports all contacts/purchases with missing data to a CSV.
 * Fill in the CSV, then run import-missing-details.mjs to push back to Sanity.
 *
 * Run: node scripts/export-missing-details.mjs
 * Output: scripts/missing-details.csv
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

function isPublication(purchase) {
  const cat = (purchase.artworkCategory ?? '').toLowerCase()
  const title = (purchase.artworkTitle ?? '').toLowerCase()
  return (
    cat.includes('zine') ||
    cat.includes('book') ||
    cat.includes('publicat') ||
    title.includes('zine') ||
    title.includes('collector\'s box') ||
    title.includes('collectors box')
  )
}

function isMissing(val) {
  return !val || val === '' || val === '?' || val === 'Unknown'
}
function isPlaceholder(email) {
  return !email || email.endsWith('@placeholder.art')
}

function csvEscape(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function main() {
  console.log('Fetching contacts from Sanity...')

  const contacts = await client.fetch(`
    *[_type == "contact"]{
      _id,
      firstName,
      lastName,
      email,
      notes,
      "purchases": purchases[]{
        _key,
        copyNumber,
        soldVia,
        date,
        price,
        "artworkId": artwork._ref,
        "artworkTitle": artwork->title,
        "artworkCategory": artwork->category
      }
    } | order(lastName asc, firstName asc)
  `)

  console.log(`Found ${contacts.length} contacts`)

  const rows = []
  const HEADER = [
    'contact_id',
    'first_name',
    'last_name',
    'email',           // fill in if missing
    'purchase_key',
    'artwork_title',
    'copy_number',     // fill in if ?
    'sold_via',
    'date',            // fill in if missing (YYYY-MM-DD)
    'price',           // fill in if missing (number, excl VAT)
    'notes',
  ]
  rows.push(HEADER)

  let rowCount = 0

  for (const c of contacts) {
    const emailMissing = isPlaceholder(c.email)
    const nameMissing  = isMissing(c.firstName) || c.firstName === 'Unknown'

    const purchases = (c.purchases ?? []).filter(p => !isPublication(p))

    // Include contact if email is placeholder OR any purchase has missing details
    const hasAnyMissing = emailMissing || nameMissing || purchases.some(p =>
      isMissing(p.copyNumber) || !p.date || p.price == null
    )

    if (!hasAnyMissing) continue

    if (purchases.length === 0) {
      // Contact with no purchases — still export if email missing
      if (emailMissing || nameMissing) {
        rows.push([
          c._id,
          c.firstName ?? '',
          c.lastName ?? '',
          emailMissing ? '' : c.email,
          '',
          '',
          '',
          '',
          '',
          '',
          c.notes ?? '',
        ].map(csvEscape))
        rowCount++
      }
      continue
    }

    for (const p of purchases) {
      const priceMissing    = p.price == null
      const dateMissing     = !p.date
      const copyMissing     = isMissing(p.copyNumber)
      const anyPurchaseMissing = priceMissing || dateMissing || copyMissing

      // Only include purchase rows where something is missing
      // (or the contact email/name is missing — include all purchases for that contact)
      if (!emailMissing && !nameMissing && !anyPurchaseMissing) continue

      rows.push([
        c._id,
        c.firstName ?? '',
        c.lastName ?? '',
        emailMissing ? '' : (c.email ?? ''),
        p._key ?? '',
        p.artworkTitle ?? p.artworkId ?? '',
        copyMissing ? '' : (p.copyNumber ?? ''),
        p.soldVia ?? '',
        dateMissing ? '' : (p.date ?? ''),
        priceMissing ? '' : (p.price ?? ''),
        c.notes ?? '',
      ].map(csvEscape))
      rowCount++
    }
  }

  const csv = rows.map(r => r.join(',')).join('\n')
  const outPath = resolve(process.cwd(), 'scripts/missing-details.csv')
  writeFileSync(outPath, csv, 'utf-8')

  console.log(`\n✓ Exported ${rowCount} rows to scripts/missing-details.csv`)
  console.log('Open in Numbers/Excel, fill in the blanks, save as CSV, then run:')
  console.log('  node scripts/import-missing-details.mjs')
}

main().catch(err => { console.error(err); process.exit(1) })

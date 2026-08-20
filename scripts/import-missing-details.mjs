/**
 * import-missing-details.mjs
 * Reads the filled-in scripts/missing-details.csv and patches Sanity contacts.
 * Only updates fields that have a value in the CSV (blank cells are ignored).
 *
 * Run: node scripts/import-missing-details.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

function parseCSV(text) {
  const lines = text.trim().split('\n')
  // Auto-detect delimiter: semicolon (European Numbers export) or comma
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','
  const headers = parseCSVLine(firstLine, delimiter)
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line, delimiter)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function parseCSVLine(line, delimiter = ',') {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

async function main() {
  const csvPath = resolve(process.cwd(), 'scripts/missing-details.csv')
  const text = readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(text)

  console.log(`=== import-missing-details.mjs — ${rows.length} rows ===\n`)

  // Group rows by contact_id
  const byContact = {}
  for (const row of rows) {
    const id = row.contact_id
    if (!id) continue
    if (!byContact[id]) byContact[id] = []
    byContact[id].push(row)
  }

  let ok = 0, skipped = 0, failed = 0

  for (const [contactId, contactRows] of Object.entries(byContact)) {
    // Fetch current contact
    const contact = await client.fetch(
      `*[_id == $id][0]{ _id, firstName, lastName, email, purchases }`,
      { id: contactId }
    )
    if (!contact) {
      console.warn(`⚠  Contact not found: ${contactId}`)
      failed++
      continue
    }

    let patch = client.patch(contactId)
    let changed = false

    // Update contact-level fields from first row
    const firstRow = contactRows[0]

    if (firstRow.email && firstRow.email !== contact.email) {
      patch = patch.set({ email: firstRow.email })
      changed = true
    }
    if (firstRow.first_name && firstRow.first_name !== 'Unknown' && firstRow.first_name !== contact.firstName) {
      patch = patch.set({ firstName: firstRow.first_name })
      changed = true
    }
    if (firstRow.last_name && firstRow.last_name !== contact.lastName) {
      patch = patch.set({ lastName: firstRow.last_name })
      changed = true
    }

    // Update purchase-level fields
    const purchases = contact.purchases ?? []
    for (const row of contactRows) {
      if (!row.purchase_key) continue
      const pIdx = purchases.findIndex(p => p._key === row.purchase_key)
      if (pIdx === -1) {
        console.warn(`  ⚠  Purchase key not found: ${row.purchase_key} on ${contactId}`)
        continue
      }

      if (row.copy_number) {
        patch = patch.set({ [`purchases[${pIdx}].copyNumber`]: row.copy_number })
        changed = true
      }
      if (row.date) {
        patch = patch.set({ [`purchases[${pIdx}].date`]: row.date })
        changed = true
      }
      if (row.price !== '' && !isNaN(Number(row.price))) {
        patch = patch.set({ [`purchases[${pIdx}].price`]: Number(row.price) })
        changed = true
      }
      if (row.sold_via) {
        patch = patch.set({ [`purchases[${pIdx}].soldVia`]: row.sold_via })
        changed = true
      }
    }

    if (!changed) {
      skipped++
      continue
    }

    try {
      await patch.commit()
      const name = [firstRow.first_name, firstRow.last_name].filter(Boolean).join(' ')
      console.log(`✓  ${name || contactId}`)
      ok++
    } catch (err) {
      console.error(`✗  ${contactId}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} updated, ${skipped} unchanged, ${failed} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })

/**
 * find-duplicate-contacts.mjs
 * Reports all duplicate contacts grouped by name or email.
 * Run: node scripts/find-duplicate-contacts.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const all = await client.fetch(
  `*[_type == "contact"] | order(lastName asc, firstName asc) {
    _id, firstName, lastName, email, city, country, type, purchases
  }`
)

console.log(`Total contacts: ${all.length}\n`)

// Group by normalised "firstname lastname" (lowercase, trimmed)
const byName = {}
for (const c of all) {
  const key = `${(c.firstName ?? '').trim().toLowerCase()} ${(c.lastName ?? '').trim().toLowerCase()}`.trim()
  if (!key || key === ' ') continue
  if (!byName[key]) byName[key] = []
  byName[key].push(c)
}

// Group by email
const byEmail = {}
for (const c of all) {
  if (!c.email) continue
  const key = c.email.trim().toLowerCase()
  if (!byEmail[key]) byEmail[key] = []
  byEmail[key].push(c)
}

const nameDupes  = Object.entries(byName).filter(([, v]) => v.length > 1)
const emailDupes = Object.entries(byEmail).filter(([, v]) => v.length > 1)

console.log(`=== DUPLICATES BY NAME (${nameDupes.length} groups) ===\n`)
for (const [name, contacts] of nameDupes) {
  console.log(`"${name}" — ${contacts.length}x`)
  for (const c of contacts) {
    const loc = [c.city, c.country].filter(Boolean).join(', ')
    console.log(`  ${c._id}  email=${c.email ?? '—'}  ${loc ? loc : ''}  purchases=${c.purchases?.length ?? 0}  type=${c.type ?? '—'}`)
  }
  console.log()
}

console.log(`=== DUPLICATES BY EMAIL (${emailDupes.length} groups) ===\n`)
for (const [email, contacts] of emailDupes) {
  console.log(`${email} — ${contacts.length}x`)
  for (const c of contacts) {
    console.log(`  ${c._id}  name="${c.firstName ?? ''} ${c.lastName ?? ''}"  purchases=${c.purchases?.length ?? 0}`)
  }
  console.log()
}

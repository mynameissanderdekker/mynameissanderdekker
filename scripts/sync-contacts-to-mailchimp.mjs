/**
 * Eenmalig sync script: Sanity → Mailchimp
 *
 * - Haalt alle subscribers op uit Mailchimp
 * - Haalt alle contacten op uit Sanity
 * - Voegt alleen ONTBREKENDE contacten toe aan Mailchimp (bestaande worden niet aangeraakt)
 * - Behoudt alle historische data (subscribe date, click rates) in Mailchimp
 *
 * Gebruik: node scripts/sync-contacts-to-mailchimp.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import crypto from 'crypto'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const MAILCHIMP_API_KEY   = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE  = process.env.MAILCHIMP_AUDIENCE_ID
const DC                  = MAILCHIMP_API_KEY.split('-')[1]
const BASE                = `https://${DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE}`
const AUTH                = 'Basic ' + Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')

const TYPE_TAGS = {
  collector:        'Collector',
  webshop_customer: 'Webshop',
  gallery:          'Gallery',
  journalist:       'Press',
  artist:           'Artist',
  newsletter:       'Newsletter',
  other:            'Other',
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

function md5(email) {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
}

// ── Haal alle bestaande Mailchimp emails op ───────────────────────────────────
async function fetchMailchimpEmails() {
  const emails = new Set()
  let offset = 0
  const count = 1000

  while (true) {
    const res = await fetch(
      `${BASE}/members?count=${count}&offset=${offset}&fields=members.email_address,total_items`,
      { headers: { Authorization: AUTH } }
    )
    const data = await res.json()

    if (!res.ok) {
      console.error('Mailchimp fout:', data)
      process.exit(1)
    }

    for (const m of data.members ?? []) {
      emails.add(m.email_address.toLowerCase().trim())
    }

    console.log(`  Mailchimp: ${emails.size} / ${data.total_items} geladen…`)

    if (offset + count >= data.total_items) break
    offset += count
  }

  return emails
}

// Placeholder domeinen nooit syncen
const PLACEHOLDER_DOMAINS = ['.placeholder', '.test', '.example', '.invalid', '.local']
function isRealEmail(email) {
  const domain = email.split('@')[1] ?? ''
  return !PLACEHOLDER_DOMAINS.some(d => domain.endsWith(d))
}

// ── Voeg een contact toe aan Mailchimp ────────────────────────────────────────
async function addToMailchimp(contact) {
  const hash   = md5(contact.email)
  const status = contact.subscribed === false ? 'unsubscribed' : 'subscribed'

  // Upsert member (PUT is safe — maakt aan als nieuw)
  const res = await fetch(`${BASE}/members/${hash}`, {
    method: 'PUT',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_address:  contact.email.toLowerCase().trim(),
      status_if_new:  status,
      status,
      merge_fields: {
        FNAME:   contact.firstName?.trim() || ' ',
        LNAME:   contact.lastName?.trim()  || ' ',
        COUNTRY: contact.country           ?? '',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.warn(`  ⚠ ${contact.email}: ${err.detail ?? err.title}`)
    return false
  }

  // Tags
  const tags = []
  if (contact.type && TYPE_TAGS[contact.type]) {
    tags.push({ name: TYPE_TAGS[contact.type], status: 'active' })
  }
  if (contact.subscribed !== false) {
    tags.push({ name: 'Newsletter', status: 'active' })
  }

  if (tags.length > 0) {
    await fetch(`${BASE}/members/${hash}/tags`, {
      method: 'POST',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
  }

  return true
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('1. Bestaande Mailchimp subscribers ophalen…')
  const existing = await fetchMailchimpEmails()
  console.log(`   → ${existing.size} emails al in Mailchimp\n`)

  console.log('2. Sanity contacten ophalen…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(email)]{
      firstName, lastName, email, type, country, subscribed
    } | order(lastName asc)`
  )
  console.log(`   → ${contacts.length} contacten in Sanity\n`)

  // Vergelijk — sla placeholder emails over
  const missing = contacts.filter(c =>
    isRealEmail(c.email) && !existing.has(c.email.toLowerCase().trim())
  )
  const skipped = contacts.length - missing.length

  console.log(`3. Vergelijking:`)
  console.log(`   Al in Mailchimp: ${skipped}`)
  console.log(`   Toe te voegen:   ${missing.length}\n`)

  if (missing.length === 0) {
    console.log('✅ Alles al gesynchroniseerd!')
    return
  }

  console.log('4. Ontbrekende contacten toevoegen…')
  let added = 0
  let failed = 0

  for (const contact of missing) {
    const ok = await addToMailchimp(contact)
    if (ok) {
      console.log(`   ✓ ${contact.email}`)
      added++
    } else {
      failed++
    }
  }

  console.log(`\n✅ Klaar! ${added} toegevoegd, ${failed} mislukt, ${skipped} al aanwezig.`)
}

run().catch(err => { console.error(err); process.exit(1) })

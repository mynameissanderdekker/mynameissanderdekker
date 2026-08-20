/**
 * Bulk sync all Sanity contacts → Mailchimp
 * Run with: node scripts/sync-all-contacts-to-mailchimp.mjs
 */

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const MAILCHIMP_API_KEY  = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE = process.env.MAILCHIMP_AUDIENCE_ID
const DC = MAILCHIMP_API_KEY.split('-')[1]

const TYPE_TAGS = {
  collector:        'Collector',
  webshop_customer: 'Webshop',
  gallery:          'Gallery',
  journalist:       'Press',
  artist:           'Artist',
  newsletter:       'Newsletter',
  other:            'Other',
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

function hash(email) {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
}

function auth() {
  return 'Basic ' + Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')
}

async function syncContact(contact) {
  const email = contact.email?.toLowerCase().trim()
  if (!email || email.includes('.placeholder') || email.includes('.test')) return { skipped: true }

  const status = contact.subscribed === false ? 'unsubscribed' : 'subscribed'

  const memberRes = await fetch(
    `https://${DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE}/members/${hash(email)}`,
    {
      method: 'PUT',
      headers: { Authorization: auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_address: email,
        status_if_new: status,
        status,
        merge_fields: {
          FNAME:   contact.firstName?.trim() || ' ',
          LNAME:   contact.lastName?.trim()  || ' ',
          COUNTRY: contact.country           || '',
        },
      }),
    }
  )

  if (!memberRes.ok) {
    const err = await memberRes.text()
    return { ok: false, error: err }
  }

  // Apply tags
  const tags = []
  if (contact.type && TYPE_TAGS[contact.type]) tags.push({ name: TYPE_TAGS[contact.type], status: 'active' })
  if (contact.subscribed !== false) tags.push({ name: 'Newsletter', status: 'active' })
  else tags.push({ name: 'Newsletter', status: 'inactive' })

  await fetch(
    `https://${DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE}/members/${hash(email)}/tags`,
    {
      method: 'POST',
      headers: { Authorization: auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    }
  )

  return { ok: true }
}

async function main() {
  console.log('Fetching contacts from Sanity...')
  const contacts = await client.fetch(
    `*[_type == "contact" && defined(email)]{ _id, firstName, lastName, email, type, country, subscribed }`
  )
  console.log(`Found ${contacts.length} contacts\n`)

  let ok = 0, failed = 0, skipped = 0

  for (const contact of contacts) {
    const result = await syncContact(contact)
    if (result.skipped) {
      skipped++
      console.log(`  SKIP  ${contact.email}`)
    } else if (result.ok) {
      ok++
      console.log(`  ✓  ${contact.email} [${contact.type || 'no type'}]`)
    } else {
      failed++
      console.log(`  ✗  ${contact.email} — ${result.error?.slice(0, 80)}`)
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\nDone: ${ok} synced, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)

/**
 * Verwijdert placeholder subscribers uit Mailchimp.
 * Gebruik: node scripts/cleanup-mailchimp-placeholders.mjs
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import crypto from 'crypto'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const API_KEY  = process.env.MAILCHIMP_API_KEY
const AUDIENCE = process.env.MAILCHIMP_AUDIENCE_ID
const DC       = API_KEY.split('-')[1]
const BASE     = `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE}`
const AUTH     = 'Basic ' + Buffer.from(`anystring:${API_KEY}`).toString('base64')

const PLACEHOLDER_DOMAINS = ['.placeholder', '.test', '.example', '.invalid', '.local']

function md5(email) {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
}

function isPlaceholder(email) {
  const domain = email.split('@')[1] ?? ''
  return PLACEHOLDER_DOMAINS.some(d => domain.endsWith(d))
}

async function run() {
  console.log('Ophalen van alle Mailchimp subscribers…')

  const placeholders = []
  let offset = 0

  while (true) {
    const res = await fetch(
      `${BASE}/members?count=1000&offset=${offset}&fields=members.email_address,members.id,total_items`,
      { headers: { Authorization: AUTH } }
    )
    const data = await res.json()
    const total = data.total_items

    for (const m of data.members ?? []) {
      if (isPlaceholder(m.email_address)) {
        placeholders.push(m.email_address)
      }
    }

    if (offset + 1000 >= total) break
    offset += 1000
  }

  if (placeholders.length === 0) {
    console.log('✅ Geen placeholder subscribers gevonden.')
    return
  }

  console.log(`\nGevonden placeholder subscribers (${placeholders.length}):`)
  placeholders.forEach(e => console.log(`  - ${e}`))
  console.log()

  for (const email of placeholders) {
    const hash = md5(email)
    // DELETE archiveert in Mailchimp (soft delete — niet permanent)
    const res = await fetch(`${BASE}/members/${hash}`, {
      method: 'DELETE',
      headers: { Authorization: AUTH },
    })
    // DELETE geeft 204 No Content terug bij succes
    if (res.ok || res.status === 204) {
      console.log(`  ✓ Gearchiveerd: ${email}`)
    } else {
      console.warn(`  ⚠ Mislukt: ${email}`, await res.text())
    }
  }

  console.log('\n✅ Klaar.')
}

run().catch(err => { console.error(err); process.exit(1) })

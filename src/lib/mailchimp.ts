/**
 * Mailchimp sync utility.
 *
 * Required env vars:
 *   MAILCHIMP_API_KEY      — full key, e.g. "abc123-us15"
 *   MAILCHIMP_AUDIENCE_ID  — your list/audience ID
 */

import crypto from 'crypto'

// ── Tag mapping: Sanity contact type → Mailchimp tag ─────────────────────────
const TYPE_TAGS: Record<string, string> = {
  collector:        'Collector',
  webshop_customer: 'Webshop',
  gallery:          'Gallery',
  journalist:       'Press',
  artist:           'Artist',
  newsletter:       'Newsletter',
  other:            'Other',
}

export interface MailchimpContact {
  email: string
  firstName?: string
  lastName?: string
  type?: string       // Sanity contact type
  country?: string    // ISO-2 code
  subscribed?: boolean
}

function getDc(): string {
  // API key format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us15"
  return (process.env.MAILCHIMP_API_KEY ?? '').split('-')[1] ?? 'us1'
}

function subscriberHash(email: string): string {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
}

function auth(): string {
  return 'Basic ' + Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString('base64')
}

function base(): string {
  return `https://${getDc()}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}`
}

/**
 * Upsert a contact in Mailchimp and apply tags.
 * Safe to call multiple times — uses PUT so it creates or updates.
 */
// Domains that should never be synced to Mailchimp
const PLACEHOLDER_DOMAINS = ['.placeholder', '.test', '.example', '.invalid', '.local']

function isRealEmail(email: string): boolean {
  const domain = email.split('@')[1] ?? ''
  return !PLACEHOLDER_DOMAINS.some(d => domain.endsWith(d))
}

export async function syncToMailchimp(contact: MailchimpContact): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_AUDIENCE_ID) {
    console.warn('[mailchimp] MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID not set — skipping sync')
    return { ok: false, error: 'Mailchimp not configured' }
  }

  if (!isRealEmail(contact.email)) {
    console.warn(`[mailchimp] skipping placeholder email: ${contact.email}`)
    return { ok: false, error: 'Placeholder email skipped' }
  }

  const hash   = subscriberHash(contact.email)
  const status = contact.subscribed === false ? 'unsubscribed' : 'subscribed'

  // ── 1. Upsert member ───────────────────────────────────────────────────────
  const memberRes = await fetch(`${base()}/members/${hash}`, {
    method: 'PUT',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_address:  contact.email.toLowerCase().trim(),
      status_if_new:  status,
      status,
      merge_fields: {
        // Send a single space if empty — avoids "required merge field" rejection
        FNAME:   contact.firstName?.trim() || ' ',
        LNAME:   contact.lastName?.trim()  || ' ',
        COUNTRY: contact.country           ?? '',
      },
    }),
  })

  if (!memberRes.ok) {
    const body = await memberRes.text()
    console.error('[mailchimp] member upsert failed:', body)
    return { ok: false, error: body }
  }

  // ── 2. Apply tags ──────────────────────────────────────────────────────────
  const tags: { name: string; status: 'active' | 'inactive' }[] = []

  // Type tag
  if (contact.type && TYPE_TAGS[contact.type]) {
    tags.push({ name: TYPE_TAGS[contact.type], status: 'active' })
  }

  // Newsletter tag — anyone who's subscribed gets this
  if (contact.subscribed !== false) {
    tags.push({ name: 'Newsletter', status: 'active' })
  } else {
    tags.push({ name: 'Newsletter', status: 'inactive' })
  }

  if (tags.length > 0) {
    const tagRes = await fetch(`${base()}/members/${hash}/tags`, {
      method: 'POST',
      headers: { Authorization: auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
    if (!tagRes.ok) {
      console.error('[mailchimp] tag update failed:', await tagRes.text())
    }
  }

  return { ok: true }
}

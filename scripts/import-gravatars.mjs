/**
 * import-gravatars.mjs
 *
 * Haalt profielfoto's op via Gravatar voor alle contacten zonder foto.
 * Gravatar koppelt een foto aan een e-mailadres — veel mensen hebben er een.
 *
 * Gebruik:
 *   node scripts/import-gravatars.mjs
 *
 * Wat het doet:
 *  1. Haalt alle contacten op zonder `photo`-veld
 *  2. Berekent de MD5-hash van het e-mailadres (Gravatar-standaard)
 *  3. Checkt of er een foto beschikbaar is (d=404 geeft 404 terug als er geen is)
 *  4. Download de foto en upload naar Sanity als image-asset
 *  5. Koppelt de asset aan het contact
 */

import { createClient } from '@sanity/client'
import { createHash } from 'crypto'
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

function gravatarHash(email) {
  return createHash('md5').update(email.trim().toLowerCase()).digest('hex')
}

async function fetchGravatar(email) {
  const hash = gravatarHash(email)
  // d=404: geeft HTTP 404 terug als er geen avatar is (in plaats van een placeholder)
  // s=400: vraag 400×400px op
  const url = `https://www.gravatar.com/avatar/${hash}?d=404&s=400`

  const res = await fetch(url)
  if (!res.ok) return null // Geen Gravatar gevonden

  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer
}

async function main() {
  console.log('🔍  Contacten ophalen zonder foto…')

  const contacts = await sanity.fetch(
    `*[_type == "contact" && !defined(photo)]{ _id, email, firstName, lastName }`
  )

  console.log(`   ${contacts.length} contacten te controleren\n`)

  let found = 0, notFound = 0, errors = 0

  for (const contact of contacts) {
    if (!contact.email) { notFound++; continue }

    try {
      const imageBuffer = await fetchGravatar(contact.email)

      if (!imageBuffer) {
        process.stdout.write(`· geen foto: ${contact.email}\n`)
        notFound++
      } else {
        // Upload naar Sanity
        const asset = await sanity.assets.upload('image', imageBuffer, {
          filename: `gravatar-${gravatarHash(contact.email)}.jpg`,
          contentType: 'image/jpeg',
        })

        // Koppel aan contact
        await sanity.patch(contact._id).set({
          photo: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
        }).commit({ visibility: 'async' })

        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
        process.stdout.write(`✓ foto gevonden: ${name} (${contact.email})\n`)
        found++
      }
    } catch (err) {
      console.error(`⚠️  ${contact.email}: ${err.message}`)
      errors++
    }

    // Pauze: Gravatar heeft rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Foto's gevonden:     ${found}`)
  console.log(`   Geen Gravatar:       ${notFound}`)
  if (errors > 0) console.log(`   Fouten:             ${errors}`)
  console.log('\n💡  Contacten zonder foto kun je handmatig een foto geven in Sanity Studio.')
}

main().catch(console.error)

/**
 * import-instagram-photos.mjs
 *
 * Haalt Instagram-profielfoto's op via unavatar.io voor contacten
 * die een instagram-gebruikersnaam hebben maar nog geen foto.
 *
 * Gebruik:
 *   node scripts/import-instagram-photos.mjs
 */

import { createClient } from '@sanity/client'
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

async function fetchAvatar(username) {
  const url = `https://unavatar.io/instagram/${username}?json`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return null

  const data = await res.json()
  if (!data?.url || data.url.includes('fallback') || data.url.includes('unavatar.io/fallback')) {
    return null
  }

  // Download de foto
  const imgRes = await fetch(data.url)
  if (!imgRes.ok) return null

  return Buffer.from(await imgRes.arrayBuffer())
}

async function main() {
  console.log('📋  Contacten ophalen met Instagram maar zonder foto…')

  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(instagram) && !defined(photo)]
     { _id, firstName, lastName, instagram }`
  )

  console.log(`   ${contacts.length} contacten te verwerken\n`)

  let found = 0, notFound = 0, errors = 0

  for (const contact of contacts) {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    process.stdout.write(`→ @${contact.instagram} (${name})… `)

    try {
      const buffer = await fetchAvatar(contact.instagram)

      if (!buffer) {
        process.stdout.write('geen foto\n')
        notFound++
      } else {
        const asset = await sanity.assets.upload('image', buffer, {
          filename: `instagram-${contact.instagram}.jpg`,
          contentType: 'image/jpeg',
        })

        await sanity.patch(contact._id).set({
          photo: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
          },
        }).commit({ visibility: 'async' })

        process.stdout.write('✓\n')
        found++
      }
    } catch (err) {
      process.stdout.write(`fout: ${err.message}\n`)
      errors++
    }

    // Pauze — unavatar.io heeft rate limits
    await new Promise(r => setTimeout(r, 600))
  }

  console.log('\n✅  Klaar!')
  console.log(`   Foto's gevonden:  ${found}`)
  console.log(`   Geen foto:        ${notFound}`)
  if (errors > 0) console.log(`   Fouten:          ${errors}`)
}

main().catch(console.error)

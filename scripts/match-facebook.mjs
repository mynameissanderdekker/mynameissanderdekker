/**
 * match-facebook.mjs
 *
 * Koppelt Facebook-vrienden aan bestaande Sanity-contacten op basis van naam.
 * Voegt GEEN nieuwe contacten toe — alleen aanvullen.
 *
 * Gebruik:
 *   node scripts/match-facebook.mjs
 *
 * Uitvoer:
 *   - Past hoge-zekerheid-matches direct toe in Sanity (facebook field)
 *   - Schrijft scripts/facebook/review.csv voor twijfelgevallen
 */

import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
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

const FB_DIR = '/Users/sanderdekker/Downloads/connections-2'

// ── Naam normalisatie ─────────────────────────────────────────────────────────

function normalize(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // verwijder diakritische tekens
    .replace(/[^a-z0-9]/g, '')          // alleen letters en cijfers
}

// ── Match-logica ──────────────────────────────────────────────────────────────

function scoreMatch(fbName, contact) {
  const fbNorm = normalize(fbName)
  const firstName = normalize(contact.firstName ?? '')
  const lastName  = normalize(contact.lastName  ?? '')
  const fullName  = firstName + lastName
  const fullNameRev = lastName + firstName

  // Exacte volledige naam
  if (fbNorm === fullName || fbNorm === fullNameRev) return 100

  // Facebook naam bevat voor + achternaam
  if (fbNorm.includes(fullName) && fullName.length >= 5) return 88
  if (fbNorm.includes(fullNameRev) && fullNameRev.length >= 5) return 88

  // Volledige naam bevat facebook naam
  if (fullName.includes(fbNorm) && fbNorm.length >= 6) return 80

  // Alleen voornaam (minimaal 5 tekens, achternaam moet ook kloppen)
  const fbParts = fbName.toLowerCase().split(/\s+/)
  const fbFirst = normalize(fbParts[0] ?? '')
  const fbLast  = normalize(fbParts[fbParts.length - 1] ?? '')

  if (fbFirst === firstName && fbLast === lastName) return 100
  if (fbFirst === firstName && lastName.length >= 4 && fbNorm.includes(lastName.slice(0, 4))) return 85
  if (fbFirst === firstName && firstName.length >= 5) return 45

  return 0
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────

async function main() {
  console.log('📥  Facebook-vrienden inlezen…')
  const friendsData = JSON.parse(readFileSync(join(FB_DIR, 'friends/your_friends.json'), 'utf-8'))
  const friends = friendsData.friends_v2 ?? []
  console.log(`   ${friends.length} vrienden geladen`)

  console.log('\n📋  Contacten ophalen uit Sanity…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(firstName)]{ _id, firstName, lastName, email, facebook }`,
  )
  console.log(`   ${contacts.length} contacten geladen\n`)

  const autoApplied = []
  const review      = []

  for (const contact of contacts) {
    if (contact.facebook) continue  // al ingevuld

    let bestScore = 0
    let bestFriend = null

    for (const friend of friends) {
      const score = scoreMatch(friend.name, contact)
      if (score > bestScore) {
        bestScore = score
        bestFriend = friend
      }
    }

    if (bestScore >= 90) {
      autoApplied.push({ contact, friend: bestFriend, score: bestScore })
    } else if (bestScore >= 45) {
      review.push({ contact, friend: bestFriend, score: bestScore })
    }
  }

  // ── Automatisch toepassen (score ≥ 90) ───────────────────────────────────────
  console.log(`✅  Hoge zekerheid (score ≥ 90): ${autoApplied.length} matches`)

  for (const { contact, friend, score } of autoApplied) {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    const searchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(friend.name)}`
    try {
      await sanity.patch(contact._id).set({ facebook: searchUrl }).commit({ visibility: 'async' })
      console.log(`   ✓ ${name} → ${friend.name} (score: ${score})`)
    } catch (err) {
      console.error(`   ⚠️  ${name}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 100))
  }

  // ── Review CSV ────────────────────────────────────────────────────────────────
  console.log(`\n⚠️   Twijfelgevallen (score 45–89): ${review.length} — zie facebook/review.csv`)

  mkdirSync(join(__dirname, 'facebook'), { recursive: true })

  const csvLines = [
    'Contact naam,E-mail,Facebook naam,Score,Facebook zoek-URL,Bevestigen? (ja/nee)',
    ...review.map(({ contact, friend, score }) => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
      const url = `https://www.facebook.com/search/people/?q=${encodeURIComponent(friend.name)}`
      return `"${name}","${contact.email ?? ''}","${friend.name}",${score},"${url}",""`
    }),
  ]

  const csvPath = join(__dirname, 'facebook/review.csv')
  writeFileSync(csvPath, csvLines.join('\n'), 'utf-8')

  console.log(`   Opgeslagen: scripts/facebook/review.csv`)
  console.log(`\n📊  Samenvatting`)
  console.log(`   Automatisch gekoppeld: ${autoApplied.length}`)
  console.log(`   Handmatig nakijken:    ${review.length}`)
}

main().catch(console.error)

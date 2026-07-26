/**
 * match-instagram.mjs
 *
 * Koppelt Instagram-gebruikersnamen aan bestaande Sanity-contacten op basis van naam.
 * Voegt GEEN nieuwe contacten toe — alleen aanvullen.
 *
 * Gebruik:
 *   node scripts/match-instagram.mjs
 *
 * Uitvoer:
 *   - Past hoge-zekerheid-matches direct toe in Sanity
 *   - Schrijft scripts/instagram/review.csv voor twijfelgevallen (handmatig nakijken)
 */

import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'fs'
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

const IG_DIR = join(__dirname, 'instagram')

// ── Instagram-data inlezen ────────────────────────────────────────────────────

function loadFollowers() {
  const usernames = new Set()

  // followers_1.json + followers_2.json: [{string_list_data: [{value: username}]}]
  for (const file of ['followers_1.json', 'followers_2.json']) {
    try {
      const data = JSON.parse(readFileSync(join(IG_DIR, file), 'utf-8'))
      for (const entry of data) {
        const username = entry.string_list_data?.[0]?.value
        if (username) usernames.add(username.toLowerCase())
      }
    } catch { /* bestand niet gevonden */ }
  }

  return usernames
}

function loadFollowing() {
  const usernames = new Set()
  try {
    const data = JSON.parse(readFileSync(join(IG_DIR, 'following.json'), 'utf-8'))
    const list = data.relationships_following ?? []
    for (const entry of list) {
      const username = entry.title
      if (username) usernames.add(username.toLowerCase())
    }
  } catch { /* bestand niet gevonden */ }
  return usernames
}

// ── Naam normalisatie ─────────────────────────────────────────────────────────

// "Stefan Meier" → "stefanmeier"
function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// "stefan.meier_photo" → "stefanmeierphoto"
function normalizeUsername(username) {
  return username.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Eerste deel van username voor voor-naam matching: "stefan.meier" → "stefan"
function usernameFirstPart(username) {
  return username.split(/[._\-]/)[0].toLowerCase()
}

// ── Match-logica ──────────────────────────────────────────────────────────────

function scoreMatch(username, contact) {
  const uNorm = normalizeUsername(username)
  const firstName = normalizeName(contact.firstName ?? '')
  const lastName  = normalizeName(contact.lastName  ?? '')
  const fullName  = firstName + lastName
  const fullNameRev = lastName + firstName

  // Exacte match op voor+achternaam
  if (uNorm === fullName || uNorm === fullNameRev) return 100

  // Username bevat volledige naam
  if (uNorm.includes(fullName) && fullName.length >= 6) return 85
  if (uNorm.includes(fullNameRev) && fullNameRev.length >= 6) return 85

  // Naam bevat username (korte usernames kunnen ruis geven, minimum 5 tekens)
  if (fullName.includes(uNorm) && uNorm.length >= 5) return 75
  if (fullNameRev.includes(uNorm) && uNorm.length >= 5) return 75

  // Eerste deel van username = voornaam + achternaam begint ermee
  const uFirst = usernameFirstPart(username)
  if (uFirst === firstName && lastName.length >= 4 && uNorm.includes(lastName.slice(0, 4))) return 70

  // Alleen voornaam match (alleen voor zeldzame namen, min 5 tekens)
  if (uFirst === firstName && firstName.length >= 5) return 40

  return 0
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────

async function main() {
  console.log('📥  Instagram-data inlezen…')
  const followers = loadFollowers()
  const following = loadFollowing()

  // Combineer: volgers + volgenden (uniek)
  const allUsernames = new Set([...followers, ...following])
  console.log(`   ${followers.size} volgers, ${following.size} volgenden → ${allUsernames.size} unieke accounts`)

  // Welke staan in beide? (mutual) — die zijn de meest waarschijnlijke matches
  const mutual = new Set([...followers].filter(u => following.has(u)))
  console.log(`   ${mutual.size} mutual accounts (volg jij + volgen jou)`)

  console.log('\n📋  Contacten ophalen uit Sanity…')
  const contacts = await sanity.fetch(
    `*[_type == "contact" && defined(firstName)]{ _id, firstName, lastName, email, instagram }`,
  )
  console.log(`   ${contacts.length} contacten geladen`)

  const results = {
    autoApplied: [],   // score >= 85, direct bijgewerkt
    review:      [],   // score 40–84, handmatig nakijken
    noMatch:     [],   // geen match gevonden
  }

  // Per contact zoeken naar beste Instagram-match
  for (const contact of contacts) {
    if (contact.instagram) continue // Al ingevuld, overslaan

    let bestScore = 0
    let bestUsername = null

    for (const username of allUsernames) {
      const score = scoreMatch(username, contact)
      if (score > bestScore) {
        bestScore = score
        bestUsername = username
      }
    }

    const isMutual = bestUsername ? mutual.has(bestUsername) : false
    // Mutual-accounts krijgen +10 bonus
    const finalScore = bestUsername && isMutual ? Math.min(bestScore + 10, 100) : bestScore

    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')

    if (finalScore >= 85) {
      results.autoApplied.push({ contact, username: bestUsername, score: finalScore, mutual: isMutual })
    } else if (finalScore >= 40) {
      results.review.push({ contact, username: bestUsername, score: finalScore, mutual: isMutual })
    } else {
      results.noMatch.push({ contact, fullName })
    }
  }

  // ── Automatisch toepassen (score ≥ 85) ───────────────────────────────────────
  console.log(`\n✅  Hoge zekerheid (score ≥ 85): ${results.autoApplied.length} matches`)

  for (const { contact, username, score, mutual } of results.autoApplied) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    try {
      await sanity.patch(contact._id).set({ instagram: username }).commit({ visibility: 'async' })
      console.log(`   ✓ ${fullName} → @${username} (score: ${score}${mutual ? ', mutual' : ''})`)
    } catch (err) {
      console.error(`   ⚠️  ${fullName}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 100))
  }

  // ── Review CSV schrijven ──────────────────────────────────────────────────────
  console.log(`\n⚠️   Twijfelgevallen (score 40–84): ${results.review.length} — zie instagram/review.csv`)

  const csvLines = [
    'Naam,E-mail,Gesuggereerde username,Score,Mutual,Instagram URL,Bevestigen? (ja/nee)',
    ...results.review.map(({ contact, username, score, mutual }) => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
      const url = username ? `https://instagram.com/${username}` : ''
      return `"${name}","${contact.email ?? ''}","${username ?? ''}",${score},${mutual ? 'ja' : 'nee'},"${url}",""`
    }),
  ]

  const csvPath = join(IG_DIR, 'review.csv')
  writeFileSync(csvPath, csvLines.join('\n'), 'utf-8')
  console.log(`   Opgeslagen: scripts/instagram/review.csv`)
  console.log(`   Open het bestand, check de links, zet "ja" bij de juiste en draai:`)
  console.log(`   node scripts/apply-instagram-review.mjs`)

  console.log(`\n📊  Samenvatting`)
  console.log(`   Automatisch gekoppeld: ${results.autoApplied.length}`)
  console.log(`   Handmatig nakijken:    ${results.review.length}`)
  console.log(`   Geen match:            ${results.noMatch.length}`)
}

main().catch(console.error)

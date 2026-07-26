/**
 * add-nyc-rooftop.mjs
 *
 * Voegt het artwork "NYC Rooftop" toe + 5 aankopen via bijbehorende contacten.
 * Bestaande contacten worden bijgewerkt; nieuwe worden aangemaakt.
 *
 * Gebruik: node scripts/add-nyc-rooftop.mjs [--dry-run]
 */

import { createClient } from '@sanity/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ── Artwork ───────────────────────────────────────────────────────────────────

const ARTWORK = {
  _type: 'artwork',
  title: 'NYC Rooftop',
  slug: { _type: 'slug', current: 'nyc-rooftop' },
  medium: 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass',
  editionTotal: 10,
  editionAP: 2,
  status: 'enquire',
  showInWorks: true,
  showInWebshop: false,
  featured: false,
}

// ── Aankopen ──────────────────────────────────────────────────────────────────
// Formaat: { contact: {...}, purchase: {...} }

const SALES = [
  {
    contact: {
      firstName: 'Men at Work',
      lastName: '',
      email: 'info@menatwork.nl',
      type: 'gallery',
      company: 'Men at Work',
    },
    purchase: { copyNumber: '1/10 — 90×60 cm', soldVia: 'direct',   price: 900 },
  },
  {
    contact: {
      firstName: 'Onbekende klant',
      lastName: '(Walls Gallery)',
      email: 'klant-nyc-2of10@walls-gallery.placeholder',
      type: 'collector',
      notes: 'Anonieme koper via Walls Gallery — NYC Rooftop 2/10',
    },
    purchase: { copyNumber: '2/10 — 90×60 cm', soldVia: 'gallery', price: 600 },
  },
  {
    contact: {
      firstName: "G&T's Amsterdam",
      lastName: '',
      email: 'info@gts-amsterdam.nl',
      type: 'gallery',
      company: "G&T's Amsterdam",
    },
    purchase: { copyNumber: '4/10 — 90×60 cm', soldVia: 'gallery', price: 400 },
  },
  {
    contact: {
      firstName: 'Onbekende klant',
      lastName: '(Walls Gallery 2)',
      email: 'klant-nyc-5of10@walls-gallery.placeholder',
      type: 'collector',
      notes: 'Anonieme koper via Walls Gallery — NYC Rooftop 5/10',
    },
    purchase: { copyNumber: '5/10 — 45×30 cm', soldVia: 'gallery', price: 350 },
  },
  {
    contact: {
      firstName: 'Elena',
      lastName: 'Köstler',
      email: 'elena.kostler@placeholder.local',
      type: 'collector',
    },
    purchase: { copyNumber: '7/10 — 45×30 cm', soldVia: 'direct',  price: 0 },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function randKey() {
  return Math.random().toString(36).slice(2, 10)
}

async function findContact(contacts, { firstName, lastName, email }) {
  // 1. Exacte email match
  const byEmail = contacts.find(c => c.email?.toLowerCase() === email.toLowerCase())
  if (byEmail) return byEmail

  // 2. Naam match
  const fullName = normalize(`${firstName}${lastName}`)
  const byName = contacts.find(c => {
    const cn = normalize(`${c.firstName ?? ''}${c.lastName ?? ''}`)
    return cn && cn === fullName
  })
  return byName ?? null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — geen wijzigingen\n' : '🚀  Starten…\n')

  // 1. Bestaand artwork ophalen of aanmaken
  const existing = await sanity.fetch(
    `*[_type == "artwork" && slug.current == "nyc-rooftop"][0]{ _id, title }`
  )

  let artworkId
  if (existing) {
    artworkId = existing._id
    console.log(`✓  Artwork al aanwezig: "${existing.title}" (${artworkId})`)
  } else {
    console.log('📸  Artwork "NYC Rooftop" aanmaken…')
    if (!DRY_RUN) {
      const created = await sanity.create(ARTWORK)
      artworkId = created._id
      console.log(`✓  Artwork aangemaakt: ${artworkId}`)
    } else {
      artworkId = 'DRY-RUN-ARTWORK-ID'
      console.log(`   (dry run) artwork ID: ${artworkId}`)
    }
  }

  // 2. Alle contacten ophalen
  const contacts = await sanity.fetch(
    `*[_type == "contact"]{ _id, firstName, lastName, email, purchases }`
  )
  console.log(`\n👥  ${contacts.length} contacten geladen\n`)

  // 3. Per verkoop
  for (const { contact: cd, purchase: pd } of SALES) {
    const found = await findContact(contacts, cd)

    let contactId
    let contactName

    if (found) {
      contactId = found._id
      contactName = [found.firstName, found.lastName].filter(Boolean).join(' ') || found.email
      console.log(`   ✓ Bestaand contact gevonden: ${contactName} (${contactId})`)
    } else {
      contactName = [cd.firstName, cd.lastName].filter(Boolean).join(' ')
      console.log(`   + Nieuw contact: ${contactName}`)
      if (!DRY_RUN) {
        const newContact = await sanity.create({
          _type: 'contact',
          firstName: cd.firstName,
          lastName: cd.lastName || undefined,
          email: cd.email,
          type: cd.type,
          company: cd.company,
          notes: cd.notes,
          subscribed: false,
          source: 'Handmatig — NYC Rooftop import',
        })
        contactId = newContact._id
        // Voeg toe aan lokale lijst voor dedup
        contacts.push({ _id: contactId, firstName: cd.firstName, lastName: cd.lastName, email: cd.email, purchases: [] })
        console.log(`     → aangemaakt: ${contactId}`)
      } else {
        contactId = `DRY-RUN-${randKey()}`
      }
    }

    // Controleer of aankoop al bestaat
    const existingPurchases = found?.purchases ?? []
    const alreadyIn = existingPurchases.some(p =>
      p.artwork?._ref === artworkId && p.copyNumber === pd.copyNumber
    )

    if (alreadyIn) {
      console.log(`   ⏭  Aankoop ${pd.copyNumber} al aanwezig voor ${contactName}`)
      continue
    }

    const purchaseDoc = {
      _key: randKey(),
      artwork: { _type: 'reference', _ref: artworkId },
      copyNumber: pd.copyNumber,
      soldVia: pd.soldVia,
      price: pd.price,
    }

    console.log(`   💾  Aankoop ${pd.copyNumber} (€${pd.price}) toevoegen aan ${contactName}`)
    if (!DRY_RUN) {
      await sanity
        .patch(contactId)
        .setIfMissing({ purchases: [] })
        .append('purchases', [purchaseDoc])
        .commit()
    }
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\n✅  Klaar!')
  if (DRY_RUN) console.log('   (dry run — niets opgeslagen)')
}

main().catch(console.error)

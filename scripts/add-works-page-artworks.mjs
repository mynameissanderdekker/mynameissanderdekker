/**
 * add-works-page-artworks.mjs
 *
 * Voegt de hardcoded werken van de works-pagina toe aan Sanity:
 * prints (Anastasia, Krisztina, NIMBY, New Found Freedom, Peeper)
 * + publicaties (boeken en zines).
 *
 * Slaat bestaande slugs over.
 * Uploadt afbeeldingen vanuit de WordPress CDN.
 *
 * Gebruik:
 *   node scripts/add-works-page-artworks.mjs --dry-run   ← preview
 *   node scripts/add-works-page-artworks.mjs             ← schrijf naar Sanity
 */

import { createClient } from '@sanity/client'
import https from 'https'
import http  from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-07-25',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

// ── Artwork list ──────────────────────────────────────────────────────────────

const ARTWORKS = [
  // ── Prints / originals ───────────────────────────────────────────────────────
  {
    title: 'Anastasia',
    slug:  'anastasia',
    year:  2020,
    category: 'original',
    medium: 'Lambda print on Fujicolor Crystal Archive Type DPII / Gloss, 4 cm passe-partout, framed',
    dimensions: { widthCm: 90, heightCm: 60 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 1750, vatRate: 9,
    status: 'enquire', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2026/01/2.jpg`,
  },
  {
    title: 'Krisztina',
    slug:  'krisztina',
    year:  2021,
    category: 'original',
    medium: 'Lambda print on Fujicolor Crystal Archive Type DPII / Gloss, passe-partout, framed',
    dimensions: { widthCm: 90, heightCm: 60 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 1900, vatRate: 9,
    status: 'enquire', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2022/04/01-1-1.jpg`,
  },
  {
    title: 'NIMBY',
    slug:  'nimby',
    year:  2020,
    category: 'original',
    medium: 'Lambda print on Fujicolor Crystal Archive Type DPII / Gloss, 4 cm passe-partout, framed',
    dimensions: { widthCm: 60, heightCm: 40 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 995, vatRate: 9,
    status: 'enquire', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2022/04/01-5.jpg`,
  },
  {
    title: 'New Found Freedom',
    slug:  'new-found-freedom',
    year:  2016,
    category: 'original',
    medium: 'Lambda print on Fujicolor Crystal Archive Type DPII / Gloss, passe-partout, framed',
    dimensions: { widthCm: 112, heightCm: 75 },
    editionTotal: 5, editionAP: 2,
    priceExclVAT: 2700, vatRate: 9,
    status: 'enquire', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2022/04/New-Found-Freedom.jpg`,
  },
  {
    title: 'Peeper',
    slug:  'peeper',
    year:  2023,
    category: 'special_edition',
    medium: 'Lambda print mounted on dibond, hand-painted wooden panel, plexiglass, metal hinges and knob, U-profile suspension',
    dimensions: { widthCm: 40, heightCm: 40 },
    editionTotal: 7, editionAP: 2,
    priceExclVAT: 1750, vatRate: 9,
    status: 'enquire', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2026/05/Peeper-1.jpg`,
  },

  // ── Boeken ───────────────────────────────────────────────────────────────────
  {
    title: 'My name is Sander Dekker Nº 2',
    slug:  'my-name-is-sander-dekker-no-2',
    year:  2020,
    category: 'book',
    medium: 'Publication',
    priceExclVAT: 40, vatRate: 9,
    status: 'available', showInWorks: true, showInWebshop: true,
    imageUrl: `${BASE}/2020/04/book-1.jpg`,
  },
  {
    title: 'My name is Sander Dekker Nº 1.5',
    slug:  'my-name-is-sander-dekker-no-1-5',
    year:  2019,
    category: 'book',
    medium: 'Publication',
    priceExclVAT: 30, vatRate: 9,
    status: 'available', showInWorks: true, showInWebshop: true,
    imageUrl: `${BASE}/2019/10/My-Name-Is-Sander-Dekker-1-1.5.jpg`,
  },
  {
    title: 'My name is Sander Dekker Nº 1',
    slug:  'my-name-is-sander-dekker-no-1',
    year:  2018,
    category: 'book',
    medium: 'Publication',
    status: 'sold_out', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2020/04/My-Name-Is-Sander-Dekker-1-1.jpg`,
  },

  // ── Zines ────────────────────────────────────────────────────────────────────
  {
    title: "Zine Nº 9 'A.S.I.A.'",
    slug:  'zine-no-9-asia',
    year:  2023,
    category: 'book',
    medium: 'Zine / publication',
    status: 'sold_out', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2023/12/Mock-up-Cover.jpg`,
  },
  {
    title: "Zine Nº 8 'The Warsaw SAGA'",
    slug:  'zine-no-8-the-warsaw-saga',
    year:  2022,
    category: 'book',
    medium: 'Zine / publication',
    status: 'sold_out', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2026/01/Zine-No.8-%27The-Warsaw-SAGA.jpg`,
  },
  {
    title: "Zine Nº 2 'Girls in Paris'",
    slug:  'zine-no-2-girls-in-paris',
    year:  2017,
    category: 'book',
    medium: 'Zine / publication',
    status: 'sold_out', showInWorks: true, showInWebshop: false,
    imageUrl: `${BASE}/2026/01/Girls-in-Paris.jpg`,
  },
]

// ── Image upload ──────────────────────────────────────────────────────────────

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        return fetchBuffer(res.headers.location, redirects - 1).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function uploadImage(url) {
  try {
    const buf = await fetchBuffer(url)
    const ext = url.split('?')[0].split('.').pop().toLowerCase()
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] ?? 'image/jpeg'
    const filename = decodeURIComponent(url.split('/').pop().split('?')[0])
    const asset = await sanity.assets.upload('image', buf, { contentType: mime, filename })
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } catch (err) {
    console.warn(`   ⚠️  Upload mislukt: ${err.message}`)
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — niets wordt opgeslagen\n' : '🚀  Starten…\n')

  const existing = await sanity.fetch(`*[_type == "artwork" && defined(slug.current)]{ "slug": slug.current }`)
  const existingSlugs = new Set(existing.map(a => a.slug))
  console.log(`📋  ${existingSlugs.size} artworks al in Sanity\n`)

  let created = 0, skipped = 0

  for (const aw of ARTWORKS) {
    if (existingSlugs.has(aw.slug)) {
      console.log(`⏭  Al aanwezig: "${aw.title}"`)
      skipped++
      continue
    }

    console.log(`➕  "${aw.title}"`)

    let imageRef = null
    if (aw.imageUrl && !DRY_RUN) {
      process.stdout.write('   📷  Afbeelding… ')
      imageRef = await uploadImage(aw.imageUrl)
      console.log(imageRef ? '✓' : '(overgeslagen)')
    }

    const doc = {
      _type:         'artwork',
      title:         aw.title,
      slug:          { _type: 'slug', current: aw.slug },
      year:          aw.year,
      category:      aw.category,
      medium:        aw.medium,
      ...(aw.dimensions ? { dimensions: aw.dimensions } : {}),
      ...(aw.editionTotal ? { editionTotal: aw.editionTotal } : {}),
      ...(aw.editionAP   ? { editionAP:    aw.editionAP   } : {}),
      ...(aw.priceExclVAT ? { priceExclVAT: aw.priceExclVAT } : {}),
      vatRate:       aw.vatRate ?? 9,
      status:        aw.status,
      showInWorks:   aw.showInWorks,
      showInWebshop: aw.showInWebshop,
      featured:      false,
      ...(imageRef ? { images: [imageRef] } : {}),
    }

    if (!DRY_RUN) {
      await sanity.create(doc)
      await new Promise(r => setTimeout(r, 250))
    }
    created++
  }

  console.log(`\n✅  Klaar! ${created} aangemaakt, ${skipped} overgeslagen.`)
  if (DRY_RUN) console.log('   (dry run — run zonder --dry-run om op te slaan)')
}

main().catch(console.error)

/**
 * import-products.mjs
 *
 * Voegt producten uit WooCommerce toe als artwork-documenten in Sanity.
 * Jaar, afbeeldingen en details later handmatig invullen in Studio.
 *
 * Gebruik: node scripts/import-products.mjs
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

function slug(title) {
  return title.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const PRODUCTS = [
  // ── Zines ──────────────────────────────────────────────────────────────────
  { title: "Zine Nº 2: Girls in Paris",           medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 3: Janna",                    medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 4: Cats & Dogs",              medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 5: Mexico",                   medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 6: Claudia",                  medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 7: 12.5Y Sander Dekker",     medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 8: The Warsaw SAGA",          medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 9: A.S.I.A",                 medium: "Zine",             editionTotal: null },
  { title: "Zine Nº 10: TenFifteen Lansy Siessie", medium: "Zine",           editionTotal: null },
  // ── Books ──────────────────────────────────────────────────────────────────
  { title: "My name is Sander Dekker Nº 1.5",    medium: "Book",             editionTotal: null },
  { title: "My name is Sander Dekker Nº 2",      medium: "Book",             editionTotal: null },
  // ── Special Editions ───────────────────────────────────────────────────────
  { title: "Special Edition: Lunar Lunacy Effect", medium: "Special Edition", editionTotal: null },
  { title: "Special Edition: Day At The Museum",  medium: "Special Edition",  editionTotal: null },
  { title: "Showroom piece: I'll show you mine if you show me yours", medium: "Showroom Piece", editionTotal: 1 },
  // ── Overig ─────────────────────────────────────────────────────────────────
  { title: "TenFifteen Wallpaper",                medium: "Wallpaper",        editionTotal: null },
]

async function main() {
  console.log(`${PRODUCTS.length} producten aanmaken in Sanity…\n`)

  for (const p of PRODUCTS) {
    // Check of het al bestaat
    const existing = await sanity.fetch(
      `*[_type == "artwork" && slug.current == $slug][0]{ _id }`,
      { slug: slug(p.title) }
    )

    if (existing) {
      console.log(`⏭  Bestaat al: ${p.title}`)
      continue
    }

    const doc = {
      _type: 'artwork',
      title: p.title,
      slug: { _type: 'slug', current: slug(p.title) },
      medium: p.medium,
      ...(p.editionTotal ? { editionTotal: p.editionTotal } : {}),
    }

    await sanity.create(doc)
    console.log(`✓  ${p.title}`)
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n✅  Klaar! Vul jaar, afbeeldingen en details in via Studio.')
}

main().catch(console.error)

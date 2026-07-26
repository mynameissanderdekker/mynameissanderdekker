/**
 * debug-buyers.mjs — checkt of aankopen correct zijn opgeslagen in Sanity
 * Gebruik: node scripts/debug-buyers.mjs
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
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

async function main() {
  // 1. Zoek TenFifteen Wallpaper artwork
  const artworks = await sanity.fetch(
    `*[_type == "artwork" && title match "TenFifteen*"]{ _id, title }`
  )
  console.log('🖼️  Artworks met "TenFifteen":')
  console.log(JSON.stringify(artworks, null, 2))

  if (!artworks.length) {
    console.log('❌  Artwork niet gevonden!')
    return
  }

  const artworkId = artworks[0]._id
  console.log(`\n🔑  Artwork ID: ${artworkId}\n`)

  // 2. Zoek contacten met aankopen voor dit artwork (oude syntax)
  const byEq = await sanity.fetch(
    `*[_type == "contact" && purchases[].artwork._ref == $id]{ _id, firstName, lastName, email }`,
    { id: artworkId }
  )
  console.log(`🔍  Methode 1 (== $id): ${byEq.length} resultaten`)

  // 3. Zoek met "in" syntax
  const byIn = await sanity.fetch(
    `*[_type == "contact" && $id in purchases[].artwork._ref]{ _id, firstName, lastName, email }`,
    { id: artworkId }
  )
  console.log(`🔍  Methode 2 ($id in): ${byIn.length} resultaten`)
  console.log(JSON.stringify(byIn, null, 2))

  // 4. Bekijk de ruwe purchases van Frans Oomen
  const frans = await sanity.fetch(
    `*[_type == "contact" && email == "info@mo-artgallery.nl"][0]{ _id, firstName, lastName, purchases }`
  )
  if (frans) {
    console.log(`\n👤  Frans Oomen (${frans._id}):`)
    console.log(`   ${(frans.purchases ?? []).length} aankopen`)
    if (frans.purchases?.length) {
      console.log('   Eerste aankoop:')
      console.log(JSON.stringify(frans.purchases[0], null, 2))
    }
  } else {
    console.log('\n❌  Frans Oomen niet gevonden')
  }

  // 5. Totaal aantal contacten met aankopen
  const withPurchases = await sanity.fetch(
    `count(*[_type == "contact" && defined(purchases) && count(purchases) > 0])`
  )
  console.log(`\n📊  Contacten met ≥1 aankoop in Sanity: ${withPurchases}`)
}

main().catch(console.error)

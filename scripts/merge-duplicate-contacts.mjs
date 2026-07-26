/**
 * merge-duplicate-contacts.mjs
 *
 * Samenvoegen van dubbele contacten in Sanity.
 * Behoudt altijd het contact met de meeste aankopen.
 * Verplaatst aankopen van het dubbele naar het primaire contact.
 *
 * Gebruik: node scripts/merge-duplicate-contacts.mjs
 * Droog draaien: node scripts/merge-duplicate-contacts.mjs --dry-run
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

// ── Handmatig gedefinieerde merges ────────────────────────────────────────────
// Formaat: { keep: 'id van primair contact', remove: 'id van duplicaat' }
// "keep" krijgt eventuele aankopen van "remove" erbij.
const MERGES = [
  // Lavinia Aparaschivei: gmail heeft 2 aankopen → houden
  { keep: 'GskSHzltiom27vUz3pMBaI', remove: 'PGI1Mc19xNWwE3RgMsBTt5' },

  // Jeroen Botter: jeroenbotter heeft 8 aankopen → houden
  { keep: 'k57DXB4TxK58qNiTm5TJ18', remove: 'GskSHzltiom27vUz3pMmW1' },

  // Harm De Vries: harm@studioharm heeft 1 aankoop → houden
  { keep: 'PGI1Mc19xNWwE3RgMsAkTf', remove: 'GskSHzltiom27vUz3pMhSZ' },

  // Benjamin Diedering: bdxmedia heeft 1 aankoop → houden
  { keep: 'GskSHzltiom27vUz3pMA2j', remove: 'GskSHzltiom27vUz3pMpb9' },

  // Martijn Halie: ellusion heeft 1 aankoop → houden
  { keep: 'GskSHzltiom27vUz3pM536', remove: 'PGI1Mc19xNWwE3RgMsBMyF' },

  // Adis Hromic: adis@hromic heeft 5 aankopen → houden, adishromic@gmail aankopen mergen
  { keep: 'PGI1Mc19xNWwE3RgMsAmaB', remove: 'PGI1Mc19xNWwE3RgMsAlyt' },

  // Ainsley Hutchence: beide 0 aankopen → willekeurig
  { keep: 'GskSHzltiom27vUz3pMtAr', remove: 'PGI1Mc19xNWwE3RgMsB8JI' },

  // Robin Janse: janserobin heeft 2 aankopen → houden
  { keep: 'GskSHzltiom27vUz3pM6Dj', remove: 'PGI1Mc19xNWwE3RgMsBFbR' },

  // Dennis Jansen: bluewin heeft 1 aankoop → houden
  { keep: 'PGI1Mc19xNWwE3RgMsAxG5', remove: 'k57DXB4TxK58qNiTm5TSiA' },

  // Merijn Kavelaars: beide 0 → willekeurig
  { keep: 'GskSHzltiom27vUz3pMLCc', remove: 'PGI1Mc19xNWwE3RgMsBbKY' },

  // Markus Löchte: loechte@stockwerk heeft 1 aankoop → houden
  { keep: 'GskSHzltiom27vUz3pMAI1', remove: 'k57DXB4TxK58qNiTm5TRrW' },

  // Frans Oomen: info@mo-artgallery heeft 7 aankopen → houden
  { keep: 'k57DXB4TxK58qNiTm5TIJG', remove: 'GskSHzltiom27vUz3pMuq4' },

  // Thomas Parry: parry_thomas83 heeft 5 aankopen → houden, thomasorilious aankopen mergen
  { keep: 'PGI1Mc19xNWwE3RgMsAlEH', remove: 'k57DXB4TxK58qNiTm5TMEk' },

  // L'imagerie Siessie: limageriefrance@gmail heeft 4 aankopen → houden
  { keep: 'PGI1Mc19xNWwE3RgMsAj7l', remove: 'GskSHzltiom27vUz3pMrVe' },

  // Robbert Vos: robbertvos@gmail heeft 2 aankopen → houden
  { keep: 'PGI1Mc19xNWwE3RgMsAnKn', remove: 'PGI1Mc19xNWwE3RgMsBXnT' },

  // Karim Walehiane: beide 1 aankoop → gmail houden, hotmail mergen
  { keep: 'k57DXB4TxK58qNiTm5TKKI', remove: 'k57DXB4TxK58qNiTm5TKUA' },

  // Marie Wanders: beide 0 → willekeurig
  { keep: 'k57DXB4TxK58qNiTm5TQ0M', remove: 'k57DXB4TxK58qNiTm5TXAY' },

  // Lars Westra: beide 0 → willekeurig
  { keep: 'GskSHzltiom27vUz3pMvha', remove: 'k57DXB4TxK58qNiTm5TOQk' },

  // Nick van Ginkel: nvang80@hotmail.com (3) → houden, .fom is typefout (1 aankoop mergen)
  { keep: 'k57DXB4TxK58qNiTm5TJWw', remove: 'k57DXB4TxK58qNiTm5TJxG' },

  // Lucía Lucía: beide 0 → willekeurig
  { keep: 'GskSHzltiom27vUz3pMv9B', remove: 'k57DXB4TxK58qNiTm5TVta' },

  // OVERGESLAGEN:
  // - Naamloze groep (bhsaltink / giovanadbieber / huanjianqiu): zijn verschillende mensen
  // - Sander Dekker (jijzelf): beide 0 aankopen, beheer zelf
]

async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — geen wijzigingen\n' : '✍️   Duplicaten samenvoegen…\n')

  // Laad alle betrokken contacten in één keer
  const allIds = MERGES.flatMap(m => [m.keep, m.remove])
  const contacts = await sanity.fetch(
    `*[_id in $ids]{ _id, firstName, lastName, email, purchases }`,
    { ids: allIds }
  )
  const byId = new Map(contacts.map(c => [c._id, c]))

  let merged = 0, deleted = 0, skipped = 0

  for (const { keep, remove } of MERGES) {
    const primary   = byId.get(keep)
    const secondary = byId.get(remove)

    if (!primary || !secondary) {
      console.log(`⚠️  Contact niet gevonden: keep=${keep} remove=${remove}`)
      skipped++
      continue
    }

    const name = [primary.firstName, primary.lastName].filter(Boolean).join(' ') || primary.email
    const secPurchases = secondary.purchases ?? []

    // Filtereer aankopen die al in het primaire contact zitten (op _key of zelfde artwork+order)
    const existingKeys = new Set((primary.purchases ?? []).map(p => p._key))
    const toMerge = secPurchases.filter(p => !existingKeys.has(p._key))

    console.log(`→ ${name} (${primary.email})`)
    console.log(`  Verwijder: ${secondary.email} (${secPurchases.length} aankopen, ${toMerge.length} te mergen)`)

    if (!DRY_RUN) {
      // 1. Voeg aankopen toe aan primaire contact (als die er zijn)
      if (toMerge.length > 0) {
        await sanity.patch(keep)
          .setIfMissing({ purchases: [] })
          .append('purchases', toMerge)
          .commit()
        merged += toMerge.length
      }

      // 2. Verwijder het duplicaat
      await sanity.delete(remove)
      deleted++
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log('\n' + (DRY_RUN ? '📋  Dry run klaar' : '✅  Klaar'))
  if (!DRY_RUN) {
    console.log(`   Contacten verwijderd: ${deleted}`)
    console.log(`   Aankopen verplaatst:  ${merged}`)
    console.log(`   Overgeslagen:         ${skipped}`)
  }
}

main().catch(console.error)

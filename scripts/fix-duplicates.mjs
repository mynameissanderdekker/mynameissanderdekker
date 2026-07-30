/**
 * fix-duplicates.mjs
 * Run: SANITY_WRITE_TOKEN=sk... node scripts/fix-duplicates.mjs
 *
 * 1. Patch de OUDE Nº1.5 (k57…VJHy) met correcte velden (slug, prijs, status, etc.)
 *    — die heeft 27 aankopen en blijft bestaan
 * 2. Verwijder de NIEUWE Nº1.5 (PGI1…t0y7T) — geen aankopen, overbodig
 * 3. Verwijder de Nº2 duplicate (k57…fIgQ) — geen referenties
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const OLD_NO15  = 'k57DXB4TxK58qNiTm5VJHy'  // houden — heeft 27 aankopen
const NEW_NO15  = 'PGI1Mc19xNWwE3RgMt0y7T'  // verwijderen — geen referenties
const DUP_NO2   = 'k57DXB4TxK58qNiTm5fIgQ'  // verwijderen — Nº2 duplicate

console.log('Stap 1: Patch oude Nº1.5 met correcte velden…')
await client.patch(OLD_NO15).set({
  'slug.current': 'my-name-is-sander-dekker-no-1-5',
  priceExclVAT:  27.52,
  vatRate:       9,
  status:        'available',
  showInWebshop: true,
  medium:        'Publication',
  category:      'book',
  order:         2,
  coverImageUrl: 'https://mynameissanderdekker.com/wp-content/uploads/2019/10/My-Name-Is-Sander-Dekker-1-1.5.jpg',
}).commit()
console.log('  ✓ Gepatcht')

console.log('Stap 2: Verwijder nieuwe (lege) Nº1.5…')
await client.delete(NEW_NO15)
console.log('  ✓ Verwijderd')

console.log('Stap 3: Verwijder Nº2 duplicate…')
await client.delete(DUP_NO2)
console.log('  ✓ Verwijderd')

console.log('\n✅ Klaar. Refresh /works om te controleren.')

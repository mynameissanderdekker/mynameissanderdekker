/**
 * Draait een geannuleerde verkoop écht terug?
 *
 * `cancelled` en `refunded` waren alleen een status op de order. Het werk bleef
 * op `sold`, bleef uit de webshop, de voorraad bleef afgeboekt en de aankoop
 * bleef in het CRM staan. Een verkoop op het verkeerde werk was daarmee alleen
 * met de hand te repareren — als je wist welke vier dingen.
 *
 * Deze testrun legt drie verkopen vast via de échte verkoopcode, draait ze
 * terug via `reverseSale`, en meet de eindtoestand:
 *
 *   1. uniek werk        → terug op available
 *   2. editie van 5      → voorraad terug omhoog
 *   3. webshopbestelling → óók terug in de webshop
 *
 * En één die niet mag: een werk dat de galerie intussen zelf heeft aangepast
 * blijft met rust.
 *
 *   npx tsx --env-file=.env.local scripts/testrun-reverse.mts
 *   ... --cleanup
 *
 * Schrijft in productie met TEST-ids en ruimt zichzelf op.
 */

import { createClient } from '@sanity/client'
import { existsSync } from 'node:fs'

// Gallery-template zonder src/, artist-template mét — zelfde truc als
// audit-studio-lists, zodat dit één bestand blijft in plaats van twee kopieën
// die uit elkaar lopen.
const SRC = existsSync(new URL('../src/lib/markSold.ts', import.meta.url)) ? '../src' : '..'

const admin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-06-18',
  // De twee repo's noemen het schrijftoken anders; zelfde regel als backup.mjs.
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
}).withConfig({ perspective: 'raw' })

const ID = {
  uniek:   'TEST-rev-uniek',
  editie:  'TEST-rev-editie',
  shop:    'TEST-rev-shop',
  metRust: 'TEST-rev-metrust',
  contact: 'TEST-rev-contact',
}
const ORDERS = ['TEST-rev-order-1', 'TEST-rev-order-2', 'TEST-rev-order-3', 'TEST-rev-order-4']

async function opruimen() {
  // Op volgorde: de order noemt het contact, het contact noemt het werk.
  let weg = 0
  const wis = async (id: string) => {
    try { await admin.delete(id); weg++ } catch { /* bestond al niet */ }
  }
  for (const o of ORDERS) await wis(o)
  await wis(ID.contact)
  for (const k of [ID.uniek, ID.editie, ID.shop, ID.metRust]) await wis(k)
  return weg
}

if (process.argv.includes('--cleanup')) {
  console.log(`${await opruimen()} testdocument(en) verwijderd.`)
  process.exit(0)
}

let fails = 0
const check = (l: string, ok: boolean, d = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails++
}

await opruimen()
// De artist-template heeft geen `artist`-documenten (één kunstenaar), de
// gallery-template wel. Zonder deze controle faalde de testrun daar op
// `_ref must be a string`.
const artist = await admin.fetch<string | null>(`*[_type == "artist"][0]._id`)
const werk = (id: string, extra: Record<string, unknown>) => ({
  _id: id, _type: 'artwork', title: id,
  ...(artist ? { artist: { _type: 'reference', _ref: artist } } : {}),
  slug: { _type: 'slug', current: id.toLowerCase() },
  priceIncVat: 100, vatRate: '9', status: 'available',
  ...extra,
})

await admin.createOrReplace(werk(ID.uniek,  { editionType: 'unique' }) as never)
await admin.createOrReplace(werk(ID.editie, { editionType: 'edition', editionTotal: 5, stock: 5 }) as never)
await admin.createOrReplace(werk(ID.shop,   { editionType: 'unique', availableInShop: true }) as never)
await admin.createOrReplace(werk(ID.metRust,{ editionType: 'unique' }) as never)
await admin.createOrReplace({
  _id: ID.contact, _type: 'contact',
  firstName: 'Terug', lastName: 'Draaien', email: 'terugdraaien@example.invalid',
} as never)

// ── De verkopen, via de échte code ──────────────────────────────────────────
const { markSold } = await import(`${SRC}/lib/markSold`)
const { reverseSale } = await import(`${SRC}/lib/reverseSale`)

const maakOrder = async (
  orderId: string, nummer: string, itemId: string, aantal: number, webshop: boolean
) => {
  await markSold(admin, itemId, aantal)
  await admin.createOrReplace({
    _id: orderId, _type: 'order', orderNumber: nummer,
    status: 'paid', createdAt: new Date().toISOString(),
    ...(webshop ? { channel: 'webshop', stripeSessionId: 'cs_test_rev' } : { channel: 'gallery' }),
    contact: { _type: 'reference', _ref: ID.contact },
    customerName: 'Terug Draaien', customerEmail: 'terugdraaien@example.invalid',
    items: [{ _key: 'r1', item: { _type: 'reference', _ref: itemId }, title: itemId, quantity: aantal, price: 100, priceExcl: 91.74, vatRate: 9 }],
    totalAmount: 100 * aantal, totalExcl: 91.74 * aantal,
  } as never)
  // De aankoop in het CRM, zoals createSale hem schrijft.
  await admin.patch(ID.contact).setIfMissing({ purchases: [] }).append('purchases', [{
    _key: `p-${nummer}`, orderNumber: nummer, artwork: { _type: 'reference', _ref: itemId }, price: 100,
  }]).commit()
}

await maakOrder(ORDERS[0], 'TEST-REV-1', ID.uniek,   1, false)
await maakOrder(ORDERS[1], 'TEST-REV-2', ID.editie,  2, false)
await maakOrder(ORDERS[2], 'TEST-REV-3', ID.shop,    1, true)
await maakOrder(ORDERS[3], 'TEST-REV-4', ID.metRust, 1, false)

console.log('── Zo staat het na de verkoop ──')
{
  const s = await admin.fetch<Record<string, unknown>>(`{
    "uniek": *[_id == $u][0].status,
    "editie": *[_id == $e][0].stock,
    "shopStatus": *[_id == $s][0].status,
    "shopInWinkel": *[_id == $s][0].availableInShop,
    "aankopen": count(*[_id == $c][0].purchases)
  }`, { u: ID.uniek, e: ID.editie, s: ID.shop, c: ID.contact })
  check('uniek werk is verkocht', s.uniek === 'sold', String(s.uniek))
  check('editie: voorraad 5 → 3', s.editie === 3, String(s.editie))
  check('webshopwerk uit de winkel', s.shopInWinkel === false, String(s.shopInWinkel))
  check('vier aankopen in het CRM', s.aankopen === 4, String(s.aankopen))
}

// Iemand zet dit werk intussen zelf op "niet te koop".
await admin.patch(ID.metRust).set({ status: 'not-for-sale' }).commit()

// ── Terugdraaien ───────────────────────────────────────────────────────────
console.log('\n── Annuleren ──')
const r1 = await reverseSale(admin, ORDERS[0])
const r2 = await reverseSale(admin, ORDERS[1])
const r3 = await reverseSale(admin, ORDERS[2])
const r4 = await reverseSale(admin, ORDERS[3])
for (const r of [r1, r2, r3]) for (const c of r.changes) console.log(`     ${c}`)

const na = await admin.fetch<Record<string, unknown>>(`{
  "uniek": *[_id == $u][0].status,
  "editie": *[_id == $e][0].stock,
  "editieStatus": *[_id == $e][0].status,
  "shopStatus": *[_id == $s][0].status,
  "shopInWinkel": *[_id == $s][0].availableInShop,
  "uniekInWinkel": *[_id == $u][0].availableInShop,
  "metRust": *[_id == $m][0].status,
  "aankopen": count(*[_id == $c][0].purchases)
}`, { u: ID.uniek, e: ID.editie, s: ID.shop, m: ID.metRust, c: ID.contact })

console.log('\n── Wat er is teruggedraaid ──')
check('uniek werk is weer beschikbaar', na.uniek === 'available', String(na.uniek))
check('editie: voorraad 3 → 5', na.editie === 5, String(na.editie))
check('editie staat niet meer op verkocht', na.editieStatus !== 'sold', String(na.editieStatus))
check('webshopwerk is weer beschikbaar', na.shopStatus === 'available', String(na.shopStatus))
check('webshopwerk staat weer in de winkel', na.shopInWinkel === true, String(na.shopInWinkel))

// Een galerieverkoop weet niet of het werk vóór de verkoop in de webshop lag;
// `markSold` bewaart die waarde niet. Dan is niets doen het eerlijke antwoord.
check('galerieverkoop zet het werk NIET zomaar in de webshop',
  na.uniekInWinkel !== true, String(na.uniekInWinkel))

check('werk dat de galerie zelf aanpaste blijft met rust', na.metRust === 'not-for-sale', String(na.metRust))
check('en dat wordt gemeld in plaats van stil overgeslagen',
  r4.skipped.length === 1 && /niet op verkocht/.test(r4.skipped[0]), r4.skipped[0] ?? 'niets gemeld')

check('alle aankopen uit het CRM gehaald', na.aankopen === 0, `${na.aankopen} over`)

// Twee keer terugdraaien mag niets kapotmaken — iemand klikt twee keer.
const nogmaals = await reverseSale(admin, ORDERS[0])
const naNogmaals = await admin.fetch<string>(`*[_id == $u][0].status`, { u: ID.uniek })
check('nog een keer terugdraaien verandert niets', naNogmaals === 'available',
  `${naNogmaals} · ${nogmaals.changes.length} wijziging(en)`)

console.log(fails
  ? `\n${fails} punt(en) kloppen niet.`
  : '\nAnnuleren draait de verkoop terug: werk, voorraad, webshop en CRM.')
console.log('Opruimen: npx tsx --env-file=.env.local scripts/testrun-reverse.mts --cleanup')
process.exit(fails ? 1 : 0)

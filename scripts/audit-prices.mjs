/**
 * De prijzen in de hele collectie nalopen.
 *
 * Aanleiding: op één order stond een verkeerd totaal. Dat riep de vraag op of
 * de prijzen zélf ergens niet kloppen. Dit script leest alleen — het wijzigt
 * niets — en kijkt naar de dingen die stil fout kunnen gaan:
 *
 *   - staan `priceIncVat` en `priceExVat` niet met elkaar in tegenspraak
 *   - is er een BTW-tarief, of leunt het werk op de terugval van 9%
 *   - staat er een prijs op werk dat te koop is
 *   - staat er een prijs in de webshop zonder tarief
 *
 * Draaien:  node scripts/audit-prices.mjs
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
for (const line of readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// Beide templates gebruiken andere veldnamen voor hetzelfde: de gallery-template
// `priceExVat`, de artist-template `priceExclVAT`. Allebei ophalen.
const werken = await client.fetch(`
  *[_type in ["artwork", "publication"] && !(_id in path("drafts.**"))]{
    _id, _type, title, status, availableInShop, priceOnRequest,
    priceIncVat, "excl": coalesce(priceExVat, priceExclVAT), vatRate,
    "artist": artist->name
  }
`)

const eur = (n) => (n == null ? '—' : '€ ' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const cent = (n) => Math.round(n * 100) / 100

const bevindingen = {
  tegenstrijdig: [],
  geenTarief: [],
  geenPrijs: [],
  shopZonderPrijs: [],
  alleenExcl: [],
}

for (const w of werken) {
  const tarief = w.vatRate == null ? null : Number(w.vatRate)
  const teKoop = w.status === 'available' || w.status === 'reserved'

  // Tegenspraak: allebei ingevuld, maar niet met elkaar in overeenstemming.
  if (w.priceIncVat != null && w.excl != null) {
    const verwacht = cent(w.priceIncVat / (1 + (tarief ?? 9) / 100))
    // Een cent speling voor afrondingsverschillen.
    if (Math.abs(verwacht - cent(w.excl)) > 0.02) {
      bevindingen.tegenstrijdig.push({ ...w, verwacht })
    }
  }

  if (w.priceIncVat != null && w.excl == null && tarief == null) bevindingen.geenTarief.push(w)
  else if (w.priceIncVat != null && tarief == null) bevindingen.geenTarief.push(w)

  if (w.priceIncVat == null && w.excl == null && !w.priceOnRequest && teKoop) {
    bevindingen.geenPrijs.push(w)
  }
  if (w.availableInShop === true && w.priceIncVat == null) bevindingen.shopZonderPrijs.push(w)

  // Alleen een nettoprijs: elke pagina die incl. toont moet dan zelf rekenen,
  // en doet dat met de terugval van 9% als er geen tarief staat.
  if (w.priceIncVat == null && w.excl != null) bevindingen.alleenExcl.push(w)
}

const regel = (w) => `    ${(w._type === 'publication' ? '[pub] ' : '').padEnd(6)}${String(w.title ?? '—').slice(0, 44).padEnd(46)}${(w.artist ?? '').slice(0, 18).padEnd(20)}${w.status ?? '—'}`

console.log(`\n${werken.length} werken en publicaties nagelopen.\n`)

const blok = (titel, lijst, uitleg, extra) => {
  console.log(`── ${titel}: ${lijst.length}`)
  if (lijst.length) {
    console.log(`   ${uitleg}`)
    for (const w of lijst.slice(0, 15)) {
      console.log(regel(w))
      if (extra) console.log(extra(w))
    }
    if (lijst.length > 15) console.log(`    … en nog ${lijst.length - 15}`)
  }
  console.log()
}

// Welk bedrag krijgt wie te zien? Dat is de vraag die telt, want de twee
// velden worden niet overal in dezelfde volgorde gelezen:
//
//   website en webshop  → `priceIncVat` wint
//   prijslijst (/room)  → `priceExVat` wint, en er komt BTW overheen
//   verkooptool         → `priceExVat` wint, en dát wordt de factuurregel
//
// Staan de twee velden niet met elkaar in overeenstemming, dan ziet de klant
// op de website iets anders dan op de prijslijst — en betaalt hij weer iets
// anders op de factuur.
const gevolg = (w) => {
  const t = Number(w.vatRate ?? 9)
  const site = w.priceIncVat
  const lijst = cent(w.excl * (1 + t / 100))
  const factuur = lijst
  const verschil = cent(Math.abs(site - lijst))
  return [
    `      website ${eur(site)}   prijslijst ${eur(lijst)}   factuur ${eur(factuur)}`,
    `      verschil ${eur(verschil)}${verschil >= 1 ? '   ← de klant ziet twee bedragen' : '   (afrondingsruis)'}`,
  ].join('\n')
}

blok('Incl. en excl. spreken elkaar tegen', bevindingen.tegenstrijdig,
  'De prijslijst en de verkooptool lezen `priceExVat`, de website leest `priceIncVat`.',
  gevolg)

// De ernstige gevallen apart, want de rest is centenwerk.
const ernstig = bevindingen.tegenstrijdig.filter((w) => {
  const t = Number(w.vatRate ?? 9)
  return Math.abs(w.priceIncVat - cent(w.excl * (1 + t / 100))) >= 1
})
if (ernstig.length) {
  console.log(`── Hiervan met een verschil van een euro of meer: ${ernstig.length}`)
  console.log('   Dit zijn de werken waar een klant een ander bedrag betaalt dan hij op de site zag.\n')
  for (const w of ernstig) {
    const t = Number(w.vatRate ?? 9)
    console.log(`    ${String(w.title ?? '—').slice(0, 40).padEnd(42)}${(w.artist ?? '').slice(0, 18)}`)
    console.log(`      incl-veld ${eur(w.priceIncVat)}   excl-veld ${eur(w.excl)}   tarief ${t}%`)
    console.log(`      → website ${eur(w.priceIncVat)} · prijslijst en factuur ${eur(cent(w.excl * (1 + t / 100)))}`)
  }
  console.log()
}

blok('Prijs zonder BTW-tarief', bevindingen.geenTarief,
  'Valt terug op 9%. Klopt voor kunst, maar niet voor een boek of poster (21%).',
  (w) => `      ${eur(w.priceIncVat)} zonder tarief`)

blok('Alleen een nettoprijs', bevindingen.alleenExcl,
  'Elke weergave incl. BTW moet zelf rekenen, met 9% als er geen tarief staat.',
  (w) => `      excl ${eur(w.excl)} · tarief ${w.vatRate ?? 'ontbreekt'}`)

blok('In de webshop zonder prijs', bevindingen.shopZonderPrijs,
  'Staat te koop maar heeft geen bedrag.')

blok('Te koop zonder prijs en niet "op aanvraag"', bevindingen.geenPrijs,
  'Verschijnt op een prijslijst zonder bedrag.')

const totaalFout = bevindingen.tegenstrijdig.length + bevindingen.shopZonderPrijs.length
console.log(totaalFout === 0
  ? 'Geen tegenstrijdige prijzen gevonden.'
  : `${totaalFout} werk(en) hebben aandacht nodig.`)

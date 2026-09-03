/**
 * Staat een prijslijst met wachtwoord écht achter dat wachtwoord?
 *
 * Wat er stond: `page.tsx` haalde het wachtwoord **en alle werken met prijzen**
 * op en gaf ze mee aan een client-component, die in de browser vergeleek. Wie
 * de link had kon de complete prijslijst uit de paginabron lezen zonder iets in
 * te tikken — inclusief het wachtwoord zelf. Precies dezelfde fout als bij de
 * pincode van de mobiele app: de controle stond aan de verkeerde kant.
 *
 * Deze testrun kijkt naar wat er over de lijn gaat:
 *   1. de pagina zelf bevat geen wachtwoord en geen prijzen
 *   2. de API geeft niets zonder wachtwoord
 *   3. met het juiste wachtwoord komen de werken wél
 *   4. een verlopen of inactieve lijst geeft niets, ook met het wachtwoord
 *
 *   NEXT_PUBLIC_SANITY_DATASET=<dataset> \
 *     npx tsx --env-file=.env.local scripts/testrun-private-sale.mts
 *   … --cleanup
 */

import { createClient } from '@sanity/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'

const admin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-06-18',
  // In deze repo heet het token `SANITY_WRITE_TOKEN`; de gallery-template
  // gebruikt `SANITY_API_WRITE_TOKEN`. Allebei accepteren.
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
}).withConfig({ perspective: 'raw' })

const ID = { sale: 'TEST-ps-sale', verlopen: 'TEST-ps-verlopen', werk: 'TEST-ps-werk' }
const TOKEN = 'testrun-geheime-lijst'
const TOKEN_VERLOPEN = 'testrun-verlopen-lijst'
const WACHTWOORD = 'zeezout'
const PRIJS = 3456   // een bedrag dat nergens anders voorkomt

if (process.argv.includes('--cleanup')) {
  const found = await admin.fetch<{ _id: string }[]>(`*[_id in $ids]{_id}`, { ids: Object.values(ID) })
  const tx = admin.transaction()
  for (const d of found) tx.delete(d._id)
  if (found.length) await tx.commit()
  console.log(`${found.length} testdocument(en) verwijderd.`)
  process.exit(0)
}

let fails = 0
const check = (l: string, ok: boolean, d = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails++
}

// De artist-template heeft geen `artist`-documenten: het is één kunstenaar.
await admin.createOrReplace({
  _id: ID.werk, _type: 'artwork', title: 'Geheim werk',
  slug: { _type: 'slug', current: 'testrun-geheim-werk' },
  priceIncVat: PRIJS, vatRate: '9', status: 'available', editionType: 'unique',
} as never)
await admin.createOrReplace({
  _id: ID.sale, _type: 'privateSale', title: 'Selectie met wachtwoord',
  slug: { _type: 'slug', current: 'testrun-geheime-lijst' },
  token: TOKEN, password: WACHTWOORD, isActive: true, showPrices: true, clientLocation: 'nl',
  artworks: [{ _key: 'i1', _type: 'privateSaleItem', artwork: { _type: 'reference', _ref: ID.werk } }],
} as never)
await admin.createOrReplace({
  _id: ID.verlopen, _type: 'privateSale', title: 'Verlopen selectie',
  slug: { _type: 'slug', current: 'testrun-verlopen-lijst' },
  token: TOKEN_VERLOPEN, password: WACHTWOORD, isActive: true, showPrices: true,
  expiresAt: new Date(Date.now() - 86400000).toISOString(),
  artworks: [{ _key: 'i1', _type: 'privateSaleItem', artwork: { _type: 'reference', _ref: ID.werk } }],
} as never)

// ── 1. Wat vraagt de pagina op? ─────────────────────────────────────────────
// De gallery-template rendert deze pagina in zijn testrun en kijkt in de props.
// Hier lukt dat niet: JSX draait in deze repo niet buiten Next (andere
// tsconfig). Dan maar de bron: wat de pagina niet ophaalt, kan ook niet naar de
// browser lekken.
console.log('── Wat de pagina ophaalt ──')
{
  const { readFileSync } = await import('node:fs')
  const bron = readFileSync(new URL('../src/app/private-sales/[token]/page.tsx', import.meta.url), 'utf8')
  const query = bron.slice(bron.indexOf('*[_type == "privateSale"'), bron.indexOf('`,', bron.indexOf('*[_type == "privateSale"')))
  check('de pagina haalt het wachtwoord niet op', !/^\s*password,/m.test(query),
    /^\s*password,/m.test(query) ? 'password staat in de projectie' : 'ok')
  check('de pagina haalt de werken niet op', !/artworks\[\]\{/.test(query),
    /artworks\[\]\{/.test(query) ? 'artworks staan in de projectie' : 'ok')
  check('de client krijgt geen correctPassword', !/correctPassword/.test(bron),
    /correctPassword/.test(bron) ? 'wordt nog doorgegeven' : 'ok')
}

// ── 2. De API ───────────────────────────────────────────────────────────────
console.log('\n── De API die de werken geeft ──')
const route = await import('../src/app/api/private-sale/[token]/route')
const post = (token: string, password?: string) =>
  route.POST({ json: async () => ({ password }) } as never, { params: Promise.resolve({ token }) } as never)

{
  const r = await post(TOKEN)
  check('zonder wachtwoord: geweigerd', r.status === 401, `${r.status}`)
  const body = await r.json().catch(() => ({}))
  check('zonder wachtwoord: geen werken in het antwoord',
    !JSON.stringify(body).includes(String(PRIJS)), JSON.stringify(body).slice(0, 60))
}
{
  const r = await post(TOKEN, 'raden-maar')
  check('fout wachtwoord: geweigerd', r.status === 401, `${r.status}`)
}
{
  const r = await post(TOKEN, WACHTWOORD)
  const body = await r.json() as { artworks?: { artwork?: { title?: string } }[] }
  check('juist wachtwoord: werken komen mee', r.status === 200 && (body.artworks?.length ?? 0) === 1,
    `${r.status}, ${body.artworks?.length ?? 0} werk(en)`)
  check('en het is het goede werk', body.artworks?.[0]?.artwork?.title === 'Geheim werk',
    body.artworks?.[0]?.artwork?.title ?? 'geen titel')
}
{
  const r = await post(TOKEN_VERLOPEN, WACHTWOORD)
  check('verlopen lijst: niets, ook met het juiste wachtwoord', r.status === 410, `${r.status}`)
}
{
  const r = await post('bestaat-niet', WACHTWOORD)
  check('onbekend token: 404', r.status === 404, `${r.status}`)
}

console.log(fails
  ? `\n${fails} punt(en) kloppen niet.`
  : '\nDe prijzen blijven op de server tot het wachtwoord klopt.')
console.log('Opruimen: npx tsx --env-file=.env.local scripts/testrun-private-sale.mts --cleanup')
process.exit(fails ? 1 : 0)

/**
 * Elke lijst in de Studio narekenen, zonder de Studio te openen.
 *
 * `sanity/structure.ts` bevat tientallen GROQ-filters en badge-queries. Die
 * zijn allemaal gelezen, maar nooit systematisch gedraaid. Een filter dat
 * stilletjes leeg teruggeeft zie je in de Studio niet als fout — je ziet een
 * lege lijst en denkt dat er niets is. Zo bleven de beursdocumenten maanden
 * leeg zonder dat iemand het merkte.
 *
 * Dit script haalt elk filter uit het bronbestand, draait het als
 * `count(*[…])` tegen productie, en controleert daarna een paar dingen die
 * per definitie moeten kloppen: Orders en Archive overlappen niet, elke
 * expositie zit in precies één van Upcoming/Current/Archive, enzovoort.
 *
 *   npx tsx --env-file=.env.local scripts/audit-studio-lists.mts
 *
 * Leest alleen. Schrijft niets.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@sanity/client'
import { existsSync } from 'node:fs'

// Gallery-template zonder src/, artist-template mét: hetzelfde script werkt
// in beide repo's.
const SRC = existsSync(new URL('../src/sanity/structure.ts', import.meta.url)) ? '../src' : '..'

// Dynamisch, net als de andere testruns: een statische import van een .ts
// vanuit .mts struikelt hier over de module-interop.
const { OPEN_ORDER_FILTER, DONE_ORDER_FILTER } = await import(`${SRC}/lib/orderStatus`)

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2026-06-18',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const today = new Date().toISOString().slice(0, 10)
let fails = 0
const check = (l: string, ok: boolean, d = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails++
}

// ── 1. Alle filters uit structure.ts ─────────────────────────────────────────
const bron = readFileSync(new URL(`${SRC}/sanity/structure.ts`, import.meta.url), 'utf8')

// .filter('…')  .filter("…")  .filter(`…`)  — ook meerregelig.
const filterRe = /\.filter\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)\s*\)/g
// attentionBadge(`count(…)`, …)
const badgeRe = /attentionBadge\(\s*`([^`]+)`/g

const vervang = (q: string) =>
  q.replace(/\$\{OPEN_ORDER_FILTER\}/g, OPEN_ORDER_FILTER)
   .replace(/\$\{DONE_ORDER_FILTER\}/g, DONE_ORDER_FILTER)

const filters: { q: string; regel: number }[] = []
for (const m of bron.matchAll(filterRe)) {
  const q = vervang(m[1] ?? m[2] ?? m[3] ?? '')
  // Filters die uit variabelen worden opgebouwd (customFilters) kunnen we
  // hier niet reconstrueren; die vallen af als ze geen GROQ bevatten.
  if (!q.includes('_type') && !q.includes('==')) continue
  filters.push({ q, regel: bron.slice(0, m.index).split('\n').length })
}
const badges: { q: string; regel: number }[] = []
for (const m of bron.matchAll(badgeRe)) {
  badges.push({ q: vervang(m[1]), regel: bron.slice(0, m.index).split('\n').length })
}

// Voorbeeldwaarden voor geparametriseerde lijsten: een echte kunstenaar,
// expositie en beurs, zodat het filter met échte data draait.
const voorbeeld = await client.fetch<Record<string, string | null>>(`{
  "artistId": coalesce(*[_type == "artist" && represented == true][0]._id, *[_type == "artist"][0]._id),
  "exhibitionId": coalesce(*[_type == "exhibition" && count(artworks) > 0] | order(startDate desc)[0]._id, *[_type == "exhibition"][0]._id),
  "artFairId": coalesce(*[_type == "artFair" && count(artworks) > 0] | order(startDate desc)[0]._id, *[_type == "artFair"][0]._id),
  "seriesId": *[_type == "projectSeries"][0]._id,
  "projectId": *[_type == "project"][0]._id
}`)
// `pubCats` is in de artist-template een vaste lijst; hier volstaat een
// plausibele waarde, het gaat om de vraag of het filter draait.
const params = { today, status: 'available', cat: 'Zine', pubCats: ['Book', 'Zine', 'Calendar', 'Poster', 'Bag'], ...voorbeeld }

// De artist-template heeft een ander model: exposities zijn historie (geen
// endDate), werken hangen vanaf het werk aan de expositie, en uitverkochte
// zines blijven zichtbaar met een SOLD OUT-badge. Een paar controles hieronder
// zijn daar informatie, geen fout.
const ARTIST_TEMPLATE = SRC === '../src'

console.log(`── 1. ${filters.length} lijstfilters en ${badges.length} badges uit structure.ts ──`)
const uitkomsten: { regel: number; q: string; n: number | null; fout?: string }[] = []
for (const f of filters) {
  try {
    const n = await client.fetch<number>(`count(*[${f.q}])`, params)
    uitkomsten.push({ ...f, n })
  } catch (err) {
    uitkomsten.push({ ...f, n: null, fout: String((err as Error).message).slice(0, 120) })
  }
}
for (const b of badges) {
  try {
    const n = await client.fetch<number>(b.q, params)
    uitkomsten.push({ ...b, n })
  } catch (err) {
    uitkomsten.push({ ...b, n: null, fout: String((err as Error).message).slice(0, 120) })
  }
}

const fouten = uitkomsten.filter((u) => u.fout)
check(`alle ${uitkomsten.length} queries draaien zonder fout`, fouten.length === 0)
for (const f of fouten) console.log(`      regel ${f.regel}: ${f.fout}\n        ${f.q.slice(0, 100)}`)

// Lege lijsten zijn niet per se fout, maar wel verdacht als ze een
// hoofdingang zijn. Tonen, niet afkeuren.
const leeg = uitkomsten.filter((u) => u.n === 0)
console.log(`  · ${leeg.length} lijst(en) zijn leeg:`)
for (const l of leeg) console.log(`      regel ${l.regel}: ${l.q.replace(/\s+/g, ' ').slice(0, 110)}`)

// ── 2. Wat per definitie moet kloppen ────────────────────────────────────────
console.log('\n── 2. Onderlinge consistentie ──')

const o = await client.fetch<{ alle: number; open: number; klaar: number; beide: number; geen: number }>(`{
  "alle":  count(*[_type == "order"]),
  "open":  count(*[_type == "order" && ${OPEN_ORDER_FILTER}]),
  "klaar": count(*[_type == "order" && ${DONE_ORDER_FILTER}]),
  "beide": count(*[_type == "order" && (${OPEN_ORDER_FILTER}) && (${DONE_ORDER_FILTER})]),
  "geen":  count(*[_type == "order" && !(${OPEN_ORDER_FILTER}) && !(${DONE_ORDER_FILTER})])
}`)
check('geen order staat tegelijk in Orders én Archive', o.beide === 0, `${o.beide}`)
check('elke order staat in Orders óf Archive', o.geen === 0, `${o.geen} nergens · ${o.open} open · ${o.klaar} archief · ${o.alle} totaal`)

const e = await client.fetch<{ alle: number; up: number; cur: number; arch: number; geen: number; zonderEind: number }>(`{
  "alle": count(*[_type == "exhibition"]),
  "up":   count(*[_type == "exhibition" && startDate > $today]),
  "cur":  count(*[_type == "exhibition" && startDate <= $today && endDate >= $today]),
  "arch": count(*[_type == "exhibition" && endDate < $today]),
  "geen": 0,
  "zonderEind": count(*[_type == "exhibition" && !defined(endDate)])
}`, { today })
// Niet via GROQ-negatie: `!(endDate < $today)` is null als endDate ontbreekt,
// en null telt niet mee — dan lijkt alles te kloppen terwijl niets zichtbaar is.
e.geen = e.alle - e.up - e.cur - e.arch
const eOk = e.geen === 0
const eTekst = `${e.geen} in geen enkele lijst (${e.zonderEind} zonder endDate) · ${e.up}/${e.cur}/${e.arch} van ${e.alle}`
if (ARTIST_TEMPLATE) console.log(`  · exposities per datumlijst: ${eTekst} — hier bewust: exposities zijn historie`)
else check('elke expositie staat in Upcoming, Current of Archive', eOk, eTekst)

const af = await client.fetch<{ alle: number; up: number; cur: number; arch: number; zonderEind: number }>(`{
  "alle": count(*[_type == "artFair"]),
  "up":   count(*[_type == "artFair" && startDate > $today]),
  "cur":  count(*[_type == "artFair" && startDate <= $today && endDate >= $today]),
  "arch": count(*[_type == "artFair" && endDate < $today]),
  "zonderEind": count(*[_type == "artFair" && !defined(endDate)])
}`, { today })
const afGeen = af.alle - af.up - af.cur - af.arch
const afTekst = `${afGeen} in geen enkele lijst (${af.zonderEind} zonder endDate) van ${af.alle}`
if (ARTIST_TEMPLATE) console.log(`  · beurzen per datumlijst: ${afTekst}`)
else check('elke beurs staat in Upcoming, Current of Archive', afGeen === 0, afTekst)

const shop = await client.fetch<{ verkochtInShop: number; gereserveerdInShop: number }>(`{
  "verkochtInShop": count(*[_type == "artwork" && availableInShop == true && status == "sold"]),
  "gereserveerdInShop": count(*[_type == "artwork" && availableInShop == true && status == "reserved"])
}`)
if (ARTIST_TEMPLATE) console.log(`  · ${shop.verkochtInShop} uitverkochte werk(en) in de shop — hier bewust, met SOLD OUT-badge`)
else check('geen verkocht werk staat nog in de webshop', shop.verkochtInShop === 0, `${shop.verkochtInShop}`)
check('geen gereserveerd werk te koop in de webshop', shop.gereserveerdInShop === 0, `${shop.gereserveerdInShop}`)

const res = await client.fetch<{ gereserveerd: number; zonderTot: number; verlopen: number; zonderVoor: number }>(`{
  "gereserveerd": count(*[_type == "artwork" && status == "reserved"]),
  "zonderTot": count(*[_type == "artwork" && status == "reserved" && !defined(reservedUntil)]),
  "verlopen": count(*[_type == "artwork" && status == "reserved" && reservedUntil < $today]),
  "zonderVoor": count(*[_type == "artwork" && status == "reserved" && !defined(reservedFor)])
}`, { today })
console.log(`  · reserveringen: ${res.gereserveerd} · ${res.verlopen} verlopen · ${res.zonderTot} zonder einddatum · ${res.zonderVoor} zonder klant`)

const show = await client.fetch<{ lopend: number; opShow: number }>(`{
  "lopend": count(*[_type == "exhibition" && startDate <= $today && (!defined(endDate) || endDate >= $today)]),
  "opShow": count(*[_type == "artwork" && _id in *[_type == "exhibition" && startDate <= $today && (!defined(endDate) || endDate >= $today)].artworks[]._ref])
}`, { today })
if (!ARTIST_TEMPLATE) check('"Currently on show" is gevuld als er een expositie loopt', show.lopend === 0 || show.opShow > 0,
  `${show.lopend} lopende expositie(s) · ${show.opShow} werken op show`)

console.log(fails ? `\n${fails} punt(en) kloppen niet.` : '\nAlle lijsten kloppen.')
process.exit(fails ? 1 : 0)

/**
 * Offerte → verkoop, van begin tot eind. Tegenhanger van hetzelfde script in
 * de gallery-template.
 *
 * De vraag die telt: **ziet de klant hetzelfde bedrag als hij later betaalt?**
 * De verkoopweg is hier een andere — `/api/manual-sale` doet het werk zelf,
 * waar de gallery-template `lib/createSale.ts` heeft — dus de uitkomst moet
 * apart worden nagelopen.
 *
 *   npx tsx --env-file=.env.local scripts/testrun-proposal.mts
 *   npx tsx --env-file=.env.local scripts/testrun-proposal.mts --cleanup
 */

import { createClient } from '@sanity/client'

const CLEANUP = process.argv.includes('--cleanup')

const admin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
}).withConfig({ perspective: 'raw' })

const ID = {
  artworkNl: 'TEST-prop-artwork-nl',
  artworkEu: 'TEST-prop-artwork-eu',
  contactNl: 'TEST-prop-contact-nl',
  contactEu: 'TEST-prop-contact-eu',
  proposalNl: 'TEST-prop-nl',
  proposalEu: 'TEST-prop-eu',
}

if (CLEANUP) {
  const ids = Object.values(ID)
  const found = await admin.fetch<{ _id: string; _type: string }[]>(
    `*[_id in $ids || _id in $drafts || (_type == "order" && contact._ref in $ids)]{_id,_type}`,
    { ids, drafts: ids.map((i) => `drafts.${i}`) }
  )
  const tx = admin.transaction()
  for (const d of found) tx.delete(d._id)
  if (found.length) await tx.commit()
  console.log(`${found.length} testdocument(en) verwijderd.`)
  process.exit(0)
}

let fails = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) fails++
}
const iso = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}

const CATALOGUS_INCL = 2180
const CATALOGUS_EXCL = 2000
const AFGESPROKEN_EXCL = 1800
const AFGESPROKEN_INCL = 1962

console.log('── Opstellen ──')
for (const [awId, land] of [[ID.artworkNl, 'nl'], [ID.artworkEu, 'eu']] as const) {
  await admin.createOrReplace({
    _id: awId, _type: 'artwork', title: `Offertewerk (${land})`,
    slug: { _type: 'slug', current: `test-prop-${land}` },
    year: 2026, medium: 'Olieverf op doek', widthCm: 100, heightCm: 80,
    editionType: 'unique',
    priceIncVat: CATALOGUS_INCL, priceExclVAT: CATALOGUS_EXCL, vatRate: 9,
    status: 'available',
  } as never)
}
await admin.createOrReplace({
  _id: ID.contactNl, _type: 'contact',
  firstName: 'Nina', lastName: 'Nederland', email: 'nina.nederland@example.invalid',
  clientLocation: 'nl', country: 'NL',
} as never)
await admin.createOrReplace({
  _id: ID.contactEu, _type: 'contact',
  firstName: 'Emil', lastName: 'Europa', email: 'emil.europa@example.invalid',
  company: 'Europa Collection GmbH', vatNumber: 'DE987654321',
  clientLocation: 'eu', country: 'DE',
} as never)

for (const [pid, cid, aid, land] of [
  [ID.proposalNl, ID.contactNl, ID.artworkNl, 'nl'],
  [ID.proposalEu, ID.contactEu, ID.artworkEu, 'eu'],
] as const) {
  await admin.createOrReplace({
    _id: pid, _type: 'proposal',
    title: `Testofferte ${land.toUpperCase()}`,
    contact: { _type: 'reference', _ref: cid },
    status: 'draft', expiryDate: iso(14),
    clientLocation: land, language: land === 'nl' ? 'nl' : 'en',
    message: 'Testofferte — mag weg.',
    items: [{
      _key: 'p1', _type: 'proposalItem',
      artwork: { _type: 'reference', _ref: aid },
      priceOverride: AFGESPROKEN_EXCL,   // excl. BTW, net als het schema zegt
      showPrice: true,
    }],
  } as never)
}
console.log('  ✓ 2 offertes, afgesproken prijs €1800 excl.')

// ── 0. Versturen ─────────────────────────────────────────────────────────────
console.log('\n── 0. Offerte versturen ──')
const numberRoute = await import('../src/app/api/admin/generate-number/route')
const nummers: Record<string, string> = {}
for (const [pid, land] of [[ID.proposalNl, 'nl'], [ID.proposalEu, 'eu']] as const) {
  const res = await numberRoute.GET({
    nextUrl: new URL('http://x/api/admin/generate-number?type=proposal'),
    cookies: { get: () => undefined },
    headers: { get: (h: string) => (h === 'x-sanity-token' ? process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN : null) },
  } as never)
  const { number } = await res.json()
  nummers[land] = number
  await admin.patch(pid).set({ status: 'sent', proposalNumber: number }).commit()
  console.log(`  ✓ ${land.toUpperCase()} → ${number}`)
}

// ── 1. Wat ziet de klant? ────────────────────────────────────────────────────
console.log('\n── 1. Wat de klant op de offertepagina ziet ──')
const { fmtProposalPrice } = await import('../src/app/proposal/[id]/priceLabel')
for (const [pid, land, verwacht, woord] of [
  [ID.proposalNl, 'nl', AFGESPROKEN_INCL, 'incl.'],
  [ID.proposalEu, 'eu', AFGESPROKEN_EXCL, 'excl.'],
] as const) {
  const p = await admin.fetch<{ clientLocation: string; items: Record<string, unknown>[] }>(
    `*[_id == $id][0]{ clientLocation, items[]{ priceOverride, showPrice,
      "artwork": artwork->{ priceIncVat, "priceExVat": priceExclVAT, vatRate } } }`,
    { id: pid }
  )
  const label = fmtProposalPrice(p.items[0] as never, p.clientLocation)
  const bedrag = Number(String(label).replace(/[^0-9]/g, '').slice(0, 4))
  check(`${land.toUpperCase()}: klant ziet €${verwacht}`, bedrag === verwacht, String(label))
  check(`${land.toUpperCase()}: juiste BTW-vermelding`, String(label).includes(woord), String(label))
}

// ── 2. Omzetten naar verkoop via de échte route ──────────────────────────────
console.log('\n── 2. Offerte wordt verkoop (/api/manual-sale) ──')
const saleRoute = await import('../src/app/api/manual-sale/route')
for (const [pid, cid, aid, land, voor, achter, mail] of [
  [ID.proposalNl, ID.contactNl, ID.artworkNl, 'nl', 'Nina', 'Nederland', 'nina.nederland@example.invalid'],
  [ID.proposalEu, ID.contactEu, ID.artworkEu, 'eu', 'Emil', 'Europa', 'emil.europa@example.invalid'],
] as const) {
  await admin.patch(pid).set({ status: 'accepted' }).commit()

  // Wat de verkooptool doorgeeft na de overdracht vanuit de offerte: het
  // reeksnummer zonder PROP-, de afgesproken prijs excl. BTW, en de herkomst.
  const res = await saleRoute.POST({
    headers: { get: (h: string) => (h === 'x-sanity-token' ? process.env.SANITY_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN : null) },
    cookies: { get: () => undefined },
    json: async () => ({
      contactId: cid,
      firstName: voor, lastName: achter, email: mail,
      items: [{
        artworkId: aid, artworkTitle: `Offertewerk (${land})`, artworkYear: 2026,
        copyNumber: '', priceExclVAT: AFGESPROKEN_EXCL, vatRate: 9,
      }],
      soldVia: 'gallery', saleDate: iso(0),
      invoiceNumber: nummers[land].replace(/^PROP-/, ''),
      paid: true, sendConfirmation: false,
      notes: 'Uit testofferte — mag weg.',
      proposalId: pid,
    }),
  } as never)
  const body = await res.json()
  check(`${land.toUpperCase()}: verkoop geaccepteerd`, !body.error, JSON.stringify(body).slice(0, 120))
}

// ── 3. Klopt de administratie? ───────────────────────────────────────────────
console.log('\n── 3. Order, contact en offerte aan elkaar ──')
for (const [pid, cid, land] of [
  [ID.proposalNl, ID.contactNl, 'nl'], [ID.proposalEu, ID.contactEu, 'eu'],
] as const) {
  const o = await admin.fetch<Record<string, unknown>>(
    `*[_type == "order" && contact._ref == $c][0]{
      orderNumber, "contact": contact._ref, "proposal": proposal._ref, status, totalAmount
    }`, { c: cid }
  )
  check(`${land.toUpperCase()}: order gekoppeld aan het contact`, o?.contact === cid, String(o?.contact ?? 'leeg'))
  check(`${land.toUpperCase()}: order verwijst naar de offerte`, o?.proposal === pid, String(o?.proposal ?? 'leeg'))
  check(`${land.toUpperCase()}: factuurnummer volgt de offerte`,
    o?.orderNumber === (nummers[land] ?? '').replace(/^PROP-/, ''),
    `${nummers[land] ?? 'geen nummer'} → ${o?.orderNumber}`)
  console.log(`    /admin/invoices/${o?.orderNumber}`)
}

// ── 4. Factuur naast de offerte ──────────────────────────────────────────────
console.log('\n── 4. Factuur naast de offerte ──')
const { vatTreatment } = await import('../src/lib/invoiceVat')
for (const [cid, land, gezien] of [
  [ID.contactNl, 'nl', AFGESPROKEN_INCL], [ID.contactEu, 'eu', AFGESPROKEN_EXCL],
] as const) {
  const o = await admin.fetch<{ items: { price: number; priceExcl: number; vatRate: number }[] }>(
    `*[_type == "order" && contact._ref == $c][0]{items[]{price, priceExcl, vatRate}}`, { c: cid })
  const regel = o.items[0]
  const rule = vatTreatment(land as never)
  const tarief = rule.rate(Number(regel.vatRate ?? 9))
  // De regel bewaart netto én wat de klant betaalt; het tarief van de klant
  // bepaalt het verschil. Terugrekenen vanaf `price` met het werktarief zou bij
  // een EU-klant (0%) een verkeerd netto opleveren.
  const teBetalen = Math.round(regel.priceExcl * (1 + tarief / 100))
  check(`${land.toUpperCase()}: factuurtotaal = wat de klant zag`, teBetalen === gezien,
    `offerte €${gezien} · factuur €${teBetalen} (${tarief}% btw)`)
  if (rule.note) console.log(`    vermelding: ${rule.note.nl}`)
}

// ── 5. Werk en CRM ───────────────────────────────────────────────────────────
console.log('\n── 5. Eindtoestand ──')
for (const [aid, land] of [[ID.artworkNl, 'nl'], [ID.artworkEu, 'eu']] as const) {
  const a = await admin.fetch<Record<string, unknown>>(
    `*[_id == $id][0]{status, availableInShop}`, { id: aid })
  check(`${land.toUpperCase()}: werk staat op verkocht`, a?.status === 'sold', String(a?.status))
}
for (const [cid, land] of [[ID.contactNl, 'nl'], [ID.contactEu, 'eu']] as const) {
  const n = await admin.fetch<number>(`count(*[_id == $c][0].purchases)`, { c: cid })
  check(`${land.toUpperCase()}: aankoop in het CRM`, n === 1, `${n}`)
}

console.log(`\n${fails === 0 ? 'Alles klopt.' : `${fails} punt(en) kloppen niet.`}`)
console.log('Opruimen: npx tsx --env-file=.env.local scripts/testrun-proposal.mts --cleanup')
process.exit(fails === 0 ? 0 : 1)

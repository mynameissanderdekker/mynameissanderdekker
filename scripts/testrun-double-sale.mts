/**
 * Kan één uniek werk twee keer verkocht worden? — via de echte manual-sale
 * route, zoals de verkooptool hem aanroept.
 *
 *   1. na elkaar — het werk staat al op verkocht als de tweede verkoop komt
 *   2. tegelijk  — beide lezen "beschikbaar" voordat een van beide schrijft
 *   3. twee verschillende werken tegelijk, met hetzelfde "volgende" nummer
 *      uit de tool — er horen twee verschillende nummers uit te komen
 *
 *   npx tsx --env-file=.env.local scripts/testrun-double-sale.mts
 *   npx tsx --env-file=.env.local scripts/testrun-double-sale.mts --cleanup
 */

import { createClient } from '@sanity/client'

const CLEANUP = process.argv.includes('--cleanup')
const TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN
const admin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-06-18', token: TOKEN, useCdn: false,
}).withConfig({ perspective: 'raw' })

const ID = { seq: 'TEST-dbl-seq', par: 'TEST-dbl-par', nrA: 'TEST-dbl-nr-a', nrB: 'TEST-dbl-nr-b' }
const MAIL_A = 'koper-a@example.invalid'
const MAIL_B = 'koper-b@example.invalid'

if (CLEANUP) {
  const found = await admin.fetch<{ _id: string }[]>(
    `*[_id in $ids || (_type == "order" && customerEmail in $mails) || (_type == "contact" && email in $mails)]{_id}`,
    { ids: Object.values(ID), mails: [MAIL_A, MAIL_B] })
  const tx = admin.transaction(); for (const d of found) tx.delete(d._id); if (found.length) await tx.commit()
  console.log(`${found.length} testdocument(en) verwijderd.`); process.exit(0)
}

let fails = 0
const check = (l: string, ok: boolean, d = '') => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? `  — ${d}` : ''}`); if (!ok) fails++ }

for (const [k, id] of Object.entries(ID)) {
  await admin.createOrReplace({
    _id: id, _type: 'artwork', title: `Dubbelverkoop ${k}`,
    slug: { _type: 'slug', current: id.toLowerCase() }, editionType: 'unique',
    priceIncVat: 1090, priceExclVAT: 1000, vatRate: 9, status: 'available',
  } as never)
}
const oud = await admin.fetch<{ _id: string }[]>(`*[_type == "order" && customerEmail in $mails]{_id}`, { mails: [MAIL_A, MAIL_B] })
if (oud.length) { const tx = admin.transaction(); for (const d of oud) tx.delete(d._id); await tx.commit() }

const authHeaders = { get: (h: string) => (h === 'x-sanity-token' ? TOKEN : null) }
const noCookies = { get: () => undefined }
const { nextNumber } = await import('../src/lib/nextNumber')
const sale = await import('../src/app/api/manual-sale/route')

const verkoop = async (artworkId: string, email: string, naam: string, invoiceNumber: string) => {
  const res = await sale.POST({
    headers: authHeaders, cookies: noCookies,
    json: async () => ({
      firstName: naam, lastName: 'Test', email,
      items: [{ artworkId, artworkTitle: 'x', artworkYear: 2026, copyNumber: '', priceExclVAT: 1000, vatRate: 9 }],
      soldVia: 'direct', saleDate: new Date().toISOString().slice(0, 10), invoiceNumber, paid: false,
    }),
  } as never)
  const body = await res.json().catch(() => ({})) as { invoiceNumber?: string; error?: string }
  return res.status === 200 ? `ok ${body.invoiceNumber}` : `geweigerd (${res.status}): ${String(body.error).slice(0, 60)}`
}
const ordersVoor = (id: string) =>
  admin.fetch<{ orderNumber: string; customerEmail: string }[]>(`*[_type == "order" && references($id)]{orderNumber, customerEmail}`, { id })

console.log('── 1. Twee verkopen na elkaar van hetzelfde unieke werk ──')
const r1a = await verkoop(ID.seq, MAIL_A, 'Anna', await nextNumber(admin, { fallbackPrefix: 'SDK' }))
const status1 = await admin.fetch<string>(`*[_id == $id][0].status`, { id: ID.seq })
check('eerste verkoop lukt en zet het werk op verkocht', r1a.startsWith('ok') && status1 === 'sold', `${r1a} · status ${status1}`)
const r1b = await verkoop(ID.seq, MAIL_B, 'Bram', await nextNumber(admin, { fallbackPrefix: 'SDK' }))
const o1 = await ordersVoor(ID.seq)
check('tweede verkoop van een verkocht werk wordt geweigerd', !r1b.startsWith('ok'), r1b)
check('precies één order voor dit werk', o1.length === 1, o1.map((o) => `${o.orderNumber} (${o.customerEmail})`).join(', '))

console.log('\n── 2. Twee verkopen op precies hetzelfde moment ──')
const nr2 = await nextNumber(admin, { fallbackPrefix: 'SDK' })
const [r2a, r2b] = await Promise.all([verkoop(ID.par, MAIL_A, 'Anna', nr2), verkoop(ID.par, MAIL_B, 'Bram', nr2)])
const o2 = await ordersVoor(ID.par)
check('één van de twee slaagt, de ander wordt geweigerd', [r2a, r2b].filter((r) => r.startsWith('ok')).length === 1, `A: ${r2a} · B: ${r2b}`)
check('precies één order voor dit werk', o2.length === 1, o2.map((o) => `${o.orderNumber} (${o.customerEmail})`).join(', '))

console.log('\n── 3. Twee verschillende werken, allebei met hetzelfde "volgende" nummer uit de tool ──')
const nr3 = await nextNumber(admin, { fallbackPrefix: 'SDK' })
const [r3a, r3b] = await Promise.all([verkoop(ID.nrA, MAIL_A, 'Anna', nr3), verkoop(ID.nrB, MAIL_B, 'Bram', nr3)])
const o3 = await admin.fetch<{ orderNumber: string }[]>(`*[_type == "order" && (references($a) || references($b))]{orderNumber}`, { a: ID.nrA, b: ID.nrB })
const nrs = o3.map((o) => o.orderNumber)
check('beide verkopen slagen', r3a.startsWith('ok') && r3b.startsWith('ok'), `A: ${r3a} · B: ${r3b}`)
check('twee orders met twee verschillende nummers', nrs.length === 2 && new Set(nrs).size === 2, nrs.join(', '))
check('de tool krijgt het werkelijke nummer terug', r3a.split(' ')[1] !== r3b.split(' ')[1], `${r3a} · ${r3b}`)

console.log(fails ? `\n${fails} punt(en) kloppen niet.` : '\nEén werk, één verkoop.')
console.log('Opruimen: npx tsx --env-file=.env.local scripts/testrun-double-sale.mts --cleanup')
process.exit(fails ? 1 : 0)

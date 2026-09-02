/**
 * Dezelfde cyclus, maar dan via de webshop.
 *
 *   werk in de shop → afrekenen → Stripe-webhook → order, koper, voorraad →
 *   factuur → betaald → verzonden → archief
 *
 * De webhook draait hier écht, inclusief handtekeningcontrole: het bericht
 * wordt ondertekend met `STRIPE_WEBHOOK_SECRET` uit de eigen omgeving, precies
 * zoals Stripe dat doet. Zou de route alleen ná de controle worden aangeroepen,
 * dan blijft juist het stuk ongetest dat in productie als eerste stukloopt.
 *
 *   npx tsx --env-file=.env.local scripts/testrun-webshop.mts
 *   npx tsx --env-file=.env.local scripts/testrun-webshop.mts --cleanup
 */

import { createClient } from '@sanity/client'
import { createHmac } from 'node:crypto'

const CLEANUP = process.argv.includes('--cleanup')

const admin = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
}).withConfig({ perspective: 'raw' })

const ID = {
  uniek: 'TEST-shop-uniek',
  editie: 'TEST-shop-editie',
  coupon: 'TEST-shop-coupon',
  contact: 'TEST-shop-contact',
}
const KOPER = 'yara.yildiz@example.invalid'

if (CLEANUP) {
  const ids = Object.values(ID)
  const found = await admin.fetch<{ _id: string; _type: string }[]>(
    `*[_id in $ids || _id in $drafts
       || (_type == "contact" && email == $mail)
       || (_type == "order" && customerEmail == $mail)]{_id,_type}`,
    { ids, drafts: ids.map((i) => `drafts.${i}`), mail: KOPER }
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

// ── 1. Twee werken in de shop ────────────────────────────────────────────────
// Een uniek stuk en een editie van vijf: alleen zo zie je of de voorraad wordt
// afgeboekt in plaats van alles meteen op verkocht te zetten.
console.log('── 1. Werken in de webshop ──')
await admin.createOrReplace({
  _id: ID.uniek, _type: 'artwork', title: 'Shopwerk Uniek',
  slug: { _type: 'slug', current: 'test-shop-uniek' },
  year: 2026, medium: 'Print', dimensions: { widthCm: 40, heightCm: 30 },
  editionType: 'unique',
  priceIncVat: 545, priceExclVAT: 500, vatRate: 9,
  status: 'available', availableInShop: true,
} as never)
await admin.createOrReplace({
  _id: ID.editie, _type: 'artwork', title: 'Shopwerk Editie',
  slug: { _type: 'slug', current: 'test-shop-editie' },
  year: 2026, medium: 'Print', dimensions: { widthCm: 40, heightCm: 30 },
  editionType: 'edition', editionTotal: 5, stock: 5,
  priceIncVat: 327, priceExclVAT: 300, vatRate: 9,
  status: 'available', availableInShop: true,
} as never)
// Een echte kortingscode van 10%. De browser beweert straks dat dezelfde code
// 100% is: het verschil tussen die twee is wat de server hoort te bepalen.
await admin.createOrReplace({
  _id: ID.coupon, _type: 'coupon', code: 'TESTKORTING10',
  type: 'percentage', value: 10, active: true, usageCount: 0,
} as never)
// Een koper die al in het CRM staat, met een eigen adres en zonder
// factuurregime — de gewone toestand van een terugkerende klant.
await admin.createOrReplace({
  _id: ID.contact, _type: 'contact', firstName: 'Yara', lastName: 'Yildiz',
  email: KOPER, street: 'Oud Adres 9', postalCode: '9999 ZZ', city: 'Utrecht', country: 'NL',
} as never)
console.log('  ✓ uniek werk (€545) en editie van 5 (€327)')
console.log('  ✓ kortingscode TESTKORTING10 (10%) en een bestaand contact')

// ── 2. Afrekenen via de echte create-session ─────────────────────────────────
// Met een gemanipuleerde prijs en een verzonnen kortingscode: de server hoort
// beide te negeren en zelf te bepalen wat het kost.
console.log('\n── 2. Afrekenen (create-session) ──')
const createSession = await import('../src/app/api/checkout/create-session/route')
const cs = await createSession.POST({ json: async () => ({
  items: [
    { id: ID.uniek,  title: 'Shopwerk Uniek',  priceIncl: 1 },      // echte prijs €545
    { id: ID.editie, title: 'Shopwerk Editie', priceIncl: 1 },      // echte prijs €327
  ],
  // Een bestaande code, maar met verzonnen voorwaarden erbij: de browser
  // maakt er 100% van. De server hoort alleen de code te lezen en de rest
  // zelf uit de collectie te halen.
  coupon: { code: 'TESTKORTING10', type: 'percentage', value: 100, discountAmount: 872 },
}) } as never)
const csBody = await cs.json()
check('sessie aangemaakt', cs.status === 200 && !!csBody.url, `${cs.status} ${JSON.stringify(csBody).slice(0, 60)}`)

// Wat er werkelijk naar Stripe ging, halen we terug uit de sessie zelf.
const { getStripeClient } = await import('../src/lib/stripe')
const sessionId = String(csBody.url ?? '').match(/cs_test_[A-Za-z0-9]+/)?.[0] ?? ''
const stripeSession = await getStripeClient().checkout.sessions.retrieve(sessionId, { expand: ['line_items', 'total_details'] })
const stripeSubtotaal = (stripeSession.amount_subtotal ?? 0) / 100
const stripeKorting = (stripeSession.total_details?.amount_discount ?? 0) / 100
const stripeTotaal = (stripeSession.amount_total ?? 0) / 100
check('Stripe rekent de serverprijs (€872), niet €2', stripeSubtotaal === 872, `Stripe amount_subtotal €${stripeSubtotaal}`)
check('korting is de échte 10%, niet de 100% uit de browser', stripeKorting === 87.2, `korting €${stripeKorting}`)
check('te betalen €784,80', stripeTotaal === 784.8, `Stripe amount_total €${stripeTotaal}`)

const cs2 = await createSession.POST({ json: async () => ({ items: [{ id: ID.editie, title: 'x', priceIncl: 1, quantity: 9 }] }) } as never)
check('9 stuks bij voorraad 5 wordt geweigerd', cs2.status === 400, `${cs2.status} ${JSON.stringify(await cs2.json()).slice(0, 70)}`)

// De webhook krijgt de metadata die create-session heeft gezet — die nemen we
// letterlijk over, zodat de keten klopt van winkelwagen tot order.
const itemsJson = String(stripeSession.metadata?.itemsJson ?? '[]')
const sessionIdForHook = sessionId

const event = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: sessionIdForHook,
      object: 'checkout.session',
      // Wat Stripe werkelijk heeft afgerekend — inclusief de korting. Hier
      // stond het bedrag vóór korting, waardoor de order een hoger totaal
      // kreeg dan de klant betaalde en de korting nergens uit bleek.
      amount_total: stripeSession.amount_total ?? 0,
      currency: 'eur',
      customer_details: { email: KOPER, name: 'Yara Yildiz', phone: '+31 6 22222222' },
      collected_information: { shipping_details: { address: { line1: 'Weblaan 5', line2: null, postal_code: '1012 AB', city: 'Amsterdam', country: 'NL' } } },
      custom_fields: [],
      // De hele metadata van de echte sessie, niet alleen de regels: de
      // webhook leest daar ook de korting uit.
      metadata: stripeSession.metadata ?? { itemsJson },
    },
  },
}

// ── 3. De webhook, met een geldige handtekening ──────────────────────────────
console.log('\n── 2. Stripe-webhook ──')
const secret = process.env.STRIPE_WEBHOOK_SECRET
if (!secret) { console.error('Geen STRIPE_WEBHOOK_SECRET in .env.local'); process.exit(1) }

const payload = JSON.stringify(event)
const t = Math.floor(Date.now() / 1000)
const sig = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')

const webhook = await import('../src/app/api/checkout/webhook/route')
const res = await webhook.POST({
  text: async () => payload,
  headers: { get: (h: string) => (h.toLowerCase() === 'stripe-signature' ? `t=${t},v1=${sig}` : null) },
} as never)
const body = await res.json().catch(() => ({}))
check('webhook geaccepteerd', res.status === 200, `${res.status} ${JSON.stringify(body).slice(0, 100)}`)

// ── 4. Wat de webhook achterliet ─────────────────────────────────────────────
console.log('\n── 3. Order, koper en voorraad ──')
const order = await admin.fetch<Record<string, unknown>>(
  `*[_type == "order" && customerEmail == $mail][0]{
     _id, orderNumber, status, channel, fulfilment, totalAmount, totalExcl,
     discount, discountPercent,
     "contact": contact._ref, "n": count(items)
   }`, { mail: KOPER })
check('order aangemaakt', !!order, order ? String(order.orderNumber) : 'geen')
check('order staat op betaald', order?.status === 'paid', String(order?.status))
check('kanaal = webshop', order?.channel === 'webshop', String(order?.channel))
check('twee regels', order?.n === 2, `${order?.n}`)
check('bedrag klopt: €872 min 10%', Number(order?.totalAmount) === 784.8, `€${order?.totalAmount}`)
// Netto €800, korting naar rato €80 → €720. Zonder dit veld las het
// omzetcijfer `null` voor elke bestelling die vanzelf binnenkomt.
check('nettobedrag staat op de order', Number(order?.totalExcl) === 720, `totalExcl ${order?.totalExcl == null ? 'null' : `€${order?.totalExcl}`}`)
check('korting vastgelegd (10%, €80 netto)', order?.discountPercent === 10 && Number(order?.discount) === 80,
  `${order?.discountPercent ?? '—'}% / €${order?.discount ?? '—'}`)
const regels = await admin.fetch<{ priceExcl?: number; vatRate?: number; item?: string }[]>(`*[_type == "order" && customerEmail == $mail][0].items[]{priceExcl, vatRate, "item": item._ref}`, { mail: KOPER })
check('regels hebben netto, tarief en verwijzing naar het werk', regels.every((r) => r.priceExcl != null && r.vatRate != null && !!r.item), JSON.stringify(regels))

const contactId = order?.contact as string | undefined
check('order gekoppeld aan een contact', !!contactId, String(contactId ?? 'leeg'))
if (contactId) {
  const c = await admin.fetch<Record<string, unknown>>(
    `*[_id == $id][0]{firstName, lastName, email, street, city, clientLocation, subscribed, "n": count(purchases)}`,
    { id: contactId })
  check('koper heeft een naam', !!c.firstName, `${c.firstName} ${c.lastName ?? ''}`)
  check('bestaand contact hergebruikt', contactId === ID.contact, String(contactId))
  // Het bezorgadres van deze bestelling ging over het adres in het CRM heen —
  // ook als dat een cadeau naar iemand anders was. Het staat al op de order.
  check('bestaand adres níet overschreven', c.street === 'Oud Adres 9', `${c.street ?? '—'}, ${c.city ?? '—'}`)
  check('leeg factuurregime aangevuld', c.clientLocation === 'nl', String(c.clientLocation ?? 'leeg'))
  check('twee aankopen in het CRM', c.n === 2, `${c.n}`)
}

const uniek = await admin.fetch<Record<string, unknown>>(
  `*[_id == $id][0]{status, availableInShop, stock}`, { id: ID.uniek })
check('uniek werk verkocht', uniek.status === 'sold', String(uniek.status))
check('uniek werk uit de shop', uniek.availableInShop === false, String(uniek.availableInShop))

const editie = await admin.fetch<Record<string, unknown>>(
  `*[_id == $id][0]{status, availableInShop, stock}`, { id: ID.editie })
check('editie: voorraad omlaag', editie.stock === 4, `${editie.stock} van 5`)
check('editie: nog te koop', editie.status === 'available' && editie.availableInShop === true,
  `${editie.status}, in shop: ${editie.availableInShop}`)

// ── 5. Is de factuur op te vragen? ───────────────────────────────────────────
console.log('\n── 4. Factuur ──')
const nr = String(order?.orderNumber ?? '')
const gevonden = await admin.fetch<number>(
  // Zoals de factuurpagina zoekt: op ordernummer óf factuurnummer.
  `count(*[_type == "order" && (orderNumber == $n || invoiceNumber == $n)])`, { n: nr })
check('factuur vindbaar op het nummer', gevonden === 1, `${nr} → ${gevonden} treffer(s)`)
check('nummer volgt de factuurreeks', /^[A-Z]+-\d{2}-\d{3}$/.test(nr),
  `${nr} — een tijdstempel is geen factuurnummer`)
console.log(`    /admin/invoices/${nr}`)

// De factuur rekent zoals de factuurpagina rekent: netto per regel, min de
// korting, plus BTW over wat er overblijft. Dat bedrag moet gelijk zijn aan
// wat Stripe heeft afgeschreven — anders klopt de administratie niet met de
// bankafschrift, en dat is precies waar korting eerder misging.
const fRegels = await admin.fetch<{ priceExcl: number; vatRate: number; quantity?: number }[]>(
  `*[_type == "order" && customerEmail == $mail][0].items[]{priceExcl, vatRate, quantity}`, { mail: KOPER })
const fNetto = fRegels.reduce((s, r) => s + r.priceExcl * (r.quantity ?? 1), 0)
const fBtw = fRegels.reduce((s, r) => s + r.priceExcl * (r.quantity ?? 1) * (r.vatRate / 100), 0)
const fKorting = Number(order?.discount ?? 0)
const fKortingBtw = fNetto > 0 ? fKorting * (fBtw / fNetto) : 0
const factuurTotaal = Math.round((fNetto - fKorting + fBtw - fKortingBtw) * 100) / 100
check('factuurtotaal = wat Stripe afschreef', factuurTotaal === stripeTotaal,
  `factuur €${factuurTotaal} · Stripe €${stripeTotaal}`)

// ── 6. Van open naar archief ─────────────────────────────────────────────────
const { OPEN_ORDER_FILTER, DONE_ORDER_FILTER } = await import('../src/lib/orderStatus')
const orderId = String(order?._id)
async function waar() {
  const [open, archief] = await Promise.all([
    admin.fetch<number>(`count(*[_id == $id && ${OPEN_ORDER_FILTER}])`, { id: orderId }),
    admin.fetch<number>(`count(*[_id == $id && ${DONE_ORDER_FILTER}])`, { id: orderId }),
  ])
  return { open: open === 1, archief: archief === 1 }
}

console.log('\n── 5. Van open naar archief ──')
let plek = await waar()
check('betaald, nog niet weg → staat open', plek.open && !plek.archief,
  `open=${plek.open} archief=${plek.archief}`)

await admin.patch(orderId).set({ fulfilment: 'shipped', shippedAt: iso(0) }).commit()
plek = await waar()
check('verzonden → naar het archief', !plek.open && plek.archief,
  `open=${plek.open} archief=${plek.archief}`)

console.log(`\n${fails === 0 ? 'Alles klopt.' : `${fails} punt(en) kloppen niet.`}`)
console.log('Opruimen: npx tsx --env-file=.env.local scripts/testrun-webshop.mts --cleanup')
process.exit(fails === 0 ? 0 : 1)

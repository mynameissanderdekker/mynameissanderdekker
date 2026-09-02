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
console.log('  ✓ uniek werk (€545) en editie van 5 (€327)')

// ── 2. Afrekenen ─────────────────────────────────────────────────────────────
// De sessie die Stripe zou aanmaken, met dezelfde metadata als de checkout
// meestuurt — daar leest de webhook de regels uit.
const sessionId = `cs_test_${Date.now()}`
const itemsJson = JSON.stringify([
  { title: 'Shopwerk Uniek',  price: 545, quantity: 1, artworkId: ID.uniek },
  { title: 'Shopwerk Editie', price: 327, quantity: 1, artworkId: ID.editie },
])

const event = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: sessionId,
      object: 'checkout.session',
      amount_total: 87200,           // €872 in centen
      currency: 'eur',
      customer_details: { email: KOPER, name: 'Yara Yildiz', phone: '+31 6 22222222' },
      collected_information: {
        shipping_details: {
          address: {
            line1: 'Weblaan 5', line2: null,
            postal_code: '1012 AB', city: 'Amsterdam', country: 'NL',
          },
        },
      },
      custom_fields: [],
      metadata: { itemsJson },
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
     _id, orderNumber, status, channel, fulfilment, totalAmount,
     "contact": contact._ref, "n": count(items)
   }`, { mail: KOPER })
check('order aangemaakt', !!order, order ? String(order.orderNumber) : 'geen')
check('order staat op betaald', order?.status === 'paid', String(order?.status))
check('kanaal = webshop', order?.channel === 'webshop', String(order?.channel))
check('twee regels', order?.n === 2, `${order?.n}`)
check('bedrag klopt', Number(order?.totalAmount) === 872, `€${order?.totalAmount}`)

const contactId = order?.contact as string | undefined
check('order gekoppeld aan een contact', !!contactId, String(contactId ?? 'leeg'))
if (contactId) {
  const c = await admin.fetch<Record<string, unknown>>(
    `*[_id == $id][0]{firstName, lastName, email, street, city, subscribed, "n": count(purchases)}`,
    { id: contactId })
  check('koper heeft een naam', !!c.firstName, `${c.firstName} ${c.lastName ?? ''}`)
  check('adres overgenomen', !!c.street && !!c.city, `${c.street ?? '—'}, ${c.city ?? '—'}`)
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

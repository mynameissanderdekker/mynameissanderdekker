# Webshop Upgrade — van Torch Gallery naar mynameissanderdekker

De Torch Gallery versie heeft een aantal dingen die beter zijn dan de huidige
implementatie. Hieronder staat precies wat je moet upgraden en alle code erbij.

## Wat is beter in Torch

| Feature | Huidig | Torch (beter) |
|---|---|---|
| Shipping | Hardcoded NL/EU/World bedragen | Dynamische zones via Sanity |
| Order schema | Basis | + status history, tracking, shipping email |
| Studio | Geen badges | Live badge met nieuwe orders |
| Coupons | Niet aanwezig | Volledig coupon systeem |
| Klanten | `contact` schema | `customer` schema met order overview |
| Order emails | Basis | Shipped notificatie met track & trace |

---

## Stap 1 — Sanity schemas upgraden

### `src/sanity/schemas/order.ts` (vervang volledig)

```ts
import { defineField, defineType } from 'sanity'
import { OrderStatusHistoryTimeline } from '../components/OrderStatusHistoryTimeline'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import React from 'react'

const ORDER_STATUS_LIST = [
  { title: 'New', value: 'new' },
  { title: 'Processing', value: 'processing' },
  { title: 'Shipped', value: 'shipped' },
  { title: 'Delivered', value: 'delivered' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'Refunded', value: 'refunded' },
]

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({ name: 'orderNumber', title: 'Order number', type: 'string' }),
    defineField({
      name: 'status', title: 'Status', type: 'string',
      options: { list: ORDER_STATUS_LIST }, initialValue: 'new',
    }),
    defineField({ name: 'customerName', title: 'Customer name', type: 'string' }),
    defineField({ name: 'customerEmail', title: 'Customer email', type: 'string' }),
    defineField({ name: 'customerPhone', title: 'Customer phone', type: 'string' }),
    defineField({
      name: 'shippingAddress', title: 'Shipping address', type: 'object',
      fields: [
        { name: 'street', title: 'Street + house number', type: 'string' },
        { name: 'postalCode', title: 'Postal code', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'country', title: 'Country', type: 'string' },
      ],
    }),
    defineField({
      name: 'items', title: 'Items', type: 'array',
      of: [{
        type: 'object', fields: [
          { name: 'item', title: 'Artwork', type: 'reference', to: [{ type: 'artwork' }] },
          { name: 'title', title: 'Title (at time of purchase)', type: 'string' },
          { name: 'quantity', title: 'Quantity', type: 'number' },
          { name: 'price', title: 'Price per unit', type: 'number' },
        ],
      }],
    }),
    defineField({ name: 'shippingCost', title: 'Shipping cost', type: 'number' }),
    defineField({ name: 'totalAmount', title: 'Total amount (EUR)', type: 'number' }),
    defineField({ name: 'molliePaymentId', title: 'Mollie Payment ID', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created at', type: 'datetime' }),
    defineField({ name: 'trackingNumber', title: 'Tracking number', type: 'string' }),
    defineField({
      name: 'trackingCarrier', title: 'Carrier', type: 'string',
      options: { list: ['PostNL', 'DHL', 'UPS', 'Other'] },
    }),
    defineField({ name: 'shippedAt', title: 'Shipped at', type: 'datetime' }),
    defineField({ name: 'shippingEmailSentAt', type: 'datetime', title: 'Shipping email sent at', readOnly: true, hidden: true }),
    defineField({
      name: 'statusHistory', title: 'Status history', type: 'array', readOnly: true,
      of: [{
        type: 'object', name: 'statusHistoryEntry',
        fields: [
          { name: 'status', type: 'string' },
          { name: 'changedAt', type: 'datetime' },
          { name: 'changedBy', type: 'string' },
          { name: 'note', type: 'string' },
        ],
      }],
      components: { input: OrderStatusHistoryTimeline },
    }),
  ],
  orderings: [{ title: 'Order date, newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { customerName: 'customerName', orderNumber: 'orderNumber', status: 'status', totalAmount: 'totalAmount', createdAt: 'createdAt' },
    prepare({ customerName, orderNumber, status, totalAmount, createdAt }: any) {
      const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString('nl-NL') : ''
      const statusLabel = ORDER_STATUS_LIST.find(s => s.value === status)?.title || status || 'New'
      return {
        title: customerName || orderNumber || 'Order',
        subtitle: [dateLabel, totalAmount ? `€${totalAmount.toFixed(2)}` : '', statusLabel].filter(Boolean).join(' · '),
        media: () => React.createElement(OrderStatusBadge, { status }),
      }
    },
  },
})
```

### `src/sanity/schemas/shippingZone.ts` (nieuw bestand)

```ts
import { defineField, defineType } from 'sanity'

const SHIPPING_METHOD_TYPES = [
  { title: 'Flat rate', value: 'flat_rate' },
  { title: 'Free shipping', value: 'free_shipping' },
  { title: 'Local pickup', value: 'local_pickup' },
]

export default defineType({
  name: 'shippingZone',
  title: 'Shipping Zone',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({ name: 'zoneName', title: 'Zone name', description: 'E.g. "Netherlands", "European Union", "Rest of the World"', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'regions', title: 'Regions', description: 'Country codes, e.g. ["NL"] or ["*"] for catch-all', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({
      name: 'shippingMethods', title: 'Shipping methods', type: 'array',
      of: [{
        type: 'object', name: 'shippingMethod',
        fields: [
          { name: 'methodType', title: 'Method type', type: 'string', options: { list: SHIPPING_METHOD_TYPES }, initialValue: 'flat_rate' },
          { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'cost', title: 'Cost (EUR)', type: 'number' },
          { name: 'freeShippingMinimum', title: 'Free shipping above (EUR)', type: 'number' },
        ],
      }],
    }),
  ],
  preview: {
    select: { title: 'zoneName', regions: 'regions', active: 'active' },
    prepare({ title, regions, active }: any) {
      return { title, subtitle: [Array.isArray(regions) ? regions.join(', ') : null, active ? 'Active' : 'Inactive'].filter(Boolean).join(' · ') }
    },
  },
})
```

### `src/sanity/schemas/shippingClass.ts` (nieuw bestand)

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'shippingClass',
  title: 'Shipping Class',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({ name: 'name', title: 'Name', description: 'E.g. "Small / Books", "Large Works"', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
  ],
  preview: { select: { title: 'name', subtitle: 'slug' } },
})
```

### `src/sanity/schemas/coupon.ts` (nieuw bestand)

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'coupon',
  title: 'Coupon',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({ name: 'code', title: 'Code', description: 'E.g. "SANDER20"', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'type', title: 'Type', type: 'string', options: { list: [{ title: 'Percentage', value: 'percentage' }, { title: 'Fixed amount', value: 'fixed' }] }, initialValue: 'percentage' }),
    defineField({ name: 'value', title: 'Value', description: 'E.g. 20 (%) or 25 (€)', type: 'number', validation: Rule => Rule.required().positive() }),
    defineField({ name: 'minOrderAmount', title: 'Minimum order amount (EUR)', type: 'number' }),
    defineField({ name: 'validFrom', title: 'Valid from', type: 'date' }),
    defineField({ name: 'validUntil', title: 'Valid until', type: 'date' }),
    defineField({ name: 'usageLimit', title: 'Usage limit', type: 'number' }),
    defineField({ name: 'usageCount', title: 'Usage count', type: 'number', readOnly: true, initialValue: 0 }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'code', type: 'type', value: 'value', active: 'active' },
    prepare({ title, type, value, active }: any) {
      return { title, subtitle: [(type === 'percentage' ? `${value}%` : `€${value}`), active ? 'Active' : 'Inactive'].join(' · ') }
    },
  },
})
```

### `src/sanity/schemaTypes/index.ts` — voeg toe aan de imports en types array

```ts
import shippingZone from '../schemas/shippingZone'
import shippingClass from '../schemas/shippingClass'
import coupon from '../schemas/coupon'

// In de types array:
shippingZone,
shippingClass,
coupon,
```

---

## Stap 2 — Studio componenten

### `src/sanity/components/OrderStatusBadge.tsx` (nieuw)

```tsx
'use client'
import React from 'react'

const STATUS_COLORS: Record<string, string> = {
  new: '#e03131', pending: '#e03131', processing: '#f08c00',
  shipped: '#2f9e44', delivered: '#2f9e44', cancelled: '#868e96', refunded: '#868e96',
}
const STATUS_LABELS: Record<string, string> = {
  new: 'New', pending: 'Pending', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}

export function OrderStatusBadge({ status }: { status?: string }) {
  const color = STATUS_COLORS[status ?? ''] || '#868e96'
  const label = STATUS_LABELS[status ?? ''] || status || 'New'
  return (
    <span title={label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 25, height: 25, borderRadius: '50%', background: color, flexShrink: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
    </span>
  )
}
```

### `src/sanity/components/OrderStatusHistoryTimeline.tsx` (nieuw)

```tsx
'use client'
import type { ArrayOfObjectsInputProps } from 'sanity'

const STATUS_META: Record<string, { label: string; emoji: string }> = {
  pending: { label: 'Pending', emoji: '⏳' }, new: { label: 'New', emoji: '🆕' },
  processing: { label: 'Processing', emoji: '⚙️' }, shipped: { label: 'Shipped', emoji: '📦' },
  delivered: { label: 'Delivered', emoji: '✅' }, cancelled: { label: 'Cancelled', emoji: '❌' },
  refunded: { label: 'Refunded', emoji: '💸' },
}

interface Entry { _key: string; status?: string; changedAt?: string; changedBy?: string; note?: string }

function formatDate(iso?: string) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return `${d.toLocaleDateString('nl-NL')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
}

export function OrderStatusHistoryTimeline(props: ArrayOfObjectsInputProps) {
  const items = ([...(props.value as unknown as Entry[] ?? [])]).sort((a, b) => (b.changedAt || '').localeCompare(a.changedAt || ''))
  if (!items.length) return <div style={{ fontSize: 13, color: '#888', padding: '8px 0' }}>Nog geen status wijzigingen.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(entry => {
        const meta = STATUS_META[entry.status ?? ''] ?? { label: entry.status || 'Unknown', emoji: '•' }
        return (
          <div key={entry._key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 4 }}>
            <span>{meta.emoji}</span>
            <span style={{ fontWeight: 500 }}>{meta.label}</span>
            <span style={{ color: '#888' }}>— {formatDate(entry.changedAt)} — {entry.changedBy || 'system'}{entry.note ? ` (${entry.note})` : ''}</span>
          </div>
        )
      })}
    </div>
  )
}
```

### `src/sanity/components/OrderCountBadge.tsx` (nieuw)

```tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function OrderCountBadge() {
  const client = useClient({ apiVersion: '2024-01-01' }).withConfig({ perspective: 'drafts' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const fetch = () => client.fetch<number>(`count(*[_type == "order" && status in ["pending", "new"]])`).then(n => { if (mounted) setCount(n) })
    fetch()
    const sub = client.listen(`*[_type == "order"]`, {}, { visibility: 'query' }).subscribe(fetch)
    return () => { mounted = false; sub.unsubscribe() }
  }, [client])

  if (!count) return null
  return <span title={`${count} order${count === 1 ? '' : 's'}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, fontSize: 11 }}><span className="orders-badge-pulse">🔴</span></span>
}
```

### `src/sanity/components/StudioLayout.tsx` — voeg de pulse CSS toe

Voeg dit toe aan je bestaande StudioLayout, of maak een nieuw bestand aan:

```tsx
'use client'
import React from 'react'

interface LayoutProps { renderDefault: (props: LayoutProps) => React.JSX.Element }

const css = `
  @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
  .orders-badge-pulse { display: inline-block; animation: pulse 1.5s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .orders-badge-pulse { animation: none; } }
`

export function StudioLayout({ renderDefault, ...props }: LayoutProps) {
  return <><style>{css}</style>{renderDefault({ renderDefault, ...props } as LayoutProps)}</>
}
```

---

## Stap 3 — Sanity config updaten

In `sanity.config.ts`, voeg de StudioLayout en orderActions toe:

```ts
import { StudioLayout } from './src/sanity/components/StudioLayout'
import { withShippedNotification, withStatusHistory } from './src/sanity/actions/orderActions'

export default defineConfig({
  // ...bestaande config...
  studio: {
    components: { layout: StudioLayout },
  },
  document: {
    actions: (prev, ctx) => {
      if (ctx.schemaType === 'order') {
        return prev.map(action =>
          action.action === 'publish'
            ? withShippedNotification(withStatusHistory(action))
            : action
        )
      }
      return prev
    },
  },
})
```

### `src/sanity/actions/orderActions.tsx` (nieuw bestand)

```tsx
import { useCurrentUser, useDocumentOperation } from 'sanity'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'

interface OrderDoc { status?: string; trackingNumber?: string; shippingEmailSentAt?: string }

function buildEntry(status: string, changedBy: string) {
  return { _key: crypto.randomUUID(), _type: 'statusHistoryEntry', status, changedAt: new Date().toISOString(), changedBy }
}

export function withShippedNotification(originalAction: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const original = originalAction(props)
    if (!original) return original
    const draft = props.draft as OrderDoc | null
    const published = props.published as OrderDoc | null
    const next = draft ?? published
    const willTrigger = next?.status === 'shipped' && !!next?.trackingNumber && published?.status !== 'shipped' && !next?.shippingEmailSentAt
    return {
      ...original,
      onHandle: () => {
        if (willTrigger) {
          fetch('/api/orders/notify-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: props.id }),
          }).catch(console.error)
        }
        original.onHandle?.()
      },
    }
  }
  Wrapped.action = originalAction.action
  return Wrapped
}

export function withStatusHistory(originalAction: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const currentUser = useCurrentUser()
    const { patch } = useDocumentOperation(props.id, props.type)
    const original = originalAction(props)
    if (!original) return original
    const draft = props.draft as OrderDoc | null
    const published = props.published as OrderDoc | null
    const next = draft ?? published
    const statusChanged = !!next?.status && next.status !== published?.status
    return {
      ...original,
      onHandle: () => {
        if (statusChanged && next?.status) {
          const entry = buildEntry(next.status, currentUser?.name || 'system')
          patch.execute([{ setIfMissing: { statusHistory: [] } }, { insert: { before: 'statusHistory[0]', items: [entry] } }])
        }
        original.onHandle?.()
      },
    }
  }
  Wrapped.action = originalAction.action
  return Wrapped
}
```

---

## Stap 4 — Library bestanden

### `src/lib/shipping.ts` (nieuw bestand)

```ts
export interface ShippingMethod {
  methodType?: 'flat_rate' | 'free_shipping' | 'local_pickup'
  title?: string
  cost?: number
  freeShippingMinimum?: number
}

export interface ShippingZone {
  _id: string
  zoneName: string
  regions?: string[]
  active?: boolean
  shippingMethods?: ShippingMethod[]
}

export function resolveShippingZone(country: string, zones: ShippingZone[]): ShippingZone | null {
  const active = zones.filter(z => z.active !== false)
  return active.find(z => z.regions?.includes(country)) ?? active.find(z => z.regions?.includes('*')) ?? null
}

export function calculateShippingCost(zone: ShippingZone | null, subtotal: number): number {
  if (!zone) return 0
  const method = zone.shippingMethods?.[0]
  if (!method || method.methodType === 'free_shipping') return 0
  if (method.freeShippingMinimum != null && subtotal >= method.freeShippingMinimum) return 0
  return method.cost ?? 0
}
```

### `src/lib/orderEmails.ts` (nieuw of vervang bestaand)

```ts
const TRACKING_URL: Record<string, (n: string, p?: string) => string> = {
  PostNL: (n, p) => p ? `https://jouw.postnl.nl/track-and-trace/${n}-NL-${p.replace(/\s/g, '')}` : `https://jouw.postnl.nl/track-and-trace/${n}`,
  DHL: n => `https://www.dhl.com/nl-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${n}`,
  UPS: n => `https://www.ups.com/track?loc=en_US&tracknum=${n}`,
}

export function buildOrderNotificationEmail(order: { orderNumber: string; customerName?: string; customerEmail?: string; customerPhone?: string; shippingAddress?: { street?: string; postalCode?: string; city?: string; country?: string }; items: { title: string; quantity: number; price: number }[]; shippingCost?: number; totalAmount: number }) {
  const a = order.shippingAddress
  const lines = [
    `Nieuwe bestelling: ${order.orderNumber}`, '',
    `Klant: ${order.customerName ?? '-'}`, `Email: ${order.customerEmail ?? '-'}`,
    order.customerPhone ? `Tel: ${order.customerPhone}` : null, '',
    'Verzendadres:', a?.street ?? '-',
    [a?.postalCode, a?.city].filter(Boolean).join(' ') || null, a?.country ?? null, '',
    'Items:', ...order.items.map(i => `  ${i.quantity} x ${i.title} — €${i.price.toFixed(2)}`), '',
    order.shippingCost ? `Verzending: €${order.shippingCost.toFixed(2)}` : null,
    `Totaal: €${order.totalAmount.toFixed(2)}`,
  ].filter((l): l is string => l !== null)
  return { subject: `Nieuwe bestelling — ${order.orderNumber}`, text: lines.join('\n') }
}

export function buildShippedEmail(order: { orderNumber: string; customerName?: string; trackingNumber: string; trackingCarrier?: string; postalCode?: string }) {
  const builder = order.trackingCarrier ? TRACKING_URL[order.trackingCarrier] : null
  const trackingUrl = builder ? builder(order.trackingNumber, order.postalCode) : null
  const lines = [
    `Hallo ${order.customerName || 'there'},`, '',
    `Je bestelling ${order.orderNumber} is verzonden!`, '',
    `Vervoerder: ${order.trackingCarrier || '-'}`,
    `Track & trace nummer: ${order.trackingNumber}`,
    trackingUrl ? `Volg je pakket: ${trackingUrl}` : null, '',
    'Met vriendelijke groet,', 'Sander Dekker',
  ].filter((l): l is string => l !== null)
  return { subject: `Je bestelling ${order.orderNumber} is verzonden`, text: lines.join('\n') }
}
```

---

## Stap 5 — API routes

### `src/app/api/shipping-zones/route.ts` (nieuw)

```ts
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

export const revalidate = 3600

export async function GET() {
  const zones = await client.fetch(`*[_type == "shippingZone" && active == true]{ _id, zoneName, regions, active, shippingMethods[]{ methodType, title, cost, freeShippingMinimum } }`)
  return Response.json(zones)
}
```

### `src/app/api/orders/notify-shipped/route.ts` (nieuw)

```ts
import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@sanity/client'
import { buildShippedEmail } from '@/lib/orderEmails'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Sander Dekker <studio@mynameissanderdekker.com>'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

export async function POST(request: NextRequest) {
  const { orderId } = await request.json()
  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  const order = await sanity.fetch<{ _id: string; orderNumber: string; customerName?: string; customerEmail?: string; status: string; trackingNumber?: string; trackingCarrier?: string; shippingEmailSentAt?: string; shippingAddress?: { postalCode?: string } } | null>(
    `*[_type == "order" && _id == $orderId][0]{ _id, orderNumber, customerName, customerEmail, status, trackingNumber, trackingCarrier, shippingEmailSentAt, shippingAddress }`,
    { orderId }
  )

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if (order.shippingEmailSentAt) return Response.json({ sent: false, reason: 'already_sent' })
  if (order.status !== 'shipped' || !order.trackingNumber) return Response.json({ sent: false, reason: 'not_shipped' })
  if (!order.customerEmail) return Response.json({ sent: false, reason: 'no_email' })

  const { subject, text } = buildShippedEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    postalCode: order.shippingAddress?.postalCode,
  })

  await resend.emails.send({ from: FROM, to: order.customerEmail, subject, text })
  await sanity.patch(order._id).set({ shippingEmailSentAt: new Date().toISOString() }).commit()

  return Response.json({ sent: true })
}
```

### `src/app/api/checkout/route.ts` — upgrade de shipping berekening

Vervang de hardcoded shipping logica in je bestaande checkout route door dit:

```ts
// Vervang de hardcoded shipping berekening door:
import { resolveShippingZone, calculateShippingCost } from '@/lib/shipping'

// Haal zones op uit Sanity (server-side, niet te vertrouwen van client)
const zones = await sanity.fetch(
  `*[_type == "shippingZone" && active == true]{ _id, zoneName, regions, active, shippingMethods }`
)
const shippingZone = resolveShippingZone(customer.country, zones)
const shipping = calculateShippingCost(shippingZone, subtotal)
```

### `src/app/api/mollie/webhook/route.ts` — voeg status history toe

Bij het verwerken van een betaling, voeg een status history entry toe:

```ts
// Na het updaten van de order status naar 'new':
const entry = {
  _key: crypto.randomUUID(),
  _type: 'statusHistoryEntry',
  status: 'new',
  changedAt: new Date().toISOString(),
  changedBy: 'system',
  note: `Betaling ontvangen via Mollie (${paymentId})`,
}

await sanity.patch(orderId).setIfMissing({ statusHistory: [] })
  .insert('before', 'statusHistory[0]', [entry]).commit()
```

---

## Stap 6 — Sanity structure

Voeg in `src/sanity/structure.ts` toe aan de WEBSHOP sectie:

```ts
S.listItem().title('Verzend zones').child(S.documentTypeList('shippingZone')),
S.listItem().title('Coupons').child(S.documentTypeList('coupon')),
```

---

## Stap 7 — Zet de eerste shipping zones in Sanity

Na het deployen, ga naar Studio → Webshop → Verzend zones en maak aan:

1. **Netherlands** — regions: `["NL"]` — flat rate €6,95 — free boven €150
2. **European Union** — regions: `["BE","DE","FR","IT","ES","AT","DK","SE","FI","PL"]` — flat rate €14,95
3. **Rest of the World** — regions: `["*"]` — flat rate €24,95

---

## Wat NIET over te nemen

- **CartContext** — jij gebruikt Zustand, dat is goed
- **EnquireModal** — is TORCH branding (info@torchgallery.com), niet relevant
- **CustomerOrdersOverview** — jij hebt `contact` i.p.v. `customer`, andere aanpak


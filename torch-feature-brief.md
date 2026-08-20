# Torch Gallery — Feature Implementation Brief

> ⚠️ **IMPORTANT — codebase scope**
> All work in this brief must be done in the **`torch-gallery`** repository only.
> Do NOT modify, reference, or copy files from any other site or repository.
> The torch-gallery site is a completely independent project.

This document describes features to add to the Torch Gallery Sanity/Next.js site.
Features 1–6 are collector/sales features built and battle-tested on a comparable site.
Features 7–9 are Torch-specific additions.
All edge cases and known bugs are documented.

---

## 1. Edition fields on Artwork (`editionType`, `editionTotal`, `editionAP`)

**What:** Replace the free-text `edition` field with structured fields that also support unique works.

**Why:** Free text can't be used to build dropdowns, validate sold copies, or show availability.
Torch has more unique works than editions, so "Unique" must be a first-class option.

**Schema change** (in your artwork schema):
```ts
defineField({
  name: 'editionType',
  title: 'Edition type',
  type: 'string',
  options: {
    list: [
      { title: 'Unique', value: 'unique' },
      { title: 'Edition', value: 'edition' },
    ],
    layout: 'radio',
  },
  initialValue: 'unique',
}),
defineField({
  name: 'editionTotal',
  title: 'Edition total',
  type: 'number',
  description: 'E.g. 7 (for an edition of 7 + 2 AP)',
  hidden: ({ parent }) => parent?.editionType !== 'edition',
}),
defineField({
  name: 'editionAP',
  title: 'Artist Proofs (AP)',
  type: 'number',
  description: 'E.g. 2',
  hidden: ({ parent }) => parent?.editionType !== 'edition',
}),
```

**Display logic:**
- `unique` → show "Unique work" badge. No edition dropdown on purchases — the copyNumber field is hidden or set automatically to "Unique".
- `edition` → show `editionTotal` + `editionAP` fields and the full edition dropdown on purchases.

**Group these** under an "Edition & Sales" field group in the artwork schema so they stay together.

**Pitfall — drafts:** If you patch existing artworks via the Sanity API, patch **both** the
published document AND the draft (`drafts.${id}`). Sanity Studio displays the draft over the
published version — so patching only the published document makes fields appear empty in Studio.

```js
// Patch published
await client.patch(id).set({ editionTotal, editionAP }).commit()
// Also patch draft if it exists
const draft = await client.fetch(`*[_id == $id][0]{_id}`, { id: `drafts.${id}` })
if (draft) await client.patch(`drafts.${id}`).set({ editionTotal, editionAP }).commit()
```

---

## 2. Edition dropdown on Contact purchases (`copyNumber`)

**What:** When adding a purchase to a contact, the "Edition" field (copyNumber) shows a dropdown
of available edition slots (1/7, 2/7 … 7/7, 1/2 AP, 2/2 AP) instead of a free-text input.

**How:** A custom Sanity `StringInput` component that reads the sibling `artwork` reference,
fetches `editionTotal` + `editionAP`, and builds the dropdown. Falls back to plain text input
if no artwork is selected or the artwork has no edition (e.g. publications).

**File:** `src/sanity/components/EditionPickerInput.tsx`

```tsx
'use client'
import React, { useEffect, useState } from 'react'
import { set, unset, useClient, useFormValue } from 'sanity'
import type { StringInputProps } from 'sanity'

export function EditionPickerInput(props: StringInputProps) {
  const { value, onChange, path } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  // path = [..., 'copyNumber'] — go up one level to read sibling 'artwork'
  const artworkRef = useFormValue([...path.slice(0, -1), 'artwork']) as { _ref?: string } | undefined
  const [editions, setEditions] = useState<string[]>([])

  useEffect(() => {
    if (!artworkRef?._ref) { setEditions([]); return }
    let cancelled = false
    client.fetch<{ editionTotal?: number; editionAP?: number }>(
      `*[_id == $id][0]{ editionTotal, editionAP }`,
      { id: artworkRef._ref }
    ).then(artwork => {
      if (cancelled || !artwork) return
      const total = artwork.editionTotal ?? 0
      const ap    = artwork.editionAP    ?? 0
      const opts: string[] = []
      for (let i = 1; i <= total; i++) opts.push(`${i}/${total}`)
      for (let i = 1; i <= ap; i++)    opts.push(`${i}/${ap} AP`)
      setEditions(opts)
    })
    return () => { cancelled = true }
  }, [artworkRef?._ref, client])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const v = e.target.value
    onChange(v ? set(v) : unset())
  }

  if (editions.length === 0) {
    return (
      <input type="text" value={value ?? ''} onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder={artworkRef?._ref ? 'No edition — leave blank for publications' : 'Select a work first'}
        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 3, fontSize: 14, fontFamily: 'inherit' }} />
    )
  }

  return (
    <select value={value ?? ''} onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 3, fontSize: 14, fontFamily: 'inherit', background: '#fff' }}>
      <option value="">— select edition —</option>
      {editions.map(e => <option key={e} value={e}>{e}</option>)}
    </select>
  )
}
```

**Wire it up** in your contact schema on the `copyNumber` field inside the `purchases` array:
```ts
defineField({
  name: 'copyNumber',
  title: 'Edition',
  type: 'string',
  components: { input: EditionPickerInput },
})
```

**Pitfall:** `useFormValue` needs the exact path. The path of `copyNumber` inside `purchases[i]`
is `['purchases', i, 'copyNumber']`. Slice off the last element and append `'artwork'` to get
the sibling reference path. This works correctly as shown above.

---

## 3. Buyers panel on Artwork (who bought which edition)

**What:** A read-only panel inside the Artwork document in Studio that shows a table of all
contacts who purchased that artwork, with their edition number, channel, and price. Also shows
"X/N available" at the top.

**How:** A custom Sanity field component (`FieldProps`). It reads the artwork ID from the Studio
URL (the last semicolon-separated segment), then queries all contacts whose `purchases[].artwork._ref`
matches.

**Important:** Use a **class component**, not a functional component with hooks. Sanity Studio v3
has a `useEffect`/`useEffectEvent` polyfill conflict that causes crashes in functional components
that call `useEffect` inside custom field renderers.

**File:** `src/sanity/components/ArtworkBuyers.tsx`

```tsx
import React from 'react'
import type { FieldProps } from 'sanity'

export class ArtworkBuyers extends React.Component<FieldProps, State> {
  componentDidMount() {
    // Extract artwork ID from Studio URL — always the last semicolon-separated segment
    const segments = window.location.pathname.split(';')
    const last = segments[segments.length - 1] ?? ''
    const artworkId = /^[A-Za-z0-9._-]{5,}$/.test(last) ? last : null
    if (!artworkId) { this.setState({ loading: false }); return }
    this.fetchBuyers(artworkId)
  }

  private async fetchBuyers(artworkId: string) {
    // Lazy-load @sanity/client to avoid SSR issues
    const { createClient } = await import('@sanity/client')
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? '',
      apiVersion: '2024-01-01',
      useCdn: false,
    })
    const result = await client.fetch(
      `{
        "artwork": *[_type == "artwork" && _id == $id][0]{ editionTotal, editionAP },
        "buyers": *[_type == "contact" && $id in purchases[].artwork._ref]{
          firstName, lastName, email,
          "purchases": purchases[artwork._ref == $id]{ copyNumber, soldVia, price }
        } | order(lastName asc)
      }`,
      { id: artworkId }
    )
    // setState with result...
  }
}
```

**Wire it up** in the artwork schema — add a `string` field (type doesn't matter, it's hidden) with
`components: { field: ArtworkBuyers }` and `readOnly: true`. Put it in the "Edition & Sales" group.

**Pitfall — no auth token:** The client created in `ArtworkBuyers` has no write token — it's
read-only and relies on the public API. This is intentional and correct. Do NOT put a write token
in a client-side component.

---

## 4. Register a Sale tool (Studio plugin)

**What:** A 3-step form in the Studio (not a page, a Studio tool) for quickly registering a
manual sale: 1) find or create a buyer, 2) add artworks with edition selection, 3) confirm
invoice details. On submit it creates the purchase on the contact and an order document, and
optionally emails an invoice to the buyer.

**How:** A Sanity Studio tool — register it in `sanity.config.ts`:
```ts
import { RegisterSaleTool } from './src/sanity/components/RegisterSaleTool'

export default defineConfig({
  // ...
  tools: [
    // existing tools...
    { name: 'register-sale', title: 'Register Sale', icon: ShoppingCartIcon, component: RegisterSaleTool }
  ]
})
```

**Where it appears:** NOT in the left sidebar. It appears in the **top toolbar** of the Studio,
next to "Content" and "Vision" — as a clickable tab/icon at the very top of the Studio interface.
This is standard Sanity Studio tool behaviour. If it doesn't appear, the tool is not registered
in `sanity.config.ts` or the Studio hasn't been rebuilt.

**Key implementation details:**

- **Contact search:** GROQ `*[_type == "contact" && (firstName match $q || lastName match $q || email match $q)]` with `$q = \`${input}*\`` (wildcard suffix). Debounce 150ms. Min 1 char (not 2).
- **Artwork search:** Same pattern but also add `!(_id in path("drafts.**"))` to exclude draft documents — otherwise every artwork appears twice when drafts exist.
- **Edition availability:** When an artwork is selected, fetch all `copyNumber` values from contacts who have purchased that artwork. Build all possible slots (`1/7` through `7/7`, `1/2 AP`, `2/2 AP`). Filter out already-sold ones.
- **Normalization of stored copy numbers:** Historical data may have bare numbers ("4" instead of "4/7"). Normalize before comparing:
  ```ts
  function normalizeCopy(copy: string, total: number, ap: number): string {
    if (!copy || copy.includes('/')) return copy
    const apMatch = copy.match(/^AP\s*(\d+)$/i)
    if (apMatch) return `AP ${apMatch[1]}/${ap}`
    const n = parseInt(copy, 10)
    if (!isNaN(n)) return `${n}/${total}`
    return copy
  }
  ```
- **Submit:** POST to `/api/manual-sale` (Next.js API route, see below). The tool sends a Sanity write token in the `x-sanity-token` header for auth:
  ```ts
  const sanityToken = (client as any).config?.()?.token ?? ''
  await fetch('/api/manual-sale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sanity-token': sanityToken },
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  ```

**Pitfall — auth:** The API route needs to accept both an admin cookie AND a valid Sanity token.
Don't require only one — the Studio uses the Sanity token, the admin page uses the cookie.

---

## 5. `/api/manual-sale` API route

**What:** The backend that the Register Sale tool (and optionally an admin page) POST to.

**What it does:**
1. Auth check: admin cookie OR valid Sanity write token (verified against Sanity's `/v1/users/me`)
2. Find or create contact by email
3. Append purchase entries to `contact.purchases[]`
4. Create an `order` document
5. Sync contact to Mailchimp (non-fatal if it fails)
6. Send invoice email to buyer via Resend (optional, `sendConfirmation` flag)
7. Send internal notification email to gallery

**Purchase entry structure** (appended to `contact.purchases[]`):
```ts
{
  _key:       crypto.randomUUID(),
  artwork:    { _type: 'reference', _ref: artworkId },
  copyNumber: '3/7',          // edition slot
  soldVia:    'direct',       // 'direct' | 'gallery' | 'artfair' | 'other'
  date:       '2026-08-09',
  price:      1200,           // excl. VAT
}
```

**Pitfall — duplicate contacts:** Always look up by email before creating. If found, patch the
existing contact rather than creating a duplicate:
```ts
const existing = await sanity.fetch(`*[_type == "contact" && email == $email][0]{_id}`, { email })
const contactId = existing?._id ?? (await sanity.create({ _type: 'contact', ... }))._id
```

---

## 6. Mailchimp sync

**What:** When a contact is created or updated (via the API route, or via a Sanity webhook), sync
them to Mailchimp using a PUT (upsert) to the members endpoint.

**Key details:**
- Hash the email with MD5 to get the subscriber hash (required by Mailchimp API)
- Use `status_if_new: 'subscribed'` for new members, but respect `subscribed: false` for existing
- Apply tags based on contact type (`collector` → `'Collector'`, `gallery` → `'Gallery'`, etc.)
- **Skip placeholder emails:** never sync emails ending in `.placeholder`, `.test`, `.local` etc.
- The function should be non-fatal — wrap in try/catch and log, don't throw

```ts
export async function syncToMailchimp(contact: { email, firstName, lastName, type, country, subscribed }) {
  const PLACEHOLDER_DOMAINS = ['.placeholder', '.test', '.example', '.invalid', '.local']
  if (PLACEHOLDER_DOMAINS.some(d => contact.email.split('@')[1]?.endsWith(d))) return

  const hash = crypto.createHash('md5').update(contact.email.toLowerCase().trim()).digest('hex')
  const dc   = process.env.MAILCHIMP_API_KEY.split('-')[1]  // e.g. "us15"
  const base = `https://${dc}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}`
  const auth = 'Basic ' + Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString('base64')

  await fetch(`${base}/members/${hash}`, {
    method: 'PUT',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_address: contact.email.toLowerCase().trim(),
      status_if_new: contact.subscribed === false ? 'unsubscribed' : 'subscribed',
      status:        contact.subscribed === false ? 'unsubscribed' : 'subscribed',
      merge_fields: {
        FNAME:   contact.firstName?.trim() || ' ',  // space avoids "required field" rejection
        LNAME:   contact.lastName?.trim()  || ' ',
        COUNTRY: contact.country ?? '',
      },
    }),
  })
}
```

**Trigger it** in the `manual-sale` API route after creating/updating the contact. Also optionally
wire it to a Sanity webhook (on contact create/update) — but the API route trigger is the
most important one to get right first.

---

## 7. View on Wall

**What:** A button on each artwork page that lets visitors see the artwork at scale on their own
wall using their phone camera (augmented reality) or a simple room visualizer (non-AR fallback).

**Recommended approach — two tiers:**

**Tier 1: AR on mobile (iOS/Android)** using the browser's native AR capabilities:
- iOS Safari supports USDZ files via `<a rel="ar">` — no library needed
- Android Chrome supports GLB/GLTF via `model-viewer` web component

For a 2D artwork (flat print/painting), generate a simple plane geometry textured with the
artwork image. This can be done at build time or on-demand.

**Tier 2: Simple room visualizer (fallback for desktop / non-AR browsers)** — a canvas overlay
that shows the artwork on a neutral wall at the correct aspect ratio with a scale reference
(e.g. "120 × 80 cm"). This is purely CSS/canvas, no library needed.

**Schema additions** (on Artwork):
```ts
defineField({ name: 'width',  title: 'Width (cm)',  type: 'number' }),
defineField({ name: 'height', title: 'Height (cm)', type: 'number' }),
```
These are needed to scale the artwork correctly in the room view.

**Simple room visualizer (no AR) implementation:**

```tsx
// RoomView.tsx — shows artwork on a neutral wall with scale indicator
export function RoomView({ imageUrl, widthCm, heightCm, title }: Props) {
  // Render artwork centered on a wall-textured div at the correct aspect ratio.
  // Show a silhouette figure (175cm tall) next to it for scale context.
  const aspect = widthCm / heightCm
  return (
    <div style={{ background: '#e8e4df', width: '100%', aspectRatio: '16/9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <img src={imageUrl} alt={title}
        style={{ height: '55%', aspectRatio: `${aspect}`, objectFit: 'cover', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }} />
      {/* scale figure SVG at right edge */}
    </div>
  )
}
```

**UI:** A "View on wall" button on the artwork detail page. On click, opens a modal/overlay
with the room view. On mobile, also show an "Open in AR" link if the browser supports it
(detect with `navigator.xr?.isSessionSupported('immersive-ar')`).

**Pitfall:** Don't generate 3D files on the fly in a serverless function — it's too slow.
Either pre-generate them (e.g. in a build script) or use a third-party service like
[Zakeke](https://www.zakeke.com) or [Artivive](https://artivive.com) if the client wants
true AR without custom 3D work.

---

## 8. Artwork URL (slug) with QR code

**What:** Each artwork has a public URL (`/works/[slug]`). In the Studio, display that URL
alongside a generated QR code that can be printed for use at fairs, in galleries, or on labels.

**How:**

**Schema:** Artwork already has a `slug` field. No schema change needed.

**Studio component** — add a read-only field to the artwork that renders the QR:

```tsx
// ArtworkQR.tsx
import React from 'react'
import type { FieldProps } from 'sanity'
import QRCode from 'qrcode'  // npm install qrcode

export class ArtworkQR extends React.Component<FieldProps, { url: string; qrDataUrl: string }> {
  constructor(props: FieldProps) {
    super(props)
    this.state = { url: '', qrDataUrl: '' }
  }

  async componentDidMount() {
    // Extract slug from Studio URL (last semicolon segment)
    const segments = window.location.pathname.split(';')
    const slug = segments[segments.length - 1]

    // Or read the slug from the document value via props.value if the field is on slug
    const url = `https://torch.gallery/works/${slug}`
    const qrDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 })
    this.setState({ url, qrDataUrl })
  }

  render() {
    const { url, qrDataUrl } = this.state
    if (!url) return null
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '8px 0' }}>
        {qrDataUrl && (
          <a href={qrDataUrl} download="artwork-qr.png" title="Download QR code">
            <img src={qrDataUrl} alt="QR code" width={100} height={100} style={{ border: '1px solid #eee', borderRadius: 4 }} />
          </a>
        )}
        <div>
          <p style={{ fontSize: 13, fontFamily: 'monospace', margin: '0 0 6px', color: '#374151' }}>{url}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#0066cc' }}>Open page ↗</a>
          <span style={{ color: '#ccc', margin: '0 8px' }}>·</span>
          {qrDataUrl && (
            <a href={qrDataUrl} download="artwork-qr.png"
              style={{ fontSize: 12, color: '#0066cc' }}>Download QR ↓</a>
          )}
        </div>
      </div>
    )
  }
}
```

**Wire it up** in the artwork schema — add a string field with `components: { field: ArtworkQR }`,
`readOnly: true`, placed in the artwork's main tab near the slug field.

**Better alternative for slug reading:** Instead of parsing the URL, read the slug directly from
the document. In Sanity Studio v3, a field component receives the entire document value via
`useFormValue([])`. Since `ArtworkQR` uses a class component (same reason as `ArtworkBuyers` —
avoid the hooks polyfill conflict), pass the document value down via a wrapper functional
component that reads the slug and passes it as a prop.

```tsx
// Wrapper to bridge hooks → class
function ArtworkQRWrapper(props: FieldProps) {
  const slug = useFormValue(['slug', 'current']) as string | undefined
  return <ArtworkQRInner {...props} slug={slug} />
}
```

**Print-friendly version:** On the public artwork page (`/works/[slug]`), also render the QR
in a `@media print` block so staff can print an artwork label directly from the browser.

---

---

## 9. Press document type

**What:** A `press` document type in Sanity for managing press coverage (articles, interviews,
reviews). Each press item can be linked to artworks, exhibitions, and art fairs. Displayed on
the public site and in artist/gallery CV.

**Schema** (`sanity/schemas/press.ts`):
```ts
export const press = defineType({
  name: 'press',
  title: 'Press',
  type: 'document',
  fields: [
    defineField({ name: 'title',       title: 'Article title',   type: 'string', validation: r => r.required() }),
    defineField({ name: 'publication', title: 'Publication',     type: 'string', description: 'E.g. "NRC", "Metropolis M"' }),
    defineField({ name: 'date',        title: 'Publication date', type: 'date' }),
    defineField({ name: 'url',         title: 'Article URL',     type: 'url', description: 'Optional — may be paywalled' }),
    defineField({ name: 'image',       title: 'Article scan / photo', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'body', title: 'Article text', type: 'array',
      of: [{ type: 'block', styles: [
        { title: 'Normal', value: 'normal' }, { title: 'H2', value: 'h2' }, { title: 'Quote', value: 'blockquote' }
      ]}],
    }),
    defineField({ name: 'artworks',    title: 'Related artworks',     type: 'array', of: [{ type: 'reference', to: [{ type: 'artwork' }] }] }),
    defineField({ name: 'exhibitions', title: 'Related exhibitions',  type: 'array', of: [{ type: 'reference', to: [{ type: 'exhibition' }, { type: 'artFair' }] }] }),
  ],
  preview: {
    select: { title: 'title', publication: 'publication', date: 'date', media: 'image' },
    prepare({ title, publication, date, media }) {
      const year = date ? new Date(date).getFullYear() : '?'
      return { title, subtitle: `${publication ?? ''} · ${year}`, media }
    },
  },
  orderings: [{ title: 'Date, newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
})
```

**Rule:** Always manage press links from the Press document (link to artworks/exhibitions from there),
never the other way around. This keeps one source of truth and avoids duplicate references.

---

## 10. Printable invoice page

**What:** A page at `/admin/invoices/[invoiceNumber]` that renders a clean, printable invoice
for any registered sale. Has a "Print / Save PDF" button (calls `window.print()`).

**Route:** `src/app/admin/invoices/[invoiceNumber]/page.tsx` — server component, fetches the
`order` document from Sanity by `orderNumber`.

**Auth:** Protect with middleware (check admin session cookie). Do NOT expose this route publicly.

**Data model** — the `order` document created by `/api/manual-sale`:
```ts
{
  _type:         'order',
  orderNumber:   'TG-202608-042',        // invoice number
  status:        'new',
  customerName:  'Jane Smith',
  customerEmail: 'jane@example.com',
  customerPhone: '+31 6 12345678',
  companyName:   'Smith Art B.V.',       // optional
  vatNumber:     'NL123456789B01',       // optional
  shippingAddress: { street, postalCode, city, country },
  items: [
    { _key: '...', title: 'Artwork Title (2024) — 3/7', quantity: 1, price: 1452.00 }
    // price is incl. VAT
  ],
  totalAmount:   1452.00,                // incl. VAT
  createdAt:     '2026-08-09T10:00:00Z',
  statusHistory: [{ status: 'new', changedAt: '...', note: 'Manual sale — direct' }],
}
```

**Invoice layout** (key elements):
- Header: gallery name + contact info (left) · invoice number + date (right)
- "Bill to" block: customer name, company, VAT number, email, address
- Items table: description (artwork title + edition + qty + channel) · amount
- Total row (incl. VAT)
- Payment instructions block (reference invoice number, bank account)
- Footer: gallery contact details

**Print CSS:**
```css
@media print {
  .no-print { display: none !important; }
  body { margin: 0; -webkit-print-color-adjust: exact; }
  .invoice-wrap { padding: 40px !important; max-width: 100% !important; }
}
```

**Pitfall:** Items store `price` incl. VAT (because that's what the buyer sees). If you want
to show excl. VAT subtotals on the invoice, store `priceExcl` and `vatRate` separately per item
in the order document — add those fields when creating the order in `/api/manual-sale`.

**After sale:** The `RegisterSaleTool` shows a "View invoice ↗" link pointing to
`/admin/invoices/[invoiceNumber]` on the success screen.

---

## Required env vars

```
MAILCHIMP_API_KEY=xxxx-us15
MAILCHIMP_AUDIENCE_ID=xxxxxxxx
RESEND_API_KEY=re_xxxxx
SANITY_WRITE_TOKEN=skxxxxxx
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
ADMIN_PASSWORD=xxxxx    # for admin page auth cookie
NEXT_PUBLIC_SITE_URL=https://torch.gallery   # used for QR code URLs
```

---

## Implementation order (recommended)

1. Schema: `editionType` (unique/edition) + `editionTotal` + `editionAP` + `width` + `height` on Artwork
2. Schema: `press` document type
3. `EditionPickerInput` on Contact purchases (respects `editionType: unique`)
4. `ArtworkBuyers` panel — immediate value, no backend needed
5. `ArtworkQR` panel — immediate value, no backend needed
6. `syncToMailchimp` utility function
7. `/api/manual-sale` route (include `priceExcl` + `vatRate` per item in the order document)
8. `RegisterSaleTool` Studio component
9. `/admin/invoices/[invoiceNumber]` invoice page
10. View on Wall — room visualizer (simple, no AR) as first version

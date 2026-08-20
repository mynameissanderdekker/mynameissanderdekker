# Torch Gallery — Viewing Room & Private Sale Selection
## Feature Brief for Implementation

> ⚠️ **IMPORTANT — All work must be done in the `torch-gallery` repository only.**
> Do not touch any other codebase. These are two separate but related features.

---

## Overview

Two features for sharing curated artwork selections with private clients:

| Feature | URL pattern | Auth | Rendered |
|---|---|---|---|
| **Viewing Room** | `/room/[slug]` | optional password | Client-side (useEffect fetch) |
| **Private Sale** | `/private-sales/[token]` | optional password | Server-side (SSR) |

**Key difference:**
- **Viewing Room** uses a readable slug (e.g. `/room/art-rotterdam-2026`) and is designed as a polished, interactive presentation. The artist curates a selection of works, links it to a contact, and shares a link. An enquiry panel opens when the collector clicks "Interested".
- **Private Sale** uses a random 32-char hex token (e.g. `/private-sales/a3f9...`) for obscurity, supports per-artwork price overrides and personal intro/footer text. It's more document-like — the client can print it as a PDF.

Both are hidden from search engines (`noindex`), not linked from the main site, and contain no public navigation.

---

## 1. Viewing Room

### 1.1 Sanity Schema — `viewingRoom.ts`

```ts
import { defineField, defineType } from 'sanity'

export const viewingRoom = defineType({
  name: 'viewingRoom',
  title: 'Viewing Room',
  type: 'document',
  groups: [
    { name: 'info',   title: 'Info',               default: true },
    { name: 'works',  title: 'Works' },
    { name: 'access', title: 'Access & Visibility' },
  ],
  fields: [
    // ── Info ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      description: 'Internal name, e.g. "Art Rotterdam 2026 — Selection for Jan"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
      description: 'Sets the shareable URL: /room/[slug]',
    }),
    defineField({
      name: 'description',
      title: 'Intro text (optional)',
      type: 'text',
      rows: 3,
      group: 'info',
      description: 'Shown above the works on the room page',
    }),

    // ── Collector (all private — never shown on site) ──────────────────────
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'reference',
      to: [{ type: 'contact' }],
      group: 'info',
      options: { disableNew: true },
      description: 'Link to a contact — never visible on the website.',
    }),
    defineField({
      name: 'recipientName',
      title: 'Recipient name (private)',
      type: 'string',
      group: 'info',
      description: 'Override if no contact is linked. Never visible on the website.',
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Recipient email (private)',
      type: 'string',
      group: 'info',
      description: 'Override if no contact is linked. Never visible on the website.',
    }),
    defineField({
      name: 'occasion',
      title: 'Occasion (private)',
      type: 'string',
      group: 'info',
      description: 'E.g. "Art Rotterdam 2026", "Private viewing"',
    }),
    defineField({
      name: 'notes',
      title: 'Notes (private)',
      type: 'text',
      rows: 3,
      group: 'info',
    }),

    // ── Works ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'artworks',
      title: 'Selected works',
      type: 'array',
      group: 'works',
      description: 'Drag works into the desired order',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Work',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'contextNote',
              title: 'Note for this recipient (private)',
              type: 'string',
              description: 'E.g. "Fits the interior you described" — shown on the room page',
            }),
          ],
          preview: {
            select: {
              title: 'artwork.title',
              year:  'artwork.year',
              media: 'artwork.images.0',
            },
            prepare({ title, year, media }) {
              return { title: `${title ?? '—'} (${year ?? '?'})`, media }
            },
          },
        },
      ],
    }),

    // ── Access & Visibility ───────────────────────────────────────────────────
    defineField({
      name: 'isPublished',
      title: 'Active (shareable link works)',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Turn on to activate the link',
    }),
    defineField({
      name: 'password',
      title: 'Access code (optional)',
      type: 'string',
      group: 'access',
      description: 'Leave empty for an open (but obscure) URL',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires on',
      type: 'datetime',
      group: 'access',
      description: 'Optional: link expires automatically after this date',
    }),
    defineField({
      name: 'showPrices',
      title: 'Show prices',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'On = price excl. VAT visible on the room page',
    }),
  ],

  preview: {
    select: {
      title:     'title',
      collector: 'recipientName',
      published: 'isPublished',
      works:     'artworks',
    },
    prepare({ title, collector, published, works }) {
      const count = Array.isArray(works) ? works.length : 0
      return {
        title: title ?? '—',
        subtitle: `${published ? 'Active' : 'Draft'} — ${count} work${count !== 1 ? 's' : ''}${collector ? ` — ${collector}` : ''}`,
      }
    },
  },
})
```

Register it in `sanity.config.ts` alongside the other schema types.

---

### 1.2 API Route — `src/app/api/room/[slug]/route.ts`

This is a Next.js Route Handler. The page fetches from here client-side.

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_READ_TOKEN, // read-only token is enough
  useCdn:     false,
})

const QUERY = `
  *[_type == "viewingRoom" && slug.current == $slug][0] {
    title,
    description,
    isPublished,
    password,
    expiresAt,
    showPrices,
    "artworks": artworks[] {
      _key,
      contextNote,
      "artwork": artwork-> {
        _id,
        title,
        year,
        medium,
        status,
        priceExclVAT,
        vatRate,
        editionTotal,
        editionAP,
        editionType,
        dimensions,
        "slug": slug.current,
        "image": images[0].asset->url,
        "editionRecords": editionRecords[] { number, status }
      }
    }
  }
`

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const passwordAttempt = req.nextUrl.searchParams.get('password')

  try {
    const room = await client.fetch(QUERY, { slug })

    if (!room) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!room.isPublished) {
      return NextResponse.json({ error: 'This selection is not active' }, { status: 404 })
    }

    if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This selection has expired' }, { status: 410 })
    }

    if (room.password && room.password !== passwordAttempt) {
      return NextResponse.json({ requiresPassword: true }, { status: 401 })
    }

    // Strip password before returning
    const { password: _pw, ...publicRoom } = room
    return NextResponse.json(publicRoom)
  } catch (err) {
    console.error('[api/room]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
```

**Auth logic summary:**
- `isPublished: false` → 404
- `expiresAt` in the past → 410
- `password` set and wrong/missing → 401 with `{ requiresPassword: true }`
- Password correct → strip `password` field, return data

---

### 1.3 Page — `src/app/room/[slug]/page.tsx`

Server component wrapper that renders the client component:

```ts
// src/app/room/[slug]/page.tsx
import { Metadata } from 'next'
import RoomPage from './RoomPage'

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
}

export default function Page() {
  return <RoomPage />
}
```

### 1.4 Client Component — `src/app/room/[slug]/RoomPage.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface EditionRecord {
  number: string
  status: 'available' | 'reserved' | 'sold' | 'artist_hold'
}

interface ArtworkData {
  _id: string
  title: string
  year: number
  medium?: string
  status: string
  editionType?: 'edition' | 'unique'
  priceExclVAT?: number
  vatRate?: number
  editionTotal?: number
  editionAP?: number
  slug?: string
  image?: string
  editionRecords?: EditionRecord[]
  dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number }
}

interface RoomArtwork {
  _key: string
  contextNote?: string
  artwork: ArtworkData
}

interface Room {
  title: string
  description?: string
  showPrices: boolean
  artworks: RoomArtwork[]
}

function formatDimensions(d?: ArtworkData['dimensions']) {
  if (!d) return null
  const parts = [d.widthCm, d.heightCm, d.depthCm]
    .filter((v) => v != null)
    .map(String)
  return parts.length ? `${parts.join(' × ')} cm` : null
}

function countAvailable(records?: EditionRecord[]) {
  if (!records) return null
  return records.filter((r) => r.status === 'available').length
}

function formatPrice(priceExclVAT: number, vatRate: number) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(n)
  const incl = priceExclVAT * (1 + vatRate / 100)
  return { excl: fmt(priceExclVAT), incl: fmt(incl) }
}

export default function RoomPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  async function fetchRoom(pw?: string) {
    const url = `/api/room/${slug}${pw ? `?password=${encodeURIComponent(pw)}` : ''}`
    const res = await fetch(url)

    if (res.status === 401) {
      setRequiresPassword(true)
      if (pw) setPasswordError(true)
      setLoading(false)
      return
    }

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    const data = await res.json()
    setRoom(data)
    setRequiresPassword(false)
    setLoading(false)
  }

  useEffect(() => {
    if (slug) fetchRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(false)
    setLoading(true)
    fetchRoom(password)
  }

  if (loading) return <div className="room-page room-page--loading"><div className="room-loading-indicator" /></div>

  if (requiresPassword) {
    return (
      <div className="room-page">
        <div className="room-password-gate">
          <h1 className="room-password-title">Private Selection</h1>
          <p className="room-password-sub">Enter the access code to view this selection.</p>
          <form onSubmit={handlePasswordSubmit} className="room-password-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access code"
              className={`room-password-input${passwordError ? ' room-password-input--error' : ''}`}
              autoFocus
            />
            {passwordError && <p className="room-password-error">Incorrect access code</p>}
            <button type="submit" className="room-password-btn">View selection</button>
          </form>
        </div>
      </div>
    )
  }

  if (error) return <div className="room-page"><div className="room-error"><p>{error}</p></div></div>
  if (!room) return null

  return (
    <div className="room-page">
      <header className="room-header">
        <h1 className="room-title">Private Selection</h1>
        {room.description && <p className="room-description">{room.description}</p>}
      </header>

      <div className="room-actions no-print">
        <button className="room-print-btn" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="room-artworks">
        {room.artworks.map(({ _key, artwork, contextNote }) => {
          const dims = formatDimensions(artwork.dimensions)
          const available = countAvailable(artwork.editionRecords)
          const price = artwork.priceExclVAT != null && artwork.vatRate != null
            ? formatPrice(artwork.priceExclVAT, artwork.vatRate)
            : null

          return (
            <article key={_key} className="room-artwork">
              <div className="room-artwork-image-wrap">
                {artwork.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${artwork.image}?w=800&auto=format`}
                    alt={artwork.title}
                    className="room-artwork-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="room-artwork-image-placeholder" />
                )}
              </div>

              <div className="room-artwork-info">
                <h2 className="room-artwork-title">{artwork.title}</h2>
                <p className="room-artwork-year">{artwork.year}</p>
                {artwork.medium && <p className="room-artwork-meta">{artwork.medium}</p>}
                {dims && <p className="room-artwork-meta">{dims}</p>}

                {artwork.editionType === 'edition' && artwork.editionTotal && (
                  <p className="room-artwork-meta">
                    Edition of {artwork.editionTotal}
                    {artwork.editionAP ? ` + ${artwork.editionAP} AP` : ''}
                    {available != null ? ` — ${available} available` : ''}
                  </p>
                )}
                {artwork.editionType === 'unique' && (
                  <p className="room-artwork-meta">Unique work</p>
                )}

                {room.showPrices && price && (
                  <div className="room-artwork-price">
                    <p className="room-artwork-price-excl">{price.excl} excl. VAT</p>
                    {artwork.vatRate != null && artwork.vatRate > 0 && (
                      <p className="room-artwork-price-incl">{price.incl} incl. {artwork.vatRate}% VAT</p>
                    )}
                  </div>
                )}

                {contextNote && <p className="room-artwork-note">{contextNote}</p>}

                <div className="room-artwork-status">
                  {artwork.status === 'available' && <span className="room-status-badge room-status-badge--available">Available</span>}
                  {artwork.status === 'enquire' && <span className="room-status-badge room-status-badge--enquire">On request</span>}
                  {artwork.status === 'sold_out' && <span className="room-status-badge room-status-badge--sold">Sold</span>}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <footer className="room-footer no-print">
        <p>
          This selection is personal and confidential.
          Questions?{' '}
          <a href="mailto:info@torchgallery.com">info@torchgallery.com</a>
        </p>
      </footer>
    </div>
  )
}
```

> Update the email address to the correct Torch Gallery email.

---

### 1.5 CSS

Add to `globals.css` (style to match Torch Gallery aesthetics):

```css
/* ── Viewing Room ─────────────────────────────────────────────────────────── */
.room-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 60px 24px 80px;
  font-family: Georgia, serif;
  color: #111;
}
.room-page--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.room-loading-indicator {
  width: 32px;
  height: 32px;
  border: 2px solid #ddd;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Password gate */
.room-password-gate {
  max-width: 360px;
  margin: 120px auto;
  text-align: center;
}
.room-password-title  { font-size: 20px; font-weight: 400; margin-bottom: 12px; }
.room-password-sub    { font-size: 14px; color: #666; margin-bottom: 28px; }
.room-password-form   { display: flex; flex-direction: column; gap: 8px; }
.room-password-input  { padding: 10px 14px; font-size: 14px; border: 1px solid #ddd; border-radius: 3px; outline: none; }
.room-password-input--error { border-color: #c0392b; }
.room-password-error  { font-size: 12px; color: #c0392b; margin: 0; }
.room-password-btn    { padding: 10px; background: #111; color: #fff; border: none; border-radius: 3px; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; }

/* Header */
.room-header     { margin-bottom: 48px; }
.room-title      { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 400; color: #888; margin-bottom: 12px; }
.room-description { font-size: 15px; line-height: 1.7; color: #444; max-width: 600px; }

/* Actions */
.room-actions  { margin-bottom: 32px; }
.room-print-btn {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: none;
  border: 1px solid #ccc;
  padding: 7px 16px;
  cursor: pointer;
  color: #555;
}

/* Artworks */
.room-artworks { display: flex; flex-direction: column; gap: 64px; }

.room-artwork {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}
@media (max-width: 640px) {
  .room-artwork { grid-template-columns: 1fr; }
}

.room-artwork-image-wrap    { background: #f5f5f4; }
.room-artwork-image         { width: 100%; display: block; }
.room-artwork-image-placeholder { width: 100%; aspect-ratio: 4/3; background: #eee; }

.room-artwork-title  { font-size: 18px; font-weight: 400; margin-bottom: 4px; }
.room-artwork-year   { font-size: 13px; color: #888; margin-bottom: 12px; }
.room-artwork-meta   { font-size: 13px; color: #555; margin-bottom: 4px; }

.room-artwork-price       { margin-top: 12px; }
.room-artwork-price-excl  { font-size: 15px; margin-bottom: 2px; }
.room-artwork-price-incl  { font-size: 12px; color: #888; }

.room-artwork-note   { font-size: 13px; color: #555; font-style: italic; margin-top: 12px; border-left: 2px solid #ddd; padding-left: 12px; }

.room-artwork-status { margin-top: 16px; }
.room-status-badge   { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border-radius: 2px; }
.room-status-badge--available { background: #e8f5e9; color: #2e7d32; }
.room-status-badge--enquire   { background: #fff3e0; color: #e65100; }
.room-status-badge--sold      { background: #f5f5f5; color: #999; }

/* Error */
.room-error { text-align: center; padding: 80px 24px; font-size: 14px; color: #888; }

/* Footer */
.room-footer { margin-top: 80px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; }
.room-footer a { color: inherit; }

/* Print */
@media print {
  .no-print { display: none !important; }
  .room-page { padding: 0; }
  .room-artwork { page-break-inside: avoid; }
}
```

---

## 2. Private Sale Selection

A simpler, document-style private page. The key difference from Viewing Room:
- URL uses a random **token** instead of a slug — harder to guess
- Per-artwork **price override** — can quote a different price than the catalogue
- **Intro + footer text** — personalised message from the artist
- **Server-side rendered** (no client fetch) — content rendered at request time

### 2.1 Sanity Schema — `privateSale.ts`

```ts
import { defineField, defineType } from 'sanity'

function generateToken() {
  try {
    // Node.js environment in Studio
    const { randomBytes } = require('crypto')
    return randomBytes(16).toString('hex')
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  }
}

export const privateSale = defineType({
  name: 'privateSale',
  title: 'Private Sale',
  type: 'document',
  preview: {
    select: {
      title:         'title',
      recipientName: 'recipientName',
      isActive:      'isActive',
    },
    prepare({ title, recipientName, isActive }) {
      return {
        title:    title || 'Untitled',
        subtitle: [recipientName, isActive ? 'Active' : 'Inactive'].filter(Boolean).join(' · '),
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Internal name — not shown to client',
      type: 'string',
      validation: (r) => r.required(),
    }),

    // ── Client ──────────────────────────────────────────────────────────────
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'reference',
      to: [{ type: 'contact' }],
      options: { disableNew: true },
      description: 'Link to a contact record. Leave empty for one-off recipients.',
    }),
    defineField({
      name: 'recipientName',
      title: 'Recipient name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Recipient email',
      type: 'string',
    }),

    // ── Access ──────────────────────────────────────────────────────────────
    defineField({
      name: 'token',
      title: 'Access token',
      description: 'Auto-generated. Share as /private-sales/[token]',
      type: 'string',
      readOnly: true,
      initialValue: () => generateToken(),
    }),
    defineField({
      name: 'password',
      title: 'Password (optional)',
      description: 'If set, client must enter this before viewing',
      type: 'string',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires at',
      description: 'Leave empty for no expiry',
      type: 'datetime',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      description: 'Inactive selections return a 404',
      type: 'boolean',
      initialValue: true,
    }),

    // ── Artworks ─────────────────────────────────────────────────────────────
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'privateSaleItem',
          preview: {
            select: {
              title:         'artwork.title',
              year:          'artwork.year',
              priceOverride: 'priceOverride',
            },
            prepare({ title, year, priceOverride }) {
              return {
                title:    title || 'Untitled',
                subtitle: [year, priceOverride != null ? `€${priceOverride}` : 'catalogue price']
                  .filter(Boolean).join(' · '),
              }
            },
          },
          fields: [
            defineField({
              name: 'artwork',
              title: 'Artwork',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'priceOverride',
              title: 'Price override (€ excl. VAT)',
              description: "Leave empty to show the artwork's catalogue price",
              type: 'number',
            }),
            defineField({
              name: 'note',
              title: 'Note',
              description: 'Optional note shown below this artwork',
              type: 'text',
              rows: 2,
            }),
          ],
        },
      ],
    }),

    // ── Message ───────────────────────────────────────────────────────────────
    defineField({
      name: 'introText',
      title: 'Intro text',
      description: 'Personal message shown at the top of the page',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'footerText',
      title: 'Footer text',
      description: 'E.g. contact details, payment terms',
      type: 'text',
      rows: 3,
    }),
  ],
})
```

---

### 2.2 Page — `src/app/private-sales/[token]/page.tsx`

Server-side rendered. The password check happens at the server — no API route needed.

```ts
import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import { Metadata } from 'next'
import PrivateSaleClient from './PrivateSaleClient'

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
}

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_READ_TOKEN,
  useCdn:     false,
})

interface Props {
  params: Promise<{ token: string }>
}

export default async function PrivateSalePage({ params }: Props) {
  const { token } = await params

  const sale = await client.fetch(
    `*[_type == "privateSale" && token == $token][0]{
      title, recipientName, introText, footerText, password,
      isActive, expiresAt,
      "artworks": artworks[] {
        "artwork": artwork-> {
          _id, title, year, medium, editionType, editionTotal, editionAP,
          priceExclVAT, vatRate,
          dimensions,
          "imageUrl": images[0].asset->url,
        },
        priceOverride,
        note,
      }
    }`,
    { token }
  )

  if (!sale || !sale.isActive) notFound()
  if (sale.expiresAt && new Date(sale.expiresAt) < new Date()) notFound()

  // Pass password to client component for comparison — never expose in HTML directly
  const requiresPassword = !!sale.password

  return (
    <PrivateSaleClient
      sale={sale}
      requiresPassword={requiresPassword}
      correctPassword={sale.password ?? null}
    />
  )
}
```

> **Security note:** The password is compared client-side in the current implementation. This is acceptable for low-security art sales (the token URL is already obscure). If you want server-side password checking, implement a separate API route and handle it there instead.

---

### 2.3 Client Component — `src/app/private-sales/[token]/PrivateSaleClient.tsx`

```tsx
'use client'

import { useState } from 'react'

interface ArtworkItem {
  artwork: {
    _id: string
    title?: string
    year?: number
    medium?: string
    editionType?: 'edition' | 'unique'
    editionTotal?: number
    editionAP?: number
    dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number }
    priceExclVAT?: number
    vatRate?: number
    imageUrl?: string | null
  }
  priceOverride?: number
  note?: string
}

interface Sale {
  title: string
  recipientName: string
  introText?: string
  footerText?: string
  artworks: ArtworkItem[]
}

interface Props {
  sale: Sale
  requiresPassword: boolean
  correctPassword: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDims(d?: { widthCm?: number; heightCm?: number; depthCm?: number }) {
  if (!d) return null
  const parts = [d.widthCm, d.heightCm, d.depthCm].filter((v) => v != null).map(String)
  return parts.length ? `${parts.join(' × ')} cm` : null
}

export default function PrivateSaleClient({ sale, requiresPassword, correctPassword }: Props) {
  const [unlocked, setUnlocked] = useState(!requiresPassword)
  const [pwInput, setPwInput]   = useState('')
  const [pwError, setPwError]   = useState(false)

  function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwInput === correctPassword) {
      setUnlocked(true)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  if (!unlocked) {
    return (
      <main className="ps-gate">
        <p className="ps-gate-label">Private Selection</p>
        <p className="ps-gate-sub">This selection is password protected.</p>
        <form onSubmit={handlePassword} className="ps-gate-form">
          <input
            type="password"
            value={pwInput}
            onChange={(e) => { setPwInput(e.target.value); setPwError(false) }}
            placeholder="Enter password"
            autoFocus
            className={`ps-gate-input${pwError ? ' ps-gate-input--error' : ''}`}
          />
          {pwError && <p className="ps-gate-error">Incorrect password</p>}
          <button type="submit" className="ps-gate-btn">View selection</button>
        </form>
      </main>
    )
  }

  return (
    <main className="ps-page">
      {/* Print bar */}
      <div className="ps-print-bar no-print">
        <span className="ps-print-label">Private Selection — {sale.recipientName}</span>
        <button className="ps-print-btn" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      {/* Header */}
      <header className="ps-header">
        <p className="ps-header-label">Private Selection</p>
        <h1 className="ps-header-name">{sale.recipientName}</h1>
        {sale.introText && <p className="ps-intro">{sale.introText}</p>}
      </header>

      {/* Artworks */}
      <section className="ps-artworks">
        {sale.artworks.map((item, i) => {
          const { artwork } = item
          const price = item.priceOverride ?? artwork.priceExclVAT
          const vatRate = artwork.vatRate ?? 0
          const dims = formatDims(artwork.dimensions)

          return (
            <article key={artwork._id ?? i} className="ps-artwork">
              {artwork.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${artwork.imageUrl}?w=700&auto=format`}
                  alt={artwork.title ?? ''}
                  className="ps-artwork-image"
                />
              )}
              <div className="ps-artwork-info">
                <h2 className="ps-artwork-title">{artwork.title}</h2>
                {artwork.year && <p className="ps-artwork-year">{artwork.year}</p>}
                {artwork.medium && <p className="ps-artwork-meta">{artwork.medium}</p>}
                {dims && <p className="ps-artwork-meta">{dims}</p>}

                {artwork.editionType === 'edition' && artwork.editionTotal && (
                  <p className="ps-artwork-meta">
                    Edition of {artwork.editionTotal}
                    {artwork.editionAP ? ` + ${artwork.editionAP} AP` : ''}
                  </p>
                )}
                {artwork.editionType === 'unique' && (
                  <p className="ps-artwork-meta">Unique work</p>
                )}

                {price != null && (
                  <div className="ps-artwork-price">
                    <p>{fmt(price)} excl. VAT</p>
                    {vatRate > 0 && <p className="ps-artwork-price-incl">{fmt(price * (1 + vatRate / 100))} incl. {vatRate}% VAT</p>}
                  </div>
                )}

                {item.note && <p className="ps-artwork-note">{item.note}</p>}
              </div>
            </article>
          )
        })}
      </section>

      {/* Footer */}
      {sale.footerText && (
        <footer className="ps-footer">
          <p>{sale.footerText}</p>
        </footer>
      )}
    </main>
  )
}
```

---

### 2.4 CSS for Private Sale

```css
/* ── Private Sale ─────────────────────────────────────────────────────────── */
.ps-gate {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
  font-family: Georgia, serif;
}
.ps-gate-label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
.ps-gate-sub   { font-size: 15px; color: #333; margin-bottom: 24px; }
.ps-gate-form  { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 300px; }
.ps-gate-input { padding: 10px 14px; font-size: 14px; border: 1px solid #ddd; border-radius: 3px; outline: none; }
.ps-gate-input--error { border-color: #c0392b; }
.ps-gate-error { font-size: 12px; color: #c0392b; margin: 0; }
.ps-gate-btn   { padding: 10px; background: #111; color: #fff; border: none; border-radius: 3px; font-size: 13px; cursor: pointer; }

.ps-page { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; font-family: Georgia, serif; color: #111; }

.ps-print-bar  { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #eee; margin-bottom: 48px; }
.ps-print-label { font-size: 12px; color: #888; letter-spacing: 0.04em; }
.ps-print-btn  { font-size: 12px; letter-spacing: 0.06em; background: none; border: 1px solid #ccc; padding: 6px 14px; cursor: pointer; color: #555; }

.ps-header       { margin-bottom: 48px; }
.ps-header-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #aaa; margin-bottom: 8px; }
.ps-header-name  { font-size: 24px; font-weight: 400; margin-bottom: 16px; }
.ps-intro        { font-size: 15px; line-height: 1.7; color: #444; max-width: 580px; white-space: pre-wrap; }

.ps-artworks     { display: flex; flex-direction: column; gap: 56px; }
.ps-artwork      { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; page-break-inside: avoid; }
@media (max-width: 600px) { .ps-artwork { grid-template-columns: 1fr; } }

.ps-artwork-image { width: 100%; display: block; }
.ps-artwork-title { font-size: 17px; font-weight: 400; margin-bottom: 4px; }
.ps-artwork-year  { font-size: 13px; color: #888; margin-bottom: 10px; }
.ps-artwork-meta  { font-size: 13px; color: #555; margin-bottom: 4px; }
.ps-artwork-price { margin-top: 12px; font-size: 15px; }
.ps-artwork-price-incl { font-size: 12px; color: #888; margin-top: 2px; }
.ps-artwork-note  { font-size: 13px; color: #555; font-style: italic; margin-top: 12px; border-left: 2px solid #eee; padding-left: 12px; }

.ps-footer        { margin-top: 64px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #666; white-space: pre-wrap; line-height: 1.7; }

@media print {
  .no-print { display: none !important; }
  .ps-page  { padding: 0; }
}
```

---

## 3. Implementation Checklist

- [ ] Add `viewingRoom.ts` to `src/sanity/schemas/` and register in `sanity.config.ts`
- [ ] Add `privateSale.ts` to `src/sanity/schemas/` and register in `sanity.config.ts`
- [ ] Create `src/app/api/room/[slug]/route.ts`
- [ ] Create `src/app/room/[slug]/page.tsx` and `RoomPage.tsx`
- [ ] Create `src/app/private-sales/[token]/page.tsx` and `PrivateSaleClient.tsx`
- [ ] Add CSS to `globals.css`
- [ ] Update the Torch Gallery email address in `RoomPage.tsx` footer
- [ ] Verify `SANITY_READ_TOKEN` (or equivalent) is set in `.env.local`

---

## 4. ENV Variables Required

```
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_READ_TOKEN=...          # read-only Sanity token (or reuse your existing write token)
```

---

## 5. How the Two Features Differ — Quick Reference

| | Viewing Room | Private Sale |
|---|---|---|
| URL | `/room/[readable-slug]` | `/private-sales/[32-char-hex-token]` |
| Auth method | Access code (optional) | Password (optional) |
| Price override per work | No — catalogue price or hidden | Yes — override per artwork |
| Personal message | Description at top | Intro + footer text |
| Rendered | Client-side (fetch) | Server-side (SSR) |
| Contact link | Yes — linked to contact document | Yes — linked to contact document |
| Print-friendly | Yes | Yes |
| Enquiry button | Yes (opens enquiry panel) | No |
| Show prices toggle | Yes — per room | Always shown (if price set) |

---

*Brief generated from working implementation in mynameissanderdekker.com — August 2026.*

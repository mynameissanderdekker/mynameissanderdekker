# Artwork Detail Page — Layout Briefing
## mynameissanderdekker.com · `src/components/ArtworkDetail.tsx`

This document describes the exact layout, structure, and CSS of the artwork detail view for the **mynameissanderdekker.com** website, for use as a reference in another Claude conversation.

---

## Overview

The artwork detail view is rendered as a **full-viewport overlay** (not a separate page). It opens at `/works/[slug]` — navigating to that URL shows the artwork in this modal-style overlay on top of the main works grid.

The component is `'use client'` (React, Next.js App Router).

---

## Top-level layout

```
<div className="artwork-detail flex flex-col lg:flex-row" style="height: 100%">
  <!-- Left: image column -->
  <!-- Right: info panel -->
</div>
```

- On **mobile** (`flex-col`): stacked vertically
- On **desktop** (`lg:flex-row`): side-by-side

---

## Left column — Image panel

```tsx
<div
  className="flex-1 relative flex flex-col"
  style={{ padding: '40px 48px 32px' }}
>
```

- Takes all remaining space (`flex-1`)
- Padding: `40px 48px 32px` (top/bottom 40px, left/right 48px)

### Close (✕) button

Absolute positioned inside the left column:

```tsx
<button
  className="absolute text-2xl text-gray-400 hover:text-black transition-colors duration-150 z-10"
  style={{ top: '40px', right: '48px' }}
>
  ✕
</button>
```

- Calls `router.back()` — navigates back to the previous page (works grid or wherever the user came from)
- It is **not** a modal close; it is a real navigation back

### Main image container

```tsx
<div className="flex-1 flex items-center justify-center" style={{ height: '55vh' }}>
  <img
    className="object-contain"
    style={{ maxWidth: '100%', maxHeight: '100%' }}
  />
</div>
```

- **Max height: `55vh`** (55% of the viewport height) — the image never exceeds this
- Image: `object-contain` — fits within the box, never cropped, aspect ratio preserved
- Centered both horizontally and vertically within the container

### Thumbnail strip (only when >1 image)

Rendered **directly below the main image**, not beside it:

```tsx
<div className="flex flex-row flex-wrap gap-3 mt-6 justify-center">
  <button className="w-24 h-24 overflow-hidden border ...">
    <!-- Active: border-black; inactive: border-transparent hover:border-gray-400 -->
  </button>
</div>
```

- Thumbnails: `96px × 96px` (`w-24 h-24`)
- Gap: `12px` (`gap-3`)
- Top margin: `24px` (`mt-6`) — sits just below the 55vh image area
- Active thumbnail: `border-black`
- Inactive: `border-transparent` → hover: `border-gray-400`
- Images requested at `?w=300`
- Clicking a thumbnail swaps the main image (`setActiveIdx(i)`)
- Hidden entirely when only one image exists

---

## Right column — Info panel

```tsx
<div
  className="lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col overflow-y-auto border-l border-gray-100 bg-white"
  style={{ padding: '40px 28px 28px' }}
>
```

- Width: `300px` (lg) / `320px` (xl) — fixed, does not grow
- `shrink-0` — never compresses
- `overflow-y-auto` — scrolls independently
- Left border: `border-gray-100`
- Background: white
- Padding: `40px 28px 28px` (top 40px, sides 28px, bottom 28px)

### Title

```tsx
<h1 className="text-lg font-normal leading-snug mb-0.5">{artwork.title}</h1>
```

- `text-lg`, `font-normal` (not bold), `leading-snug`, margin-bottom `2px`

### Year

```tsx
<p className="text-sm text-gray-400 mb-4 italic">{artwork.year}</p>
```

- Small, gray (`text-gray-400`), italic, margin-bottom `16px`

### Metadata rows (dl/dt/dd)

```tsx
<dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
  <div className="flex gap-3">
    <dt className="text-gray-400 w-16 shrink-0">Medium</dt>
    <dd className="text-gray-800 leading-snug">{artwork.medium}</dd>
  </div>
  <div className="flex gap-3">
    <dt className="text-gray-400 w-16 shrink-0">Size</dt>
    <dd className="text-gray-800">
      {dims}
      <span className="text-gray-400 text-xs ml-1">excl. frame</span> {/* conditional */}
    </dd>
  </div>
  <div className="flex gap-3">
    <dt className="text-gray-400 w-16 shrink-0">Edition</dt>
    <dd className="text-gray-800">{edition}</dd>
  </div>
</dl>
```

- Separated from title by `border-t border-gray-100 pt-4`
- Label (`dt`): `text-gray-400 w-16 shrink-0` — fixed 64px label column, light gray
- Value (`dd`): `text-gray-800` — dark gray (not black)
- Fields shown: Medium, Size (with optional "excl. frame" note), Edition
- All fields are conditional — only rendered if value exists

### Description text (optional)

```tsx
<p className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
  {descText}
</p>
```

### Price

When not an enquire item and a price exists:

```tsx
<p className="text-xl font-medium">{formatPrice(effectivePriceExclVAT, artwork.vatRate)}</p>
```

### Purchase options / variants (when artwork has multiple options)

```tsx
<button className={`text-left border px-4 py-2.5 text-sm transition-colors duration-150 ${
  selected
    ? 'border-black bg-black text-white'
    : 'border-gray-300 hover:border-black'
}`}>
  <span className="block">{opt.label} <span className="opacity-50 font-normal text-xs">excl. frame</span></span>
  <span className="block text-xs opacity-70 mt-0.5">{price}</span>
</button>
```

### CTA buttons

All CTAs are `mt-6 flex flex-col gap-2` — stacked vertically, 8px gap.

**Buy button** (shown when `showInWebshop === true`, not sold out):

```tsx
<button className="border border-black px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors duration-150">
  Buy
</button>
```

**Enquire button** (shown when `showInWebshop === false`, not sold out):

```tsx
<button className="border border-black px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors duration-150">
  Enquire
</button>
```

- Same style as Buy button
- Opens a slide-in enquiry contact form (`enquireOpen` state)

**View on wall button** (shown when `artwork.showViewInRoom === true`):

```tsx
<button className="border border-gray-300 px-6 py-3 text-xs tracking-widest uppercase font-medium text-gray-500 hover:border-gray-500 hover:text-gray-800 transition-colors duration-150">
  View on wall
</button>
```

- Lighter style: `border-gray-300`, `text-gray-500` — visually secondary
- Opens `ViewInRoomModal`

**Sold out** (when status is sold_out):

```tsx
<p className="text-xs tracking-widest uppercase text-gray-400">Sold out</p>
```

---

## ViewInRoomModal — "View on Wall"

Key calibration constants in `ArtworkDetail.tsx`:

```ts
const PHOTO_W_CM = 275  // the room background image is 275 cm wide in real life
const artWPct = (widthCm / PHOTO_W_CM) * 100  // artwork width as % of room image width
```

The room background image (`room-bg.jpg`) uses this anchor for positioning the artwork:

```css
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
```

The artwork is centered in the room image both horizontally and vertically at the 50/50 midpoint.

---

## Enquire slide-in panel

Opens when "Enquire" is clicked (`enquireOpen` state = true). It is a separate component rendered below the main layout, likely a slide-in from the right or bottom.

---

## Navigation bar (above the page, persistent)

- **Left**: Pink blob / organic shape logo
- **Center**: Pill-shaped nav bar with links: `PROJECTS`, `ABOUT`, `AVAILABLE`, `CONTACT` — black text on white pill, uppercase, small tracking
- **Right**: Icon buttons (cart, etc.)

---

## Below the artwork detail (on the works page)

- Newsletter signup section
- Footer with 4 columns

---

## Key Sanity schema fields that drive the detail page

| Field | Type | Effect on page |
|---|---|---|
| `title` | string | H1 heading |
| `year` | number | Shown in italic gray below title |
| `medium` | string | "Medium" metadata row |
| `dimensions.widthCm/heightCm` | number | "Size" metadata row |
| `dimensionsExclFrame` | boolean | Appends "excl. frame" to size |
| `editionTotal`, `editionAP` | number | "Edition" row (e.g. "7 + 2 AP") |
| `description` | portable text | Paragraph below metadata |
| `images[]` | image array | Main image + thumbnail strip |
| `coverImageUrl` | url | Fallback image when no Sanity image |
| `priceExclVAT` | number | Price display |
| `vatRate` | number (9/21/0) | Used in `formatPrice()` |
| `options[]` | array | Variant buttons (replaces single price) |
| `status` | string | Drives Buy/Enquire/Sold out/Not for sale display |
| `showInWebshop` | boolean | Buy vs Enquire button |
| `showViewInRoom` | boolean | Shows "View on wall" button |
| `roomImage` | image | The artwork cutout for ViewInRoomModal |
| `framedDimensions.widthCm` | number | Artwork size in room (uses PHOTO_W_CM = 275) |

---

## File reference

- Main component: `src/components/ArtworkDetail.tsx`
- Room modal: `src/components/ViewInRoomModal.tsx` (do NOT modify `src/components/ZineViewer.tsx`)
- Route: `src/app/works/[slug]/page.tsx`
- Sanity schema: `src/sanity/schemas/artwork.ts`

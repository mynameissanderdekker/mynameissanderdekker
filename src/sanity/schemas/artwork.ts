import { createElement } from 'react'
import { defineField, defineType } from 'sanity'
import { CompactDimensions } from '../components/CompactDimensions'
import { CategoryInput } from '../components/CategoryInput'
import { ArtworkQRCode } from '../components/ArtworkQRCode'
import { ArtworkBuyers } from '../components/ArtworkBuyers'

// ── Main artwork schema ───────────────────────────────────────────────────────
export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  groups: [
    { name: 'info',       title: 'Info',            default: true },
    { name: 'edition',    title: 'Edition & Sales' },
    { name: 'context',    title: 'Context' },
    { name: 'visibility', title: 'Webshop' },
  ],
  fields: [
    // ── Info ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'info',
      components: { input: CategoryInput },
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'info',
      validation: (r) => r.required().min(1900).max(2100),
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
      group: 'info',
      description: 'E.g. "Lambda print on dibond, framed"',
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions (cm)',
      type: 'object',
      group: 'info',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm',  title: 'Width',  type: 'number' }),
        defineField({ name: 'heightCm', title: 'Height', type: 'number' }),
        defineField({ name: 'depthCm',  title: 'Depth',  type: 'number' }),
      ],
    }),
    defineField({
      name: 'dimensionsExclFrame',
      title: 'Excl. frame',
      type: 'boolean',
      group: 'info',
      description: 'Show "excl. frame" after the dimensions on the product page.',
      initialValue: false,
    }),
    defineField({
      name: 'qrCode',
      title: 'QR Code',
      type: 'string',
      group: 'info',
      readOnly: true,
      components: { field: ArtworkQRCode },
    }),
    defineField({
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      group: 'info',
      description: 'For books/publications only — e.g. 978-90-123456-7-8',
      hidden: ({ document }) => {
        const cat = ((document?.category as string) ?? '').toLowerCase()
        return !cat.includes('book') && !cat.includes('publicat')
      },
    }),
    defineField({
      name: 'weightKg',
      title: 'Weight (kg)',
      type: 'number',
      group: 'info',
      description: 'Used for shipping cost calculation',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'info',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'info',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'First image = main photo',
    }),
    defineField({
      name: 'coverImageUrl',
      title: 'Cover image URL (fallback)',
      type: 'url',
      group: 'info',
      description: 'External URL — used as cover when no Sanity image is uploaded yet',
    }),

    // ── Edition & Sales ───────────────────────────────────────────────────────
    defineField({
      name: 'editionTotal',
      title: 'Edition total',
      type: 'number',
      group: 'edition',
      description: 'E.g. 7 (for an edition of 7 + 2 AP)',
    }),
    defineField({
      name: 'editionAP',
      title: 'Artist Proofs (AP)',
      type: 'number',
      group: 'edition',
      description: 'E.g. 2',
      initialValue: 0,
    }),
    defineField({
      name: 'priceExclVAT',
      title: 'Price (excl. VAT)',
      type: 'number',
      group: 'edition',
    }),
    defineField({
      name: 'vatRate',
      title: 'VAT rate',
      type: 'number',
      group: 'edition',
      description: 'E.g. 9 or 21',
      options: {
        list: [
          { title: '9%', value: 9 },
          { title: '21%', value: 21 },
          { title: '0% (export)', value: 0 },
        ],
      },
      initialValue: 9,
    }),
    defineField({
      name: 'options',
      title: 'Purchase options (variants)',
      type: 'array',
      group: 'edition',
      description: 'Optional — use when this artwork is sold in multiple variants (e.g. "1 roll" vs "2 rolls"), each with its own price. When set, these replace the single price above on the site and the buyer picks one before buying.',
      of: [
        defineField({
          name: 'artworkOption',
          title: 'Option',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'E.g. "1 roll" or "2 rolls (different prints)"',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'sku',
              title: 'SKU / code',
              type: 'string',
              description: 'E.g. WD-70600-1',
            }),
            defineField({
              name: 'priceExclVAT',
              title: 'Price (excl. VAT)',
              type: 'number',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'buyUrl',
              title: 'Buy link (optional override)',
              type: 'url',
              description: 'Leave empty to use the artwork\'s main buy link',
            }),
          ],
          preview: {
            select: { label: 'label', price: 'priceExclVAT', sku: 'sku' },
            prepare({ label, price, sku }) {
              return {
                title: label ?? '—',
                subtitle: [sku, price != null ? `€${price}` : null].filter(Boolean).join(' — '),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'edition',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Sold Out', value: 'sold_out' },
          { title: 'On Loan', value: 'on_loan' },
          { title: 'Not for Sale', value: 'not_for_sale' },
          { title: 'Enquire', value: 'enquire' },
        ],
        layout: 'radio',
      },
      initialValue: 'enquire',
    }),
    defineField({
      name: 'additionalStatusInfo',
      title: 'Additional status info (private)',
      type: 'string',
      group: 'edition',
      description: 'E.g. "Sold to museum X" — never visible on the site',
    }),
    defineField({
      name: 'buyers',
      title: 'Buyers',
      type: 'string',
      group: 'edition',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { input: ArtworkBuyers as any },
    }),

    // ── Context ───────────────────────────────────────────────────────────────
    defineField({
      name: 'exhibitions',
      title: 'Exhibitions',
      type: 'array',
      group: 'context',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }] }],
    }),
    defineField({
      name: 'artFairs',
      title: 'Art Fairs',
      type: 'array',
      group: 'context',
      of: [{ type: 'reference', to: [{ type: 'artFair' }] }],
    }),

    // ── Webshop ───────────────────────────────────────────────────────────────
    defineField({
      name: 'showInWebshop',
      title: 'Sell in webshop',
      type: 'boolean',
      group: 'visibility',
      description: 'On = "Buy" button (shopping cart). Off = "Enquire" button (contact form).',
      initialValue: false,
    }),
    defineField({
      name: 'showViewInRoom',
      title: 'View on wall',
      type: 'boolean',
      group: 'visibility',
      description: 'Show the "View on wall" button on the artwork page.',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Featured (in webshop)',
      type: 'boolean',
      group: 'visibility',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Sort order (in webshop)',
      type: 'number',
      group: 'visibility',
      description: 'Lower number = higher in the section. Leave empty to fall back to year.',
    }),
    defineField({
      name: 'roomImage',
      title: 'View on wall — cutout',
      type: 'image',
      group: 'visibility',
      description: 'Upload a PNG (transparent background) or JPG (tightly cropped, no empty space outside the edges) of the work incl. frame and passe-partout.',
      options: { accept: 'image/png,image/jpeg' },
    }),
    defineField({
      name: 'framedDimensions',
      title: 'Framed dimensions (cm)',
      type: 'object',
      group: 'visibility',
      description: 'For "View on wall" — outer size incl. frame and passe-partout.',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm', title: 'Width', type: 'number' }),
      ],
    }),
    defineField({
      name: 'buyUrl',
      title: 'Buy link',
      type: 'url',
      group: 'visibility',
      description: 'Direct payment link (Mollie, Stripe, etc.) — shown as "Buy" button when status is "Available"',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      year: 'year',
      media: 'images.0',
      coverImageUrl: 'coverImageUrl',
      status: 'status',
      editionTotal: 'editionTotal',
    },
    prepare({ title, year, media, coverImageUrl, status, editionTotal }: {
      title?: string
      year?: number
      media?: unknown
      coverImageUrl?: string
      status?: string
      editionTotal?: number
    }) {
      const statusLabel: Record<string, string> = {
        available: 'Available',
        sold_out: 'Sold Out',
        on_loan: 'On Loan',
        not_for_sale: 'Not for Sale',
        enquire: 'Enquire',
      }
      const edition = editionTotal ? ` — Ed. ${editionTotal}` : ''

      // Use Sanity image if available, otherwise fall back to external coverImageUrl
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolvedMedia: any = media
      if (!resolvedMedia && coverImageUrl) {
        resolvedMedia = createElement('img', {
          src: coverImageUrl,
          style: { width: '100%', height: '100%', objectFit: 'cover' as const },
        })
      }

      return {
        title: title ?? '—',
        subtitle: `${statusLabel[status ?? ''] ?? status ?? ''}${edition}`,
        media: resolvedMedia,
      }
    },
  },
})

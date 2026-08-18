import { createElement } from 'react'
import { defineField, defineType } from 'sanity'
import { CompactDimensions } from '../components/CompactDimensions'
import { CategoryInput } from '../components/CategoryInput'
import { ArtworkQRCode } from '../components/ArtworkQRCode'
import { ArtworkBuyers } from '../components/ArtworkBuyers'
import { ArtworkCoA } from '../components/ArtworkCoA'

// ── Main artwork schema ───────────────────────────────────────────────────────
export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  groups: [
    { name: 'basis',     title: 'Basis',     default: true },
    { name: 'details',   title: 'Details'                  },
    { name: 'gallery',   title: 'Gallery'                  },
    { name: 'logistics', title: 'Logistics'                },
    { name: 'webshop',   title: 'Webshop'                  },
  ],
  fieldsets: [
    { name: 'titleYear',   title: 'Title & year',     options: { columns: 2 } },
    { name: 'editionNums', title: 'Edition numbers',  options: { columns: 2 } },
    { name: 'priceLine',   title: 'Price in Euro',    options: { columns: 2 } },
  ],
  fields: [
    // ── Basis ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'basis',
      fieldset: 'titleYear',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'basis',
      fieldset: 'titleYear',
      validation: (r) => r.required().min(1900).max(2100),
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
      group: 'basis',
      description: 'E.g. "Lambda print on dibond, framed"',
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions (cm)',
      type: 'object',
      group: 'basis',
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
      group: 'basis',
      description: 'Show "excl. frame" after the dimensions on the product page.',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'basis',
      components: { input: CategoryInput },
    }),
    defineField({
      name: 'editionType',
      title: 'Edition type',
      type: 'string',
      group: 'basis',
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
      group: 'basis',
      fieldset: 'editionNums',
      description: 'E.g. 7 (for an edition of 7 + 2 AP)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => document?.editionType !== 'edition',
    }),
    defineField({
      name: 'editionAP',
      title: 'Artist Proofs (AP)',
      type: 'number',
      group: 'basis',
      fieldset: 'editionNums',
      description: 'E.g. 2',
      initialValue: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => document?.editionType !== 'edition',
    }),
    defineField({
      name: 'editionNumber',
      title: 'Edition number',
      type: 'string',
      group: 'basis',
      description: 'Specific copy — e.g. "3/7"',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => document?.editionType !== 'edition',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'basis',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'First image = main photo',
    }),
    defineField({
      name: 'priceIncVat',
      title: 'Price (incl. BTW)',
      type: 'number',
      group: 'basis',
      fieldset: 'priceLine',
    }),
    defineField({
      name: 'vatRate',
      title: 'BTW rate',
      type: 'string',
      group: 'basis',
      fieldset: 'priceLine',
      options: {
        list: [
          { title: '9%', value: '9' },
          { title: '21%', value: '21' },
          { title: '0% (export)', value: '0' },
        ],
      },
      initialValue: '9',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'basis',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'basis',
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

    // ── Details ───────────────────────────────────────────────────────────────
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'details',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'weightKg',
      title: 'Weight (kg)',
      type: 'number',
      group: 'details',
      description: 'Used for shipping cost calculation',
    }),
    defineField({
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      group: 'details',
      description: 'For books/publications only — e.g. 978-90-123456-7-8',
      hidden: ({ document }) => {
        const cat = ((document?.category as string) ?? '').toLowerCase()
        return !cat.includes('book') && !cat.includes('publicat')
      },
    }),
    defineField({
      name: 'coverImageUrl',
      title: 'Cover image URL (fallback)',
      type: 'url',
      group: 'details',
      description: 'External URL — used as cover when no Sanity image is uploaded yet',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      group: 'details',
      description: 'Short description for Google and social sharing (max. 160 characters).',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'options',
      title: 'Purchase options (variants)',
      type: 'array',
      group: 'details',
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
              title: 'Price (excl. BTW)',
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
      name: 'priceExclVAT',
      title: 'Price excl. BTW [legacy — do not use]',
      type: 'number',
      group: 'details',
      hidden: true,
    }),
    defineField({
      name: 'torchId',
      title: 'Torch Gallery ID',
      type: 'string',
      group: 'details',
      hidden: true,
      description: 'Set automatically after syncing to Torch Gallery (do not edit manually)',
      readOnly: true,
    }),

    // ── Gallery ───────────────────────────────────────────────────────────────
    defineField({
      name: 'coaPanel',
      title: 'Certificate of Authenticity',
      type: 'string',
      group: 'gallery',
      readOnly: true,
      components: { field: ArtworkCoA },
    }),
    defineField({
      name: 'qrCode',
      title: 'QR Code',
      type: 'string',
      group: 'gallery',
      readOnly: true,
      components: { field: ArtworkQRCode },
    }),
    defineField({
      name: 'exhibitions',
      title: 'Exhibitions',
      type: 'array',
      group: 'gallery',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }] }],
    }),
    defineField({
      name: 'artFairs',
      title: 'Art Fairs',
      type: 'array',
      group: 'gallery',
      of: [{ type: 'reference', to: [{ type: 'artFair' }] }],
    }),

    // ── Logistics ─────────────────────────────────────────────────────────────
    defineField({
      name: 'currentLocation',
      title: 'Current location',
      type: 'reference',
      to: [{ type: 'location' }],
      group: 'logistics',
      description: 'Where is this work right now?',
    }),
    defineField({
      name: 'locationSince',
      title: 'At this location since',
      type: 'date',
      group: 'logistics',
    }),
    defineField({
      name: 'locationNote',
      title: 'Location note',
      type: 'string',
      group: 'logistics',
      description: 'Optional detail, e.g. "Room 3, east wall" or "Crate B-12"',
    }),
    defineField({
      name: 'additionalStatusInfo',
      title: 'Additional status info (private)',
      type: 'string',
      group: 'logistics',
      description: 'E.g. "Sold to museum X" — never visible on the site',
    }),
    defineField({
      name: 'buyers',
      title: 'Buyers',
      type: 'string',
      group: 'logistics',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { input: ArtworkBuyers as any },
    }),

    // ── Webshop ───────────────────────────────────────────────────────────────
    defineField({
      name: 'showInWebshop',
      title: 'Sell in webshop',
      type: 'boolean',
      group: 'webshop',
      description: 'On = "Buy" button (shopping cart). Off = "Enquire" button (contact form).',
      initialValue: false,
    }),
    defineField({
      name: 'showViewInRoom',
      title: 'View on wall',
      type: 'boolean',
      group: 'webshop',
      description: 'Show the "View on wall" button on the artwork page.',
      initialValue: false,
    }),
    defineField({
      name: 'roomImage',
      title: 'View on wall — cutout',
      type: 'image',
      group: 'webshop',
      description: 'Upload a PNG (transparent background) or JPG (tightly cropped, no empty space outside the edges) of the work incl. frame and passe-partout.',
      options: { accept: 'image/png,image/jpeg' },
    }),
    defineField({
      name: 'framedDimensions',
      title: 'Framed dimensions (cm)',
      type: 'object',
      group: 'webshop',
      description: 'For "View on wall" — outer size incl. frame and passe-partout.',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm', title: 'Width', type: 'number' }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured (in webshop)',
      type: 'boolean',
      group: 'webshop',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Sort order (in webshop)',
      type: 'number',
      group: 'webshop',
      description: 'Lower number = higher in the section. Leave empty to fall back to year.',
    }),
    defineField({
      name: 'buyUrl',
      title: 'Buy link',
      type: 'url',
      group: 'webshop',
      description: 'Direct payment link (Mollie, Stripe, etc.) — shown as "Buy" button when status is "Available"',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      images: 'images',
      coverImageUrl: 'coverImageUrl',
      status: 'status',
      editionTotal: 'editionTotal',
    },
    prepare({ title, images, coverImageUrl, status, editionTotal }: {
      title?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images?: any[]
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

      const assetRef: string | undefined = Array.isArray(images) && images.length > 0
        ? images[0]?.asset?._ref
        : undefined

      let imageUrl: string | undefined
      if (assetRef) {
        const filename = assetRef.replace(/^image-/, '').replace(/-([a-z0-9]+)$/i, '.$1')
        imageUrl = `https://cdn.sanity.io/images/u11u127q/production/${filename}?w=80&h=80&fit=crop`
      } else if (coverImageUrl) {
        imageUrl = coverImageUrl
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolvedMedia: any = imageUrl
        ? createElement('img', {
            src: imageUrl,
            style: { width: '100%', height: '100%', objectFit: 'cover' as const },
          })
        : undefined

      return {
        title: title ?? '—',
        subtitle: `${statusLabel[status ?? ''] ?? status ?? ''}${edition}`,
        media: resolvedMedia,
      }
    },
  },
})

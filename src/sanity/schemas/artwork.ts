import { createElement } from 'react'
import { defineField, defineType } from 'sanity'
import { CompactDimensions } from '../components/CompactDimensions'
import { CategoryInput } from '../components/CategoryInput'
import { ArtworkQRCode } from '../components/ArtworkQRCode'
import { ArtworkBuyers } from '../components/ArtworkBuyers'
import { ArtworkCoA } from '../components/ArtworkCoA'
import { StorageCodeInput } from '../components/StorageCodeInput'

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
    { name: 'titleYear',      title: 'Title & year',     options: { columns: 2 } },
    { name: 'editionNums',    title: 'Edition numbers',  options: { columns: 2 } },
    { name: 'priceLine',      title: 'Price in Euro',    options: { columns: 2 } },
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
      name: 'priceOnRequest',
      title: 'Price on request',
      type: 'boolean',
      group: 'basis',
      description: 'Hide the price publicly — visitors see an enquiry button instead.',
      initialValue: false,
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
          { title: 'Sold', value: 'sold' },
          { title: 'Reserved', value: 'reserved' },
          { title: 'On loan', value: 'on-loan' },
          { title: 'Not for sale', value: 'not-for-sale' },
        ],
      },
      initialValue: 'available',
    }),

    // ── Details ───────────────────────────────────────────────────────────────
    defineField({
      name: 'commissionPct',
      title: 'Gallery commission (%)',
      description: 'E.g. 50 = gallery keeps 50%, artist receives 50%',
      type: 'number',
      group: 'details',
    }),
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
    defineField({
      name: 'torchSoldCount',
      title: 'Verkocht via Torch',
      type: 'number',
      group: 'details',
      hidden: true,
      description: 'Automatisch bijgewerkt — aantal via de gallery verkochte exemplaren',
      readOnly: true,
    }),

    // ── Gallery ───────────────────────────────────────────────────────────────
    defineField({
      name: 'framedDimensions',
      title: 'Framed dimensions (cm)',
      type: 'object',
      group: 'gallery',
      description: 'For "View on wall" — outer width incl. frame and passe-partout.',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm', title: 'Width', type: 'number' }),
      ],
    }),
    defineField({
      name: 'showViewInRoom',
      title: 'View on wall',
      type: 'boolean',
      group: 'gallery',
      description: 'Show the "View on wall" button on the artwork page. Requires width to be filled in.',
      initialValue: false,
    }),
    defineField({
      name: 'roomImage',
      title: 'Room photo (optional)',
      type: 'image',
      group: 'gallery',
      description: "Optional: photo of artwork for option 'View on wall'. If left empty, the first artwork photo is used. Use JPG (tightly cropped, no empty space outside the edges).",
      options: { accept: 'image/png,image/jpeg' },
    }),
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
      name: 'storageCode',
      title: 'Artwork code',
      description: 'Automatisch opgebouwd uit SDK + jaar. Vul de laatste 3 cijfers in.',
      type: 'string',
      group: 'logistics',
      components: { input: StorageCodeInput },
    }),
    defineField({
      name: 'currentLocation',
      title: 'Current location, dates & insurance',
      description: 'Link to a location record. All details (since, received, insurance, note) are stored on the location.',
      type: 'reference',
      to: [{ type: 'location' }],
      group: 'logistics',
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
      title: 'Show in webshop',
      type: 'boolean',
      group: 'webshop',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Highlighted in shop',
      description: 'Highlighted products appear in their own section at the top of the shop',
      type: 'boolean',
      group: 'webshop',
      initialValue: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
    }),
    defineField({
      name: 'onSale',
      title: 'On sale',
      type: 'boolean',
      group: 'webshop',
      initialValue: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
    }),
    defineField({
      name: 'salePrice',
      title: 'Sale price',
      type: 'number',
      group: 'webshop',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop || !document?.onSale,
    }),
    defineField({
      name: 'stock',
      title: 'Stock',
      description: 'Quantity available for purchase in the webshop',
      type: 'number',
      group: 'webshop',
      initialValue: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
    }),
    defineField({
      name: 'shippingNote',
      title: 'Shipping note',
      description: 'E.g. "Ships within 5 business days"',
      type: 'string',
      group: 'webshop',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
    }),
    defineField({
      name: 'shippingClass',
      title: 'Shipping class',
      description: 'Determines the shipping rate for this item in the webshop',
      type: 'reference',
      to: [{ type: 'shippingClass' }],
      group: 'webshop',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      description: 'Lower number = higher in the section. Leave empty to fall back to year.',
      type: 'number',
      group: 'webshop',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hidden: ({ document }: any) => !document?.showInWebshop,
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

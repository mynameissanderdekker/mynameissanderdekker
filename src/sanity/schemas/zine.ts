import { defineField, defineType } from 'sanity'
import { CompactDimensions } from '../components/CompactDimensions'
import { CategoryInput } from '../components/CategoryInput'
import { ArtworkQRCode } from '../components/ArtworkQRCode'

export const zine = defineType({
  name: 'zine',
  title: 'Publication',
  type: 'document',
  orderings: [
    { title: 'Number (asc)', name: 'numberAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  groups: [
    { name: 'info',    title: 'Info', default: true },
    { name: 'edition', title: 'Edition & Sales' },
    { name: 'webshop', title: 'Webshop' },
  ],
  preview: {
    select: { title: 'title', number: 'number', media: 'coverImage' },
    prepare({ title, number, media }) {
      return { title: [number, title].filter(Boolean).join(' — '), media }
    },
  },
  fields: [
    // ── Info ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'number',
      title: 'Number',
      description: 'E.g. Nº2',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'URL slug for the shop page (auto-generated from title)',
      group: 'info',
      options: { source: 'title' },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Category used to place this zine in a shop section (e.g. "Publications")',
      group: 'info',
      components: { input: CategoryInput },
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'info',
    }),
    defineField({
      name: 'meta',
      title: 'Meta',
      description: 'E.g. September 2022 · Edition of 35',
      type: 'string',
      group: 'info',
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
      name: 'qrCode',
      title: 'QR Code',
      type: 'string',
      group: 'info',
      readOnly: true,
      components: { field: ArtworkQRCode },
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
      type: 'text',
      rows: 4,
      group: 'info',
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
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
    }),
    defineField({
      name: 'coverImageUrl',
      title: 'Cover image URL (fallback)',
      description: 'External URL — used when no Sanity image is uploaded yet',
      type: 'url',
      group: 'info',
    }),
    defineField({
      name: 'projectSlug',
      title: 'Links to project',
      description: 'Slug of the project page this zine links to (e.g. girls-in-paris). Leave empty if no project page exists.',
      type: 'string',
      group: 'info',
    }),

    // ── Edition & Sales ───────────────────────────────────────────────────────
    defineField({
      name: 'editionTotal',
      title: 'Edition total',
      type: 'number',
      group: 'edition',
      description: 'E.g. 35 (for an edition of 35)',
    }),
    defineField({
      name: 'priceExclVAT',
      title: 'Price (excl. BTW)',
      type: 'number',
      description: 'Price in EUR excluding BTW',
      group: 'edition',
    }),
    defineField({
      name: 'vatRate',
      title: 'BTW rate (%)',
      type: 'number',
      group: 'edition',
      initialValue: 9,
      options: {
        list: [
          { title: '9%', value: 9 },
          { title: '21%', value: 21 },
          { title: '0%', value: 0 },
        ],
      },
    }),
    defineField({
      name: 'shopVariants',
      title: 'Shop variants',
      type: 'array',
      group: 'edition',
      description: 'Extra cards in the shop listing — each variant shows alongside the standard card with its own badge, price and buy link.',
      of: [
        defineField({
          name: 'shopVariant',
          title: 'Variant',
          type: 'object',
          fieldsets: [
            { name: 'pricing', title: 'Price', options: { columns: 2 } },
            { name: 'sale', title: 'Sale', options: { columns: 2 } },
          ],
          fields: [
            defineField({
              name: 'badge',
              title: 'Type',
              type: 'string',
              description: 'Automatically shows as a badge on the listing card',
              options: {
                list: [
                  { title: '✦ Signed', value: 'Signed' },
                  { title: '◈ Limited Edition', value: 'Limited Edition' },
                  { title: '★ Special Edition', value: 'Special Edition' },
                ],
                layout: 'radio',
              },
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              initialValue: 'available',
              options: {
                list: [
                  { title: 'Available', value: 'available' },
                  { title: 'Sold out', value: 'sold_out' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
            }),
            defineField({
              name: 'priceExclVAT',
              title: 'Price (excl. BTW)',
              type: 'number',
              fieldset: 'pricing',
            }),
            defineField({
              name: 'editionTotal',
              title: 'Edition total',
              type: 'number',
              fieldset: 'pricing',
            }),
            defineField({
              name: 'onSale',
              title: 'On sale',
              type: 'boolean',
              initialValue: false,
              fieldset: 'sale',
            }),
            defineField({
              name: 'salePriceExclVAT',
              title: 'Sale price (excl. BTW)',
              type: 'number',
              fieldset: 'sale',
            }),
            defineField({
              name: 'images',
              title: 'Own photos (optional)',
              type: 'array',
              description: 'Upload if this variant has its own cover image. Leave empty to use the main zine image.',
              of: [{ type: 'image', options: { hotspot: true } }],
            }),
            defineField({
              name: 'buyUrl',
              title: 'Buy link',
              type: 'url',
              description: 'Direct payment link for this variant',
            }),
            defineField({
              name: 'note',
              title: 'Note',
              type: 'string',
              description: 'Shown below the title, e.g. "Signed and numbered by the artist"',
            }),
          ],
          preview: {
            select: { badge: 'badge', price: 'priceExclVAT', onSale: 'onSale', salePrice: 'salePriceExclVAT', status: 'status' },
            prepare({ badge, price, onSale, salePrice, status }) {
              const displayPrice = onSale && salePrice != null ? `€${salePrice} (sale)` : price != null ? `€${price}` : null
              return {
                title: badge ?? '—',
                subtitle: [status, displayPrice].filter(Boolean).join(' · '),
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'options',
      title: 'Purchase options (variants)',
      type: 'array',
      group: 'edition',
      description: 'Optional — use when this zine is sold in multiple variants, each with its own price. When set, these replace the single price above on the site and the buyer picks one before buying.',
      of: [
        defineField({
          name: 'zineOption',
          title: 'Option',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'sku',
              title: 'SKU / code',
              type: 'string',
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
              description: 'Leave empty to use the zine\'s main buy link',
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
      initialValue: 'available',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Sold out', value: 'sold_out' },
          { title: 'Coming soon', value: 'coming_soon' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
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
      name: 'featured',
      title: 'Featured (in webshop)',
      description: 'Show in the featured grid (top section)',
      type: 'boolean',
      group: 'webshop',
      initialValue: false,
    }),
    defineField({
      name: 'buyUrl',
      title: 'Buy link',
      type: 'url',
      group: 'webshop',
      description: 'Direct payment link (Mollie, Stripe, etc.) — shown as "Buy" button when status is "Available"',
    }),
  ],
})

import { defineField, defineType } from 'sanity'
import { ViewingRoomSlugInput } from '../components/ViewingRoomUrlPreview'
import { ViewingRoomPdfLinks } from '../components/ViewingRoomPdfLinks'
import { QuickAddArtworks } from '../components/QuickAddArtworks'

export const privateSale = defineType({
  name: 'privateSale',
  title: 'Viewing Room',
  type: 'document',
  preview: {
    select: { title: 'title', isActive: 'isActive' },
    prepare({ title, isActive }: { title?: string; isActive?: boolean }) {
      return { title: title || 'Untitled', subtitle: isActive ? 'Active' : 'Inactive' }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Link',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      components: { input: ViewingRoomSlugInput },
    }),
    defineField({
      name: 'pdfLinks',
      title: 'PDF Downloads',
      type: 'string',
      readOnly: true,
      components: { input: ViewingRoomPdfLinks },
    }),
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'reference',
      to: [{ type: 'contact' }],
      options: { disableNew: true },
    }),
    defineField({
      name: 'occasion',
      title: 'Occasion',
      type: 'string',
    }),
    defineField({
      name: 'showPrices',
      title: 'Show prices',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires at',
      type: 'datetime',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      components: { input: QuickAddArtworks },
      of: [
        {
          type: 'object',
          name: 'privateSaleItem',
          preview: {
            select: {
              title: 'artwork.title',
              year: 'artwork.year',
              priceOverride: 'priceOverride',
              media: 'artwork.images.0',
            },
            prepare({ title, year, priceOverride, media }: { title?: string; year?: number; priceOverride?: number; media?: any }) {
              return {
                title: title || 'Untitled',
                subtitle: [year, priceOverride != null ? `€${priceOverride}` : 'catalogue price'].filter(Boolean).join(' · '),
                media,
              }
            },
          },
          fields: [
            defineField({
              name: 'artwork',
              title: 'Artwork',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'priceOverride',
              title: 'Price override (€ excl. BTW)',
              type: 'number',
            }),
            defineField({
              name: 'note',
              title: 'Note',
              type: 'text',
              rows: 2,
            }),
          ],
        },
      ],
    }),
  ],
})

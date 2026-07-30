import { defineField, defineType } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery / Venue',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'E.g. "Amsterdam, NL"',
    }),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
    }),
    defineField({
      name: 'isSolo',
      title: 'Solo exhibition',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'hasPage',
      title: 'Has own page',
      description: 'When enabled, this exhibition gets a dedicated page and the listing becomes a clickable link.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'images',
      title: 'Installation photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'artworkSeries',
      title: 'Artworks from series',
      description: 'Link a Project Series to include all its artworks at once',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }] }],
    }),
    defineField({
      name: 'artworks',
      title: 'Individual artworks',
      description: 'Add specific artworks not covered by a series above',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
    }),
    defineField({
      name: 'pressItems',
      title: 'Press',
      description: 'Articles, reviews and mentions',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pressItem',
          title: 'Press item',
          preview: {
            select: { title: 'title', publication: 'publication' },
            prepare({ title, publication }: { title?: string; publication?: string }) {
              return { title: title ?? '—', subtitle: publication ?? '' }
            },
          },
          fields: [
            defineField({ name: 'title', title: 'Article title', type: 'string' }),
            defineField({ name: 'publication', title: 'Publication', type: 'string', description: 'E.g. "De Volkskrant", "Artforum"' }),
            defineField({ name: 'url', title: 'Article URL', type: 'url' }),
            defineField({ name: 'image', title: 'Article image / scan', type: 'image', options: { hotspot: true } }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      gallery: 'gallery',
      startDate: 'startDate',
      isSolo: 'isSolo',
      media: 'images.0',
    },
    prepare({ title, gallery, startDate, isSolo, media }) {
      const year = startDate ? new Date(startDate).getFullYear() : '?'
      return {
        title: title ?? '—',
        subtitle: `${isSolo ? 'Solo — ' : ''}${gallery ?? ''} (${year})`,
        media,
      }
    },
  },
})

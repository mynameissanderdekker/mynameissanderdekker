import { defineField, defineType } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  orderings: [
    {
      title: 'Year (newest first)',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'Year (oldest first)',
      name: 'startDateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
  ],
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
      description: 'Select a Project Series — create new ones via Studio → Project Series',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'artworks',
      title: 'Individual artworks',
      description: 'Add specific artworks not covered by a series above — create new ones via Studio → Artworks',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'press',
      title: 'Press',
      description: 'Select press articles — create new ones via Studio → Press',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'press' }], options: { disableNew: true } }],
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

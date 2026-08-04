import { defineField, defineType } from 'sanity'

export const artFair = defineType({
  name: 'artFair',
  title: 'Art Fair',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'E.g. "Art Rotterdam 2026"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fair',
      title: 'Fair name',
      type: 'string',
      description: 'E.g. "Art Rotterdam"',
    }),
    defineField({
      name: 'booth',
      title: 'Stand / Booth',
      type: 'string',
      description: 'E.g. "Booth A12" or "Gallery Torch"',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'E.g. "Rotterdam, NL"',
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
      name: 'images',
      title: 'Booth / installation photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'showInCV',
      title: 'Show in CV',
      type: 'boolean',
      initialValue: false,
      description: 'Include this art fair in the CV on the About page.',
    }),
    defineField({
      name: 'cvLabel',
      title: 'CV label (optional)',
      type: 'string',
      description: 'Custom label for the CV — e.g. "Art Rotterdam — Torch Gallery". Leave empty to use the name.',
    }),
    defineField({
      name: 'hasPage',
      title: 'Has own page',
      description: 'When enabled, this art fair gets a dedicated page and the listing becomes a clickable link.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      description: 'Link to the fair or gallery website',
      type: 'url',
    }),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      description: 'Artworks shown at this art fair',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      location: 'location',
      startDate: 'startDate',
      media: 'images.0',
    },
    prepare({ title, location, startDate, media }) {
      const year = startDate ? new Date(startDate).getFullYear() : '?'
      return {
        title: title ?? '—',
        subtitle: `${location ?? ''} (${year})`,
        media,
      }
    },
  },
})

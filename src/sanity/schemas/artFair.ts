import { defineField, defineType } from 'sanity'

export const artFair = defineType({
  name: 'artFair',
  title: 'Art Fair',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Naam',
      type: 'string',
      description: 'Bijv. "Art Rotterdam 2026"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fair',
      title: 'Beurs naam',
      type: 'string',
      description: 'Bijv. "Art Rotterdam"',
    }),
    defineField({
      name: 'booth',
      title: 'Stand / Booth',
      type: 'string',
      description: 'Bijv. "Booth A12" of "Gallery Torch"',
    }),
    defineField({
      name: 'location',
      title: 'Locatie',
      type: 'string',
      description: 'Bijv. "Rotterdam, NL"',
    }),
    defineField({
      name: 'startDate',
      title: 'Startdatum',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'Einddatum',
      type: 'date',
    }),
    defineField({
      name: 'images',
      title: 'Standfoto\'s / Installatiefotos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'notes',
      title: 'Notities',
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

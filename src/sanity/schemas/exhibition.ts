import { defineField, defineType } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery / Venue',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Locatie',
      type: 'string',
      description: 'Bijv. "Amsterdam, NL"',
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
      name: 'isSolo',
      title: 'Solo expositie',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'images',
      title: 'Installatiefotos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'pressLink',
      title: 'Pers / review link',
      type: 'url',
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

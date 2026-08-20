import { defineField, defineType } from 'sanity'

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  preview: {
    select: { title: 'name', subtitle: 'type', city: 'city' },
    prepare({ title, subtitle, city }: { title?: string; subtitle?: string; city?: string }) {
      const typeLabel: Record<string, string> = {
        gallery:   'Gallery',
        museum:    'Museum',
        collector: 'Collector',
        storage:   'Storage',
        artfair:   'Art Fair',
        studio:    'Studio',
        other:     'Other',
      }
      return {
        title: title || 'Untitled',
        subtitle: [typeLabel[subtitle ?? ''] ?? subtitle, city].filter(Boolean).join(' · '),
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Gallery',   value: 'gallery' },
          { title: 'Museum',    value: 'museum' },
          { title: 'Collector', value: 'collector' },
          { title: 'Storage',   value: 'storage' },
          { title: 'Art Fair',  value: 'artfair' },
          { title: 'Studio',    value: 'studio' },
          { title: 'Other',     value: 'other' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
    }),
    defineField({
      name: 'contact',
      title: 'Contact person',
      type: 'reference',
      to: [{ type: 'contact' }],
      options: { disableNew: true },
    }),
    defineField({
      name: 'since',
      title: 'Since',
      type: 'date',
      description: 'Date since which this artwork is at this location.',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
    }),
  ],
})

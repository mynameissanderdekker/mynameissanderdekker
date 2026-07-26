import { defineField, defineType } from 'sanity'

export const projectSeries = defineType({
  name: 'projectSeries',
  title: 'Project Serie',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Titel' }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', type: 'text', title: 'Beschrijving' }),
    defineField({
      name: 'coverImage',
      type: 'image',
      title: 'Cover afbeelding',
      options: { hotspot: true },
    }),
    defineField({ name: 'order', type: 'number', title: 'Volgorde' }),
  ],
  preview: {
    select: { title: 'title', media: 'coverImage' },
  },
})

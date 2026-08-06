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
    defineField({ name: 'description', type: 'text', title: 'Description' }),
    defineField({
      name: 'coverImage',
      type: 'image',
      title: 'Cover image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'artworks',
      title: 'Artworks',
      description: 'Select the artworks that belong to this series',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'artwork' }],
        options: { filter: 'category != "book"' },
      }],
    }),
    defineField({
      name: 'publications',
      title: 'Publications',
      description: 'Zines / books / catalogues related to this series — create new ones via Studio → Publications',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'zine' }],
      }],
    }),
    defineField({ name: 'order', type: 'number', title: 'Sort order' }),
  ],
  preview: {
    select: { title: 'title', media: 'coverImage' },
  },
})

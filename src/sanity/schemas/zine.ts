import { defineField, defineType } from 'sanity'

export const zine = defineType({
  name: 'zine',
  title: 'Zine',
  type: 'document',
  orderings: [
    { title: 'Number (asc)', name: 'numberAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', number: 'number', media: 'coverImage' },
    prepare({ title, number, media }) {
      return { title: [number, title].filter(Boolean).join(' — '), media }
    },
  },
  fields: [
    defineField({
      name: 'number',
      title: 'Number',
      description: 'E.g. Nº2',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'meta',
      title: 'Meta',
      description: 'E.g. September 2022 · Edition of 35',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'coverImageUrl',
      title: 'Cover image URL (fallback)',
      description: 'External URL — used when no Sanity image is uploaded yet',
      type: 'url',
    }),
    defineField({
      name: 'projectSlug',
      title: 'Links to project',
      description: 'Slug of the project page this zine links to (e.g. girls-in-paris). Leave empty if no project page exists.',
      type: 'string',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description: 'Show in the featured grid (top section)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      description: 'Sort order — lower = earlier',
      type: 'number',
    }),
  ],
})

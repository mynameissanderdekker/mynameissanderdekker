import { defineType, defineField, defineArrayMember } from 'sanity'
import { ALL_PAGE_BLOCKS } from './pageBlocks'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  preview: { prepare() { return { title: 'About' } } },
  fields: [
    defineField({
      name: 'portrait',
      title: 'Portrait photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Photo shown next to the bio text on the About page.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio text',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The introductory bio shown at the top of the About page.',
    }),
    defineField({
      name: 'quotes',
      title: 'Quotes / Press',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quote',
          preview: {
            select: { title: 'name', subtitle: 'publication' },
          },
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
            defineField({ name: 'role', title: 'Role', type: 'string', description: 'e.g. "foreword", "review", "interview"' }),
            defineField({ name: 'publication', title: 'Publication', type: 'string' }),
            defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
            defineField({ name: 'quote', title: 'Pull quote', type: 'text', rows: 3 }),
            defineField({ name: 'article', title: 'Full article text (EN)', type: 'text', rows: 10 }),
            defineField({ name: 'articleNl', title: 'Full article text (NL — original)', type: 'text', rows: 10 }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Extra page content',
      description: 'Optional additional blocks below the quotes.',
      type: 'array',
      of: ALL_PAGE_BLOCKS,
    }),
  ],
})

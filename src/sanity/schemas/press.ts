import { defineField, defineType } from 'sanity'

export const press = defineType({
  name: 'press',
  title: 'Press',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publication',
      title: 'Publication',
      type: 'string',
      description: 'E.g. "De Volkskrant", "Foam Magazine", "NRC"',
    }),
    defineField({
      name: 'date',
      title: 'Publication date',
      type: 'date',
    }),
    defineField({
      name: 'url',
      title: 'Article URL',
      type: 'url',
      description: 'Optional — may be behind a paywall or no longer work',
    }),
    defineField({
      name: 'image',
      title: 'Article scan / photo',
      description: 'Upload a photo or scan of the article',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'body',
      title: 'Article text',
      description: 'Paste or type the full text of the article here',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'exhibitions',
      title: 'Related exhibitions',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }, { type: 'artFair' }] }],
    }),
    defineField({
      name: 'projects',
      title: 'Related projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'artworks',
      title: 'Related artworks',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      publication: 'publication',
      date: 'date',
      media: 'image',
    },
    prepare({ title, publication, date, media }) {
      const year = date ? new Date(date).getFullYear() : '?'
      return {
        title: title ?? '—',
        subtitle: `${publication ?? ''}${publication && year ? ' · ' : ''}${year}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Date, newest first',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Publication A–Z',
      name: 'publicationAsc',
      by: [{ field: 'publication', direction: 'asc' }],
    },
  ],
})

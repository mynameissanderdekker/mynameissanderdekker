import { defineType, defineField, defineArrayMember } from 'sanity'

export const cvPage = defineType({
  name: 'cvPage',
  title: 'CV',
  type: 'document',
  preview: { prepare() { return { title: 'CV' } } },
  fields: [
    defineField({
      name: 'intro',
      title: 'Intro text',
      type: 'text',
      rows: 2,
      description: 'Short line shown below the page title.',
    }),
    defineField({
      name: 'cvPdfUrl',
      title: 'CV PDF (download link)',
      type: 'url',
      description: 'Upload a PDF to any host (e.g. Sanity Files or your own CDN) and paste the URL here. A "Download CV" button will appear on the CV page.',
    }),
    defineField({
      name: 'sections',
      title: 'CV sections',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'cvSection',
          preview: {
            select: { title: 'title' },
          },
          fields: [
            defineField({ name: 'title', title: 'Section title', type: 'string', validation: r => r.required() }),
            defineField({
              name: 'entries',
              title: 'Entries',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'entry',
                  preview: {
                    select: { title: 'label', subtitle: 'year' },
                  },
                  fields: [
                    defineField({ name: 'year', title: 'Year', type: 'string' }),
                    defineField({ name: 'label', title: 'Description', type: 'string', validation: r => r.required() }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'pubPressColumns',
      title: 'Publications, Press & Media (two columns)',
      type: 'array',
      description: 'Two columns, e.g. "Self-Published Books" and "Press, Publications & Media" — each with its own titled sub-lists.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pubPressColumn',
          preview: {
            select: { title: 'columnTitle' },
          },
          fields: [
            defineField({ name: 'columnTitle', title: 'Column title', type: 'string', validation: r => r.required() }),
            defineField({
              name: 'groups',
              title: 'Groups',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'pubPressGroup',
                  preview: {
                    select: { title: 'groupTitle' },
                  },
                  fields: [
                    defineField({ name: 'groupTitle', title: 'Group title', type: 'string', validation: r => r.required() }),
                    defineField({
                      name: 'items',
                      title: 'Items',
                      type: 'array',
                      description: 'One per line, e.g. "Zine Nº10 — TenFifteen" or "Het Parool (29-06-2018)"',
                      of: [
                        defineArrayMember({
                          type: 'object',
                          name: 'pubPressItem',
                          preview: {
                            select: { title: 'text', subtitle: 'url' },
                          },
                          fields: [
                            defineField({ name: 'text', title: 'Text', type: 'string', validation: r => r.required() }),
                            defineField({ name: 'url', title: 'Link (optional)', type: 'url', description: 'Opens in a new tab if set' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

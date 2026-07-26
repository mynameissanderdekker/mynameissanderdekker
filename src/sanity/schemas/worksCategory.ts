import { defineField, defineType } from 'sanity'

export const worksCategory = defineType({
  name: 'worksCategory',
  title: 'Categorie',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Naam',
      type: 'string',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})

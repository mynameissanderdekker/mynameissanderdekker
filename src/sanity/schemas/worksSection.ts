import { defineField, defineType } from 'sanity'

export const worksSection = defineType({
  name: 'worksSection',
  title: 'Webshop sectie',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Naam',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Volgorde',
      type: 'number',
      description: 'Lager getal = eerder in de shop. Bijv. 1, 2, 3 ...',
      validation: (r) => r.required().integer().min(1),
    }),
  ],
  orderings: [
    {
      name: 'byOrder',
      title: 'Volgorde',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', order: 'order' },
    prepare({ title, order }) {
      return {
        title: title ?? '—',
        subtitle: order != null ? `Positie ${order}` : 'Geen volgorde',
      }
    },
  },
})

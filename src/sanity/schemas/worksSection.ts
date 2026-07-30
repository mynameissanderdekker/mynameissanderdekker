import { defineField, defineType } from 'sanity'

export const worksSection = defineType({
  name: 'worksSection',
  title: 'Shop section',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower number = earlier in the shop. E.g. 1, 2, 3 ...',
      validation: (r) => r.required().integer().min(1),
    }),
  ],
  orderings: [
    {
      name: 'byOrder',
      title: 'Order',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', order: 'order' },
    prepare({ title, order }) {
      return {
        title: title ?? '—',
        subtitle: order != null ? `Position ${order}` : 'No order set',
      }
    },
  },
})

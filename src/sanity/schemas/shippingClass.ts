import { defineType, defineField } from 'sanity'

export const shippingClass = defineType({
  name: 'shippingClass',
  title: 'Shipping Class',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'E.g. "Small / Books", "Medium Works", "Large Works"',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'E.g. "small", "medium", "large"',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug' },
  },
})

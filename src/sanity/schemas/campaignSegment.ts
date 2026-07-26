import { defineField, defineType } from 'sanity'

export const campaignSegment = defineType({
  name: 'campaignSegment',
  title: 'Campagne segment',
  type: 'document',
  fields: [
    defineField({ name: 'name',       title: 'Naam',       type: 'string' }),
    defineField({
      name: 'conditions',
      title: 'Filters',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'field',    type: 'string' }),
          defineField({ name: 'operator', type: 'string' }),
          defineField({ name: 'value',    type: 'string' }),
        ],
      }],
    }),
  ],
  preview: {
    select: { title: 'name' },
  },
})

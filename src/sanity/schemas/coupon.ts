import { defineField, defineType } from 'sanity'

export const coupon = defineType({
  name: 'coupon',
  title: 'Coupon',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({
      name: 'code', title: 'Code', type: 'string',
      description: 'E.g. "SANDER20" — case sensitive',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'type', title: 'Type', type: 'string',
      options: { list: [{ title: 'Percentage (%)', value: 'percentage' }, { title: 'Fixed amount (€)', value: 'fixed' }] },
      initialValue: 'percentage',
    }),
    defineField({
      name: 'value', title: 'Value', type: 'number',
      description: 'E.g. 20 (%) or 25 (€)',
      validation: Rule => Rule.required().positive(),
    }),
    defineField({ name: 'minOrderAmount', title: 'Minimum order amount (€)', type: 'number' }),
    defineField({ name: 'validFrom',  title: 'Valid from',  type: 'date' }),
    defineField({ name: 'validUntil', title: 'Valid until', type: 'date' }),
    defineField({ name: 'usageLimit', title: 'Usage limit', description: 'Leave empty for unlimited', type: 'number' }),
    defineField({ name: 'usageCount', title: 'Times used', type: 'number', readOnly: true, initialValue: 0 }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'code', type: 'type', value: 'value', active: 'active' },
    prepare({ title, type, value, active }: any) {
      return {
        title: title || 'Coupon',
        subtitle: [(type === 'percentage' ? `${value}%` : `€${value}`), active ? 'Active' : 'Inactive'].join(' · '),
      }
    },
  },
})

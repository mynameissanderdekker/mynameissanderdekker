import { defineField, defineType } from 'sanity'

const SHIPPING_METHOD_TYPES = [
  { title: 'Flat rate',       value: 'flat_rate' },
  { title: 'Free shipping',   value: 'free_shipping' },
  { title: 'Local pickup',    value: 'local_pickup' },
]

export const shippingZone = defineType({
  name: 'shippingZone',
  title: 'Shipping Zone',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({
      name: 'zoneName', title: 'Zone name', type: 'string',
      description: 'E.g. "Netherlands", "European Union", "Rest of the World"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'regions', title: 'Countries', type: 'array', of: [{ type: 'string' }],
      description: 'Country codes e.g. ["NL"] or ["*"] for all other countries',
    }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({
      name: 'shippingMethods', title: 'Shipping methods', type: 'array',
      of: [{
        type: 'object', name: 'shippingMethod',
        fields: [
          {
            name: 'methodType', title: 'Type', type: 'string',
            options: { list: SHIPPING_METHOD_TYPES }, initialValue: 'flat_rate',
          },
          { name: 'title', title: 'Name', description: 'E.g. "Standard shipping"', type: 'string', validation: (Rule: any) => Rule.required() },
          { name: 'cost', title: 'Cost (€)', type: 'number' },
          { name: 'freeShippingMinimum', title: 'Free shipping above (€)', type: 'number' },
        ],
        preview: {
          select: { title: 'title', methodType: 'methodType', cost: 'cost' },
          prepare({ title, methodType, cost }: any) {
            const typeLabel = SHIPPING_METHOD_TYPES.find(t => t.value === methodType)?.title
            return { title: title || 'Shipping method', subtitle: [typeLabel, cost != null ? `€${cost}` : null].filter(Boolean).join(' · ') }
          },
        },
      }],
    }),
  ],
  preview: {
    select: { title: 'zoneName', regions: 'regions', active: 'active' },
    prepare({ title, regions, active }: any) {
      return {
        title: title || 'Shipping zone',
        subtitle: [Array.isArray(regions) ? regions.join(', ') : null, active ? 'Active' : 'Inactive'].filter(Boolean).join(' · '),
      }
    },
  },
})

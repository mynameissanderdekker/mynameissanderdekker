import { defineField, defineType } from 'sanity'
import { SectionOrderInput } from '../components/SectionOrderInput'

export const worksPage = defineType({
  name: 'worksPage',
  title: 'Webshop secties',
  type: 'document',
  components: { input: SectionOrderInput },
  fields: [
    defineField({
      name: 'sections',
      title: 'Secties',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'category', title: 'Categorie', type: 'string' }),
            defineField({ name: 'visible',  title: 'Zichtbaar', type: 'boolean', initialValue: true }),
            defineField({ name: 'max',      title: 'Max artikelen', type: 'number', initialValue: 6 }),
          ],
        },
      ],
      hidden: true, // beheerd via custom component
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Webshop secties' }
    },
  },
})

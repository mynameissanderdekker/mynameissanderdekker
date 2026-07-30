import { defineField, defineType, defineArrayMember } from 'sanity'
import { CategoryMultiInput } from '../components/CategoryInput'

export const worksPage = defineType({
  name: 'worksPage',
  title: 'Shop sections',
  type: 'document',
  fields: [
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          preview: {
            select: { sectionTitle: 'title', categories: 'categories', visible: 'visible' },
            prepare({ sectionTitle, categories, visible }) {
              const cats = (categories as string[] | undefined)?.join(', ') ?? ''
              return {
                title: sectionTitle || cats || 'Unnamed section',
                subtitle: visible === false ? 'Hidden' : 'Visible',
              }
            },
          },
          fields: [
            defineField({
              name: 'categories',
              title: 'Categories',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Select one or more categories to show in this section. Leave empty to show all artworks.',
              components: { input: CategoryMultiInput },
            }),
            defineField({
              name: 'title',
              title: 'Section title',
              type: 'string',
              description: 'Displayed as the heading on the shop page. Leave empty to use the category name.',
            }),
            defineField({
              name: 'visible',
              title: 'Visible',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'columns',
              title: 'Columns',
              type: 'number',
              initialValue: 3,
              options: {
                list: [
                  { title: '2 columns', value: 2 },
                  { title: '3 columns', value: 3 },
                  { title: '4 columns', value: 4 },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
            }),
            // Max for 2 columns
            defineField({
              name: 'max2col',
              title: 'Max. items',
              type: 'number',
              initialValue: 4,
              hidden: ({ parent }) => parent?.columns !== 2,
              options: {
                list: [
                  { title: 'Show all', value: 0 },
                  { title: '2', value: 2 },
                  { title: '4', value: 4 },
                  { title: '6', value: 6 },
                  { title: '8', value: 8 },
                ],
              },
            }),
            // Max for 3 columns
            defineField({
              name: 'max3col',
              title: 'Max. items',
              type: 'number',
              initialValue: 6,
              hidden: ({ parent }) => parent?.columns !== 3 && parent?.columns !== undefined,
              options: {
                list: [
                  { title: 'Show all', value: 0 },
                  { title: '3', value: 3 },
                  { title: '6', value: 6 },
                  { title: '9', value: 9 },
                  { title: '12', value: 12 },
                ],
              },
            }),
            // Max for 4 columns
            defineField({
              name: 'max4col',
              title: 'Max. items',
              type: 'number',
              initialValue: 4,
              hidden: ({ parent }) => parent?.columns !== 4,
              options: {
                list: [
                  { title: 'Show all', value: 0 },
                  { title: '4', value: 4 },
                  { title: '8', value: 8 },
                  { title: '12', value: 12 },
                  { title: '16', value: 16 },
                ],
              },
            }),
            defineField({
              name: 'showViewAll',
              title: 'Show "View all" link',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'description',
              title: 'Text below section title',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{ title: 'Normal', value: 'normal' }],
                  lists: [],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                    annotations: [
                      defineArrayMember({
                        type: 'object',
                        name: 'link',
                        title: 'Link',
                        fields: [
                          defineField({
                            name: 'href',
                            type: 'string',
                            title: 'URL',
                            validation: r => r.required(),
                          }),
                          defineField({
                            name: 'blank',
                            type: 'boolean',
                            title: 'Open in new tab',
                            initialValue: false,
                          }),
                        ],
                      }),
                    ],
                  },
                }),
                // Button block
                defineArrayMember({
                  type: 'object',
                  name: 'button',
                  title: 'Button',
                  preview: {
                    select: { title: 'label' },
                    prepare({ title }) {
                      return { title: `Button: ${title ?? ''}` }
                    },
                  },
                  fields: [
                    defineField({ name: 'label', title: 'Label', type: 'string', validation: r => r.required() }),
                    defineField({ name: 'href',  title: 'URL',   type: 'string', validation: r => r.required() }),
                    defineField({
                      name: 'blank',
                      title: 'Open in new tab',
                      type: 'boolean',
                      initialValue: false,
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
  preview: {
    prepare() {
      return { title: 'Shop sections' }
    },
  },
})

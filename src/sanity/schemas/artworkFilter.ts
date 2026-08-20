import { defineField, defineType } from 'sanity'

export const artworkFilter = defineType({
  name: 'artworkFilter',
  title: 'Artwork filter',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Filter naam',
      type: 'string',
      description: 'Naam zoals die in de sidebar verschijnt — bijv. "Grote formaten" of "Beschikbaar 2024"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      description: 'Laat leeg om alle statussen te tonen',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Sold', value: 'sold' },
          { title: 'Reserved', value: 'reserved' },
          { title: 'On loan', value: 'on-loan' },
          { title: 'Not for sale', value: 'not-for-sale' },
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Categorie',
      type: 'string',
      description: 'Laat leeg om alle categorieën te tonen',
    }),
    defineField({
      name: 'inWebshop',
      title: 'Alleen in webshop',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Volgorde in sidebar',
      type: 'number',
      description: 'Lager = hoger in de lijst',
    }),
  ],
  preview: {
    select: { title: 'title', status: 'status', category: 'category' },
    prepare({ title, status, category }: { title?: string; status?: string; category?: string }) {
      const parts = [status, category].filter(Boolean)
      return { title: title ?? '—', subtitle: parts.length ? parts.join(' · ') : 'Alle werken' }
    },
  },
})

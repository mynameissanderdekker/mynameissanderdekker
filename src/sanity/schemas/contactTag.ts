import { defineField, defineType } from 'sanity'

/**
 * Labels op een contact — "VIP", "Art Rotterdam 2026", "Museum".
 *
 * Verwijzingen naar documenten, geen vrije tekst: anders krijg je "vip", "VIP"
 * en "V.I.P." naast elkaar en kun je er niet meer op filteren. Beheer je onder
 * CRM → Contacts → Contact Tags.
 */
export const contactTag = defineType({
  name: 'contactTag',
  title: 'Contact Tag',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({
      name: 'name',
      title: 'Tag name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Optional — e.g. "Collectors met at art fairs"',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'description' },
  },
})

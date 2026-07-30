import { defineField, defineType } from 'sanity'

export const pressRelease = defineType({
  name: 'pressRelease',
  title: 'Press Release',
  type: 'document',
  preview: {
    select: { title: 'title', subtitle: 'date' },
    prepare({ title, date }: { title?: string; date?: string }) {
      return {
        title: title ?? '—',
        subtitle: date ? new Date(date).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      description: 'The main headline of the press release.',
      validation: r => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Release date',
      type: 'date',
      description: 'Publication date — shown as "Amsterdam, [date]" at the top.',
    }),
    defineField({
      name: 'embargo',
      title: 'Embargo note',
      type: 'string',
      description: 'Leave empty for "FOR IMMEDIATE RELEASE". Otherwise e.g. "Embargo until 14 March 2026".',
    }),
    defineField({
      name: 'subject',
      title: 'Subject / context',
      type: 'string',
      description: 'One-liner below the headline, e.g. "Solo exhibition at Torch Gallery, Amsterdam".',
    }),
    defineField({
      name: 'exhibition',
      title: 'Linked exhibition',
      type: 'reference',
      to: [{ type: 'exhibition' }],
    }),
    defineField({
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 4,
      description: 'The lead paragraph — the most important facts in 2–3 sentences.',
    }),
    defineField({
      name: 'body',
      title: 'Body text',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full press release text.',
    }),
    defineField({
      name: 'images',
      title: 'Press images',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pressImage',
          preview: {
            select: { title: 'caption', media: 'image' },
          },
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
            defineField({ name: 'caption', title: 'Caption / credit', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'artworks',
      title: 'Featured artworks',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
      description: 'Artworks referenced or shown in this press release.',
    }),
    defineField({
      name: 'contactName',
      title: 'Contact name',
      type: 'string',
      initialValue: 'Sander Dekker',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      initialValue: 'hello@mynameissanderdekker.com',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact phone',
      type: 'string',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      initialValue: 'https://mynameissanderdekker.com',
    }),
    defineField({
      name: 'notes',
      title: 'Internal notes',
      type: 'text',
      rows: 2,
      description: 'Not shown on the press release — internal use only.',
    }),

    // ── Email send status (set automatically) ─────────────────────────────────
    defineField({
      name: 'emailSentAt',
      title: 'Email sent at',
      type: 'datetime',
      readOnly: true,
      description: 'Filled automatically when "Send as press email" is used.',
    }),
    defineField({
      name: 'emailRecipientCount',
      title: 'Email recipients',
      type: 'number',
      readOnly: true,
    }),
  ],
})

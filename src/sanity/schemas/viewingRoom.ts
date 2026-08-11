import { defineField, defineType } from 'sanity'

export const viewingRoom = defineType({
  name: 'viewingRoom',
  title: 'Viewing Room',
  type: 'document',
  groups: [
    { name: 'info',      title: 'Info',       default: true },
    { name: 'works',     title: 'Works' },
    { name: 'access',    title: 'Access & Visibility' },
  ],
  fields: [
    // ── Basic info ────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'info',
      description: 'Internal name, e.g. "Art Rotterdam 2026 — Selection for Jan"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
      description: 'Sets the shareable URL: /room/[slug]',
    }),
    defineField({
      name: 'description',
      title: 'Intro text (optional)',
      type: 'text',
      rows: 3,
      group: 'info',
      description: 'Shown above the works on the room page',
    }),

    // ── Collector (private) ───────────────────────────────────────────────────
    defineField({
      name: 'contact',
      title: 'Contact',
      type: 'reference',
      to: [{ type: 'contact' }],
      group: 'info',
      options: { disableNew: true },
      description: 'Link to a contact — the viewing room is then recorded in their history automatically. Never visible on the website.',
    }),
    defineField({
      name: 'recipientName',
      title: 'Recipient name (private)',
      type: 'string',
      group: 'info',
      description: 'Override if no contact is linked, or if the name should differ. Never visible on the website.',
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Recipient email (private)',
      type: 'string',
      group: 'info',
      description: 'Override if no contact is linked, or if the email should differ. Never visible on the website.',
    }),
    defineField({
      name: 'occasion',
      title: 'Occasion (private)',
      type: 'string',
      group: 'info',
      description: 'E.g. "Art Rotterdam 2026", "Request via gallery", "Private viewing"',
    }),
    defineField({
      name: 'notes',
      title: 'Notes (private)',
      type: 'text',
      rows: 3,
      group: 'info',
    }),

    // ── Works ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'artworks',
      title: 'Selected works',
      type: 'array',
      group: 'works',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Work',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'contextNote',
              title: 'Note for this recipient (private)',
              type: 'string',
              description: 'E.g. "Fits the interior you described"',
            }),
          ],
          preview: {
            select: {
              title: 'artwork.title',
              year:  'artwork.year',
              media: 'artwork.images.0',
            },
            prepare({ title, year, media }) {
              return { title: `${title ?? '—'} (${year ?? '?'})`, media }
            },
          },
        },
      ],
      description: 'Drag works into the desired order',
    }),

    // ── Access & Visibility ───────────────────────────────────────────────────
    defineField({
      name: 'isPublished',
      title: 'Active (shareable link works)',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Turn on to activate the link',
    }),
    defineField({
      name: 'password',
      title: 'Access code (optional)',
      type: 'string',
      group: 'access',
      description: 'Leave empty for an open (but obscure) URL',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires on',
      type: 'datetime',
      group: 'access',
      description: 'Optional: link expires automatically after this date',
    }),
    defineField({
      name: 'showPrices',
      title: 'Show prices',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'On = price excl. BTW visible on the room page',
    }),
  ],

  preview: {
    select: {
      title:     'title',
      collector: 'recipientName',
      published: 'isPublished',
      works:     'artworks',
    },
    prepare({ title, collector, published, works }) {
      const count = Array.isArray(works) ? works.length : 0
      return {
        title: title ?? '—',
        subtitle: `${published ? 'Active' : 'Draft'} — ${count} work${count !== 1 ? 's' : ''}${collector ? ` — ${collector}` : ''}`,
      }
    },
  },
})

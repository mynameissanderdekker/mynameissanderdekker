import { defineField, defineType } from 'sanity'

export const viewingRoom = defineType({
  name: 'viewingRoom',
  title: 'Viewing Room',
  type: 'document',
  groups: [
    { name: 'info',      title: 'Informatie', default: true },
    { name: 'works',     title: 'Werken' },
    { name: 'access',    title: 'Toegang & Zichtbaarheid' },
  ],
  fields: [
    // ── Basisinfo ─────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      group: 'info',
      description: 'Interne naam, bijv. "Art Rotterdam 2026 — Selectie voor Jan"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
      description: 'Bepaalt de deelbare URL: /room/[slug]',
    }),
    defineField({
      name: 'description',
      title: 'Introductietekst (optioneel)',
      type: 'text',
      rows: 3,
      group: 'info',
      description: 'Wordt getoond boven de werken op de room-pagina',
    }),

    // ── Collector (privé) ─────────────────────────────────────────────────────
    defineField({
      name: 'collectorName',
      title: 'Collector naam (privé)',
      type: 'string',
      group: 'info',
      description: 'Nooit zichtbaar op de website',
    }),
    defineField({
      name: 'collectorEmail',
      title: 'Collector e-mail (privé)',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'occasion',
      title: 'Aanleiding (privé)',
      type: 'string',
      group: 'info',
      description: 'Bijv. "Art Rotterdam 2026", "Aanvraag via gallery", "Privébezichtiging"',
    }),
    defineField({
      name: 'notes',
      title: 'Notities (privé)',
      type: 'text',
      rows: 3,
      group: 'info',
    }),

    // ── Werken ────────────────────────────────────────────────────────────────
    defineField({
      name: 'artworks',
      title: 'Geselecteerde werken',
      type: 'array',
      group: 'works',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Werk',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'contextNote',
              title: 'Toelichting voor deze ontvanger (privé)',
              type: 'string',
              description: 'Bijv. "Past bij het interieur dat je beschreef"',
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
      description: 'Sleep werken in de gewenste volgorde',
    }),

    // ── Toegang & Zichtbaarheid ───────────────────────────────────────────────
    defineField({
      name: 'isPublished',
      title: 'Actief (deelbare link werkt)',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Zet aan om de link te activeren',
    }),
    defineField({
      name: 'password',
      title: 'Toegangscode (optioneel)',
      type: 'string',
      group: 'access',
      description: 'Laat leeg voor een open (maar obscure) URL',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Verloopt op',
      type: 'datetime',
      group: 'access',
      description: 'Optioneel: link verloopt automatisch na deze datum',
    }),
    defineField({
      name: 'showPrices',
      title: 'Prijzen tonen',
      type: 'boolean',
      group: 'access',
      initialValue: false,
      description: 'Aan = prijs excl. BTW zichtbaar op de room-pagina',
    }),
  ],

  preview: {
    select: {
      title:     'title',
      collector: 'collectorName',
      published: 'isPublished',
      works:     'artworks',
    },
    prepare({ title, collector, published, works }) {
      const count = Array.isArray(works) ? works.length : 0
      return {
        title: title ?? '—',
        subtitle: `${published ? 'Actief' : 'Concept'} — ${count} werk${count !== 1 ? 'en' : ''}${collector ? ` — ${collector}` : ''}`,
      }
    },
  },
})

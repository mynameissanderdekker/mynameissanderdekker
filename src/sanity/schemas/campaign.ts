import { defineField, defineType } from 'sanity'

// ── Segment definitions ───────────────────────────────────────────────────────
// These map to GROQ filters in the send API route.
export const SEGMENTS = [
  {
    value: 'newsletter',
    title: '📬 Nieuwsbrief (iedereen met subscribed = aan)',
    description: 'Alle contacten die ingeschreven zijn voor de nieuwsbrief.',
    filter: `subscribed == true`,
  },
  {
    value: 'collectors',
    title: '🔥 Collectoren (hot)',
    description: 'Contacten van het type "Collector" die nog ingeschreven zijn.',
    filter: `type == "collector" && subscribed != false`,
  },
  {
    value: 'buyers_low',
    title: '🟡 Kopers < €500 (lukewarm)',
    description: 'Contacten met minstens één aankoop onder €500.',
    filter: `count(purchases[price < 500]) > 0 && subscribed != false`,
  },
  {
    value: 'galleries',
    title: '🏛 Galeries & Musea',
    description: 'Contacten van het type "Gallery".',
    filter: `type == "gallery" && subscribed != false`,
  },
  {
    value: 'all',
    title: '📢 Iedereen (alle contacten, incl. uitgeschrevenen)',
    description: 'Stuurt naar alle contacten met een e-mailadres — gebruik met zorg.',
    filter: `defined(email)`,
  },
] as const

export type SegmentValue = (typeof SEGMENTS)[number]['value']

// ── Campaign schema ───────────────────────────────────────────────────────────
export const campaign = defineType({
  name: 'campaign',
  title: 'Campagne',
  type: 'document',
  groups: [
    { name: 'content',   title: 'Inhoud',    default: true },
    { name: 'audience',  title: 'Doelgroep' },
    { name: 'meta',      title: 'Status' },
  ],
  fields: [
    // ── Inbox ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'subject',
      title: 'Onderwerpregel',
      type: 'string',
      group: 'content',
      description: 'Wat je ziet in de inbox als onderwerp.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'previewText',
      title: 'Preview tekst',
      type: 'string',
      group: 'content',
      description: 'Grijze snippet naast het onderwerp in de inbox (max ~90 tekens).',
    }),

    // ── Body ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'heading',
      title: 'Kop',
      type: 'string',
      group: 'content',
      description: 'Grote koptekst bovenin de mail.',
    }),
    defineField({
      name: 'image',
      title: 'Afbeelding',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Optioneel — verschijnt boven de tekst.',
    }),
    defineField({
      name: 'body',
      title: 'Tekst',
      type: 'text',
      rows: 8,
      group: 'content',
      description: 'Platte tekst — regeleinden worden gerespecteerd.',
    }),

    // ── CTA ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'buttonText',
      title: 'Knoptekst',
      type: 'string',
      group: 'content',
      description: 'Bijv. "Bekijk de collectie" of "Shop now"',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Knop-URL',
      type: 'url',
      group: 'content',
    }),

    // ── Doelgroep ─────────────────────────────────────────────────────────────
    defineField({
      name: 'segment',
      title: 'Doelgroep',
      type: 'string',
      group: 'audience',
      options: {
        list: SEGMENTS.map(({ value, title }) => ({ value, title })),
        layout: 'radio',
      },
      initialValue: 'newsletter',
      validation: (r) => r.required(),
    }),

    // ── Status (readonly, ingevuld na versturen) ──────────────────────────────
    defineField({
      name: 'sentAt',
      title: 'Verstuurd op',
      type: 'datetime',
      group: 'meta',
      readOnly: true,
    }),
    defineField({
      name: 'recipientCount',
      title: 'Aantal ontvangers',
      type: 'number',
      group: 'meta',
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: 'subject',
      segment: 'segment',
      sentAt: 'sentAt',
      count: 'recipientCount',
    },
    prepare({ title, segment, sentAt, count }) {
      const segLabel = SEGMENTS.find(s => s.value === segment)?.title ?? segment ?? '—'
      const status = sentAt
        ? `✅ Verstuurd (${count ?? '?'} ontvangers)`
        : '📝 Concept'
      return {
        title: title ?? '—',
        subtitle: `${status} · ${segLabel}`,
      }
    },
  },
})

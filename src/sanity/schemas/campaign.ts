import { defineField, defineType } from 'sanity'

// ── Segment definitions ───────────────────────────────────────────────────────
// These map to GROQ filters in the send API route.
export const SEGMENTS = [
  {
    value: 'newsletter',
    title: '📬 Newsletter (everyone with subscribed = on)',
    description: 'All contacts subscribed to the newsletter.',
    filter: `subscribed == true`,
  },
  {
    value: 'collectors',
    title: '🔥 Collectors (hot)',
    description: 'Contacts of type "Collector" who are still subscribed.',
    filter: `type == "collector" && subscribed != false`,
  },
  {
    value: 'buyers_low',
    title: '🟡 Buyers < €500 (lukewarm)',
    description: 'Contacts with at least one purchase under €500.',
    filter: `count(purchases[price < 500]) > 0 && subscribed != false`,
  },
  {
    value: 'galleries',
    title: '🏛 Galleries & Museums',
    description: 'Contacts of type "Gallery".',
    filter: `type == "gallery" && subscribed != false`,
  },
  {
    value: 'press',
    title: '📰 Press (journalists + galleries)',
    description: 'Contacts of type "Journalist" or "Gallery" who are not unsubscribed.',
    filter: `type in ["journalist", "gallery"] && subscribed != false`,
  },
  {
    value: 'all',
    title: '📢 Everyone (all contacts, incl. unsubscribed)',
    description: 'Sends to all contacts with an email address — use with care.',
    filter: `defined(email)`,
  },
] as const

export type SegmentValue = (typeof SEGMENTS)[number]['value']

// ── Campaign schema ───────────────────────────────────────────────────────────
export const campaign = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  groups: [
    { name: 'content',   title: 'Content',   default: true },
    { name: 'audience',  title: 'Audience' },
    { name: 'meta',      title: 'Status' },
  ],
  fields: [
    // ── Inbox ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'subject',
      title: 'Subject line',
      type: 'string',
      group: 'content',
      description: 'What recipients see as the email subject.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'previewText',
      title: 'Preview text',
      type: 'string',
      group: 'content',
      description: 'Grey snippet next to the subject in the inbox (max ~90 chars).',
    }),

    // ── Body ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
      description: 'Large heading at the top of the email.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Optional — appears above the text.',
    }),
    defineField({
      name: 'body',
      title: 'Body text',
      type: 'text',
      rows: 8,
      group: 'content',
      description: 'Plain text — line breaks are respected.',
    }),

    // ── CTA ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'buttonText',
      title: 'Button text',
      type: 'string',
      group: 'content',
      description: 'E.g. "View the collection" or "Shop now"',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Button URL',
      type: 'url',
      group: 'content',
    }),

    // ── Extra sections ────────────────────────────────────────────────────────
    defineField({
      name: 'sections',
      title: 'Extra sections',
      type: 'array',
      group: 'content',
      description: 'Add extra content blocks below the first section (e.g. Spin the wheel, Zines).',
      of: [
        {
          type: 'object',
          name: 'emailSection',
          preview: {
            select: { title: 'heading' },
            prepare: ({ title }: { title?: string }) => ({ title: title ?? '— section —' }),
          },
          fields: [
            defineField({ name: 'heading',    title: 'Heading',      type: 'string' }),
            defineField({ name: 'image',      title: 'Image',        type: 'image', options: { hotspot: true } }),
            defineField({ name: 'body',       title: 'Body text',    type: 'text', rows: 5 }),
            defineField({ name: 'buttonText', title: 'Button text',  type: 'string' }),
            defineField({ name: 'buttonUrl',  title: 'Button URL',   type: 'url' }),
          ],
        },
      ],
    }),

    // ── Calendar event (optional) ─────────────────────────────────────────────
    defineField({
      name: 'calendarEvent',
      title: 'Calendar event (optional)',
      type: 'object',
      group: 'content',
      description: 'Add an "Add to calendar" button — useful for opening or event emails.',
      fields: [
        defineField({ name: 'eventTitle',    title: 'Title',               type: 'string' }),
        defineField({ name: 'startDate',     title: 'Date',                type: 'date' }),
        defineField({ name: 'startTime',     title: 'Start time (HH:MM)',  type: 'string', description: 'E.g. 18:00' }),
        defineField({ name: 'endTime',       title: 'End time (HH:MM)',    type: 'string', description: 'E.g. 21:00' }),
        defineField({ name: 'eventLocation', title: 'Location',            type: 'string' }),
        defineField({ name: 'eventUrl',      title: 'Link (optional)',      type: 'url' }),
      ],
    }),

    // ── Audience ──────────────────────────────────────────────────────────────
    defineField({
      name: 'segment',
      title: 'Audience',
      type: 'string',
      group: 'audience',
      options: {
        list: SEGMENTS.map(({ value, title }) => ({ value, title })),
        layout: 'radio',
      },
      initialValue: 'newsletter',
      validation: (r) => r.required(),
    }),

    // ── Status (readonly, filled in after sending) ────────────────────────────
    defineField({
      name: 'sentAt',
      title: 'Sent on',
      type: 'datetime',
      group: 'meta',
      readOnly: true,
    }),
    defineField({
      name: 'recipientCount',
      title: 'Recipient count',
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
        ? `✅ Sent (${count ?? '?'} recipients)`
        : '📝 Draft'
      return {
        title: title ?? '—',
        subtitle: `${status} · ${segLabel}`,
      }
    },
  },
})

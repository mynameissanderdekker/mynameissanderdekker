import { defineField, defineType } from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  preview: {
    select: { title: 'title', media: 'coverImage', subtitle: 'dateRange' },
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'series',
      type: 'reference',
      title: 'Series',
      to: [{ type: 'projectSeries' }],
    }),
    defineField({ name: 'year', type: 'number', title: 'Year' }),
    defineField({
      name: 'dateRange',
      title: 'Date range',
      description: 'E.g. "2021 – 2025" — shown instead of year',
      type: 'string',
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      title: 'Cover image',
      options: { hotspot: true },
    }),

    // ── Page layout ───────────────────────────────────────────────────────────
    defineField({
      name: 'isPage',
      title: 'Has full page layout',
      description: 'Makes this project visible under Pages in Studio',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'topVideoUrl',
      title: 'Top video URL',
      description: 'MP4 URL shown at the top of the page (above the title)',
      type: 'url',
    }),

    // ── Intro text ────────────────────────────────────────────────────────────
    defineField({
      name: 'description',
      type: 'array',
      title: 'Intro text',
      of: [{ type: 'block' }],
    }),

    // ── Zines (for The Zine Project) ──────────────────────────────────────────
    defineField({
      name: 'zines',
      title: 'Zines',
      description: 'List of zines shown on this page — featured zines appear in the top grid with a link',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'zineItem',
          preview: {
            select: { title: 'title', number: 'number', media: 'coverImage' },
            prepare({ title, number, media }) {
              return { title: [number, title].filter(Boolean).join(' — '), media }
            },
          },
          fields: [
            defineField({ name: 'number', title: 'Number (e.g. Nº2)', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
            defineField({ name: 'meta', title: 'Meta (date · edition)', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
            defineField({
              name: 'coverImage',
              title: 'Cover image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'coverImageUrl',
              title: 'Cover image URL (fallback)',
              description: 'External URL if no Sanity image uploaded yet',
              type: 'url',
            }),
            defineField({
              name: 'featured',
              title: 'Featured',
              description: 'Show in the top featured grid with a "Read the zine" link',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'projectSlug',
              title: 'Links to project slug',
              description: 'E.g. "girls-in-paris" — leave empty if no project page exists',
              type: 'string',
            }),
          ],
        },
      ],
    }),

    // ── Gallery images ────────────────────────────────────────────────────────
    defineField({
      name: 'images',
      type: 'array',
      title: 'Exhibition / gallery images',
      description: 'Shown below the zines grid',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),

    // ── Closing ───────────────────────────────────────────────────────────────
    defineField({
      name: 'closingVideoUrl',
      title: 'Closing video URL',
      description: 'MP4 URL shown at the bottom of the page',
      type: 'url',
    }),

    // ── Settings ──────────────────────────────────────────────────────────────
    defineField({
      name: 'highlighted',
      type: 'boolean',
      title: 'Homepage highlight',
      initialValue: false,
    }),
    defineField({ name: 'order', type: 'number', title: 'Sort order' }),
  ],
})

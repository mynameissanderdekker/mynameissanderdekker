import { defineField, defineType } from 'sanity'
import { ALL_PAGE_BLOCKS } from './pageBlocks'
import { CvLinkedExhibitionsInput } from '../components/CvLinkedExhibitionsInput'

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
      name: 'cvTitle',
      type: 'string',
      title: 'CV title (optional)',
      description: 'Alternate name shown on the CV page. If empty, the regular Title is used.',
    }),
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
      hidden: ({ document }) => document?.isPage === true,
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      title: 'Cover image',
      description: 'Thumbnail used in project grids and listings. Not shown on the project page itself — use a Hero Image or Video block in Page content for the page header.',
      options: { hotspot: true },
    }),

    // ── Page layout ───────────────────────────────────────────────────────────
    defineField({
      name: 'isPage',
      title: 'Has own page',
      description: 'When enabled, this project gets a dedicated page at /projects/[slug]. Without this, the project only appears in listings and grids — the URL does not exist.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'hideFromNav',
      title: 'Hide from navigation',
      description: 'When checked, this project will not appear in the PROJECTS dropdown nav',
      type: 'boolean',
      initialValue: false,
    }),

    // ── Page builder ─────────────────────────────────────────────────────────
    defineField({
      name: 'pageBuilder',
      title: 'Page content',
      description: 'Build the page by adding and reordering blocks. Tip: start with a Video or Hero Image block, followed by a Text block for the intro.',
      type: 'array',
      of: ALL_PAGE_BLOCKS,
    }),

    // ── Linked content ────────────────────────────────────────────────────────
    defineField({
      name: 'artworkSeries',
      title: 'Artworks from series',
      description: 'Select a Project Series — create new ones via Studio → Project Series',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'exhibitions',
      title: 'Exhibitions / Art fairs',
      description: 'Automatically shows all exhibitions and art fairs linked to this project via the "CV — Project" field.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }, { type: 'artFair' }], options: { disableNew: true } }],
      readOnly: true,
      components: { input: CvLinkedExhibitionsInput },
    }),
    // Press is maintained from the Press document side (press.projects[]).
    // There is no press field here to avoid duplication and sync issues.

    // ── SEO ───────────────────────────────────────────────────────────────────
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      description: 'Short description for Google and social sharing (max. 160 characters). Leave empty to fall back to a generated description.',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'startYear',
      title: 'Start year',
      type: 'number',
      description: 'Year the project started — used in structured data.',
    }),
    defineField({
      name: 'endYear',
      title: 'End year',
      type: 'number',
      description: 'Year the project ended (leave empty if ongoing).',
    }),

    // ── Settings ──────────────────────────────────────────────────────────────
    defineField({
      name: 'highlighted',
      type: 'boolean',
      title: 'Homepage highlight',
      initialValue: false,
      hidden: ({ document }) => document?.isPage === true,
    }),
    defineField({ name: 'order', type: 'number', title: 'Sort order' }),
  ],
})

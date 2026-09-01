import { defineField, defineType } from 'sanity'
import { ShareArtFairRoomLink } from '../components/ShareRoomLink'

export const artFair = defineType({
  name: 'artFair',
  title: 'Art Fair',
  type: 'document',
  // Begin- en einddatum horen bij elkaar en passen naast elkaar.
  fieldsets: [
    { name: 'dates', title: ' ', options: { columns: 2, collapsible: false } },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'E.g. "Art Rotterdam 2026"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fair',
      title: 'Fair name',
      type: 'string',
      description: 'E.g. "Art Rotterdam"',
    }),
    defineField({
      name: 'booth',
      title: 'Stand / Booth',
      type: 'string',
      description: 'E.g. "Booth A12" or "Gallery Torch"',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'E.g. "Rotterdam, NL"',
    }),
    defineField({
      name: 'startDate',
      fieldset: 'dates',
      title: 'Start date',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      fieldset: 'dates',
      title: 'End date',
      type: 'date',
    }),
    defineField({
      name: 'images',
      title: 'Booth / installation photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'cvProject',
      title: 'CV — Project',
      type: 'reference',
      to: [{ type: 'project' }],
      options: { disableNew: true },
      description: 'Which project does this art fair belong to? Used to group entries on the CV.',
    }),
    defineField({
      name: 'showInCV',
      title: 'Show in CV',
      type: 'boolean',
      initialValue: false,
      description: 'Include this art fair in the CV on the About page.',
    }),
    defineField({
      name: 'hasPage',
      title: 'Has own page',
      description: 'When enabled, this art fair gets a dedicated page and the listing becomes a clickable link.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      description: 'Link to the fair or gallery website',
      type: 'url',
    }),
    defineField({
      name: 'artworkSeries',
      title: 'Artworks from series',
      description: 'Select a Series — all works in that series are shown at this fair',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'artworks',
      title: 'Individual artworks',
      description: 'Add specific works not covered by a series above',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
    }),
    defineField({
      name: 'press',
      title: 'Press',
      description: 'Select press articles about this fair — create new ones via Studio → Press',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'press' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'roomLink',
      title: 'Deel prijslijst met klant',
      type: 'string',
      readOnly: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { field: ShareArtFairRoomLink as any },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      location: 'location',
      startDate: 'startDate',
      media: 'images.0',
    },
    prepare({ title, location, startDate, media }) {
      const year = startDate ? new Date(startDate).getFullYear() : '?'
      return {
        title: title ?? '—',
        subtitle: `${location ?? ''} (${year})`,
        media,
      }
    },
  },
})

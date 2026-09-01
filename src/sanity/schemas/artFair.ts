import { defineField, defineType } from 'sanity'
import { ShareArtFairRoomLink } from '../components/ShareRoomLink'

export const artFair = defineType({
  name: 'artFair',
  title: 'Art Fair',
  type: 'document',
  // Begin- en einddatum horen bij elkaar en passen naast elkaar.
  // Zelfde tabbladen als de expositie, zodat de twee naast elkaar te lezen zijn.
  // De betekenis blijft verschillend: een expositie is een verhaal met ruimte,
  // een beurs een etalage — vandaar dat het twee types blijven.
  groups: [
    { name: 'details',      title: 'Details', default: true },
    { name: 'artworks',     title: 'Artworks' },
    { name: 'installation', title: 'Installation' },
    { name: 'share',        title: 'Share' },
    { name: 'cv',           title: 'CV' },
  ],
  fieldsets: [
    { name: 'announce', title: ' ', options: { columns: 2, collapsible: false } },
    { name: 'dates', title: ' ', options: { columns: 2, collapsible: false } },
  ],
  fields: [
    defineField({
      name: 'name',
      group: 'details',
      title: 'Name',
      type: 'string',
      description: 'E.g. "Art Rotterdam 2026"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      group: 'details',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fair',
      group: 'details',
      title: 'Fair name',
      type: 'string',
      description: 'E.g. "Art Rotterdam"',
    }),
    defineField({
      name: 'booth',
      group: 'details',
      title: 'Stand / Booth',
      type: 'string',
      description: 'E.g. "Booth A12" or "Gallery Torch"',
    }),
    defineField({
      name: 'location',
      group: 'details',
      title: 'Location',
      type: 'string',
      description: 'E.g. "Rotterdam, NL"',
    }),
    defineField({
      name: 'startDate',
      group: 'details',
      fieldset: 'dates',
      title: 'Start date',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      group: 'details',
      fieldset: 'dates',
      title: 'End date',
      type: 'date',
    }),
    defineField({
      // Zelfde aankondiging als bij de expositie. Een beurs is bij uitstek iets
      // wat je vooraf meldt — hij duurt vier dagen, dus achteraf heeft niemand
      // er meer iets aan.
      name: 'showOnHomepage',
      group: 'details',
      title: 'Announce on the homepage',
      type: 'boolean',
      initialValue: false,
      description: 'Shows a pop-up to visitors, once each. Set the period below.',
    }),
    defineField({
      name: 'announceFrom',
      group: 'details',
      fieldset: 'announce',
      title: 'Pop-up from',
      type: 'date',
      hidden: ({ document }) => !document?.showOnHomepage,
      description: 'Leave empty to start right away.',
    }),
    defineField({
      name: 'announceUntil',
      group: 'details',
      fieldset: 'announce',
      title: 'Pop-up until',
      type: 'date',
      hidden: ({ document }) => !document?.showOnHomepage,
      description: 'Leave empty to keep showing it until you switch it off.',
    }),
    defineField({
      name: 'images',
      group: 'installation',
      title: 'Booth / installation photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'cvProject',
      group: 'cv',
      title: 'CV — Project',
      type: 'reference',
      to: [{ type: 'project' }],
      options: { disableNew: true },
      description: 'Which project does this art fair belong to? Used to group entries on the CV.',
    }),
    defineField({
      name: 'showInCV',
      group: 'cv',
      title: 'Show in CV',
      type: 'boolean',
      initialValue: false,
      description: 'Include this art fair in the CV on the About page.',
    }),
    defineField({
      name: 'hasPage',
      group: 'details',
      title: 'Has own page',
      description: 'When enabled, this art fair gets a dedicated page and the listing becomes a clickable link.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'websiteUrl',
      group: 'details',
      title: 'Website URL',
      description: 'Link to the fair or gallery website',
      type: 'url',
    }),
    defineField({
      name: 'artworkSeries',
      group: 'artworks',
      title: 'Artworks from series',
      description: 'Select a Series — all works in that series are shown at this fair',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'artworks',
      group: 'artworks',
      title: 'Individual artworks',
      description: 'Add specific works not covered by a series above',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }],
    }),
    defineField({
      name: 'press',
      group: 'share',
      title: 'Press',
      description: 'Select press articles about this fair — create new ones via Studio → Press',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'press' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'notes',
      group: 'details',
      title: 'Notes',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'roomLink',
      group: 'share',
      title: 'Share with client',
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

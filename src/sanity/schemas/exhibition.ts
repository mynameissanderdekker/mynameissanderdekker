import { defineField, defineType } from 'sanity'
import { ShareExhibitionRoomLink } from '../components/ShareRoomLink'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  orderings: [
    {
      title: 'Year (newest first)',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'Year (oldest first)',
      name: 'startDateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
  ],
  // Begin- en einddatum horen bij elkaar en passen naast elkaar.
  fieldsets: [
    { name: 'dates', title: ' ', options: { columns: 2, collapsible: false } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery / Venue',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'E.g. "Amsterdam, NL"',
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
      name: 'exhibitionType',
      title: 'Exhibition type',
      type: 'string',
      options: {
        list: [
          { title: 'Solo exhibition', value: 'solo' },
          { title: 'Duo exhibition', value: 'duo' },
          { title: 'Group exhibition', value: 'group' },
          { title: 'Permanent installation', value: 'permanent' },
          { title: 'Special project', value: 'special' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'cvProject',
      title: 'CV — Project',
      type: 'reference',
      to: [{ type: 'project' }],
      options: { disableNew: true },
      description: 'Which project does this exhibition belong to? Used to group exhibitions on the CV.',
    }),
    defineField({
      name: 'showInCV',
      title: 'Show in CV',
      type: 'boolean',
      initialValue: false,
      description: 'Include this exhibition in the CV on the About page.',
    }),
    defineField({
      name: 'hasPage',
      title: 'Has own page',
      description: 'When enabled, this exhibition gets a dedicated page and the listing becomes a clickable link.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'images',
      title: 'Installation photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'artworkSeries',
      title: 'Artworks from series',
      description: 'Select a Project Series — create new ones via Studio → Project Series',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectSeries' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'artworks',
      title: 'Individual artworks',
      description: 'Add specific artworks not covered by a series above — create new ones via Studio → Artworks',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'press',
      title: 'Press',
      description: 'Press articles about this exhibition. Tip: also link from the Press document itself (press.exhibitions[]) — keep both in sync.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'press' }], options: { disableNew: true } }],
    }),
    defineField({
      name: 'roomLink',
      title: 'Deel prijslijst met klant',
      type: 'string',
      readOnly: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { field: ShareExhibitionRoomLink as any },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      gallery: 'gallery',
      startDate: 'startDate',
      exhibitionType: 'exhibitionType',
      isSolo: 'isSolo',
      media: 'images.0',
    },
    prepare({ title, gallery, startDate, exhibitionType, isSolo, media }) {
      const year = startDate ? new Date(startDate).getFullYear() : '?'
      const typeLabels: Record<string, string> = {
        solo: 'Solo', duo: 'Duo', group: 'Group',
        permanent: 'Permanent', special: 'Special',
      }
      const typeLabel = exhibitionType ? typeLabels[exhibitionType] : (isSolo ? 'Solo' : '')
      return {
        title: title ?? '—',
        subtitle: `${typeLabel ? typeLabel + ' — ' : ''}${gallery ?? ''} (${year})`,
        media,
      }
    },
  },
})

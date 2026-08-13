import { defineField, defineType } from 'sanity'

export const loan = defineType({
  name: 'loan',
  title: 'Loan',
  type: 'document',
  preview: {
    select: {
      artworkTitle: 'artwork.title',
      locationName: 'location.name',
      status:       'status',
      startDate:    'startDate',
    },
    prepare({ artworkTitle, locationName, status, startDate }: {
      artworkTitle?: string
      locationName?: string
      status?: string
      startDate?: string
    }) {
      const statusLabel: Record<string, string> = {
        active:    '🟢 Active',
        returned:  '✓ Returned',
        cancelled: '✗ Cancelled',
      }
      const year = startDate ? new Date(startDate).getFullYear() : null
      return {
        title: artworkTitle || 'Untitled artwork',
        subtitle: [locationName, year, statusLabel[status ?? ''] ?? status].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    { title: 'Start date (newest)', name: 'startDateDesc', by: [{ field: 'startDate', direction: 'desc' }] },
    { title: 'Status',              name: 'statusAsc',     by: [{ field: 'status',    direction: 'asc'  }] },
  ],
  fields: [
    // ── Artwork ────────────────────────────────────────────────────────────────
    defineField({
      name: 'artwork',
      title: 'Artwork',
      type: 'reference',
      to: [{ type: 'artwork' }],
      validation: Rule => Rule.required(),
    }),

    // ── Destination ────────────────────────────────────────────────────────────
    defineField({
      name: 'location',
      title: 'Loaned to',
      type: 'reference',
      to: [{ type: 'location' }],
      validation: Rule => Rule.required(),
    }),

    // ── Details ────────────────────────────────────────────────────────────────
    defineField({
      name: 'purpose',
      title: 'Purpose',
      type: 'string',
      options: {
        list: [
          { title: 'Exhibition',  value: 'exhibition' },
          { title: 'Art Fair',    value: 'artfair' },
          { title: 'Approval',    value: 'approval' },
          { title: 'Long-term loan', value: 'longterm' },
          { title: 'Other',       value: 'other' },
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'endDate',
      title: 'Return date (expected)',
      type: 'date',
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          { title: '🟢 Active',    value: 'active' },
          { title: '✓ Returned',   value: 'returned' },
          { title: '✗ Cancelled',  value: 'cancelled' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    }),

    // ── Condition ──────────────────────────────────────────────────────────────
    defineField({
      name: 'conditionAtLoan',
      title: 'Condition at loan',
      description: 'Describe the condition of the work when it left.',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'conditionAtReturn',
      title: 'Condition at return',
      description: 'Describe the condition of the work when it came back.',
      type: 'text',
      rows: 4,
    }),

    // ── Notes ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
    }),
  ],
})

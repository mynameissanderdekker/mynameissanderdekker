import { defineField, defineType } from 'sanity'
import { ShareProposalLink } from '../components/ShareProposalLink'
import { ProposalCompletion } from '../components/ProposalCompletion'
import { AutoProposalNumber } from '../components/AutoProposalNumber'

export const proposal = defineType({
  name: 'proposal',
  title: 'Proposal',
  type: 'document',
  fields: [
    // Bovenaan: wat er nog moet gebeuren. Een offerte doorloopt drie dingen —
    // hij gaat naar de klant, de klant reageert, en bij een ja wordt het een
    // verkoop. Zelfde vorm als het paneel op de order.
    defineField({
      name: 'completion',
      title: 'To do',
      type: 'string',
      readOnly: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { field: ProposalCompletion as any },
    }),
    defineField({
      // Deelt zijn reeks met de facturen: PROP-SDK-26-001 wordt SDK-26-001
      // zodra de offerte een verkoop wordt.
      name: 'proposalNumber',
      title: 'Proposal number',
      type: 'string',
      description: 'E.g. PROP-SDK-26-001. Shares its sequence with invoices.',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { input: AutoProposalNumber as any },
    }),
    defineField({
      name: 'title',
      title: 'Proposal title',
      type: 'string',
      description: 'E.g. "Selection for Jan — October 2026"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'contact',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'contact' }],
      options: { disableNew: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Draft',    value: 'draft'    },
          { title: 'Sent',     value: 'sent'     },
          { title: 'Accepted', value: 'accepted' },
          { title: 'Declined', value: 'declined' },
          { title: 'Expired',  value: 'expired'  },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'expiryDate',
      title: 'Valid until',
      type: 'date',
      description: 'Leave empty for no expiry',
    }),
    defineField({
      name: 'message',
      title: 'Personal message',
      description: 'Shown at the top of the proposal — optional intro for the client',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'items',
      title: 'Artworks',
      type: 'array',
      of: [
        defineField({
          type: 'object',
          name: 'proposalItem',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Artwork',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'priceOverride',
              // Exclusief, net als op de prijslijst en in de verkooptool. Stond
              // hier als inclusief; dat maakte hetzelfde veld in de twee
              // templates twee verschillende dingen. Nul offertes in de data,
              // dus er viel niets om te migreren.
              title: 'Price override (€ excl. BTW)',
              description: 'Leave empty to use the artwork\'s standard price',
              type: 'number',
            }),
            defineField({
              name: 'note',
              title: 'Note for client',
              type: 'string',
              description: 'E.g. "Available from November"',
            }),
            defineField({
              name: 'showPrice',
              title: 'Show price',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              title: 'artwork.title',
              year: 'artwork.year',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              media: 'artwork.images.0' as any,
              price: 'priceOverride',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prepare({ title, year, media, price }: any) {
              return {
                title: title || '—',
                subtitle: [year, price != null ? `€ ${price.toLocaleString('nl-NL')}` : null].filter(Boolean).join(' · '),
                media,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'clientLocation',
      title: 'Client location (BTW)',
      type: 'string',
      initialValue: 'nl',
      options: {
        list: [
          { title: 'Netherlands (incl. BTW)', value: 'nl' },
          { title: 'EU (excl. BTW)', value: 'eu' },
          { title: 'Outside EU (0%)', value: 'export' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      initialValue: 'nl',
      options: {
        list: [
          { title: 'Dutch (NL)', value: 'nl' },
          { title: 'English (EN)', value: 'en' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'internalNote',
      title: 'Internal note (not shown to client)',
      type: 'string',
    }),
    defineField({
      name: 'shareLink',
      title: 'Deel met klant',
      type: 'string',
      readOnly: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { field: ShareProposalLink as any },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      contactFirst: 'contact.firstName',
      contactLast: 'contact.lastName',
      contactCompany: 'contact.company',
      status: 'status',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare({ title, contactFirst, contactLast, contactCompany, status }: any) {
      const client = contactCompany || `${contactFirst ?? ''} ${contactLast ?? ''}`.trim() || 'Unknown client'
      const STATUS: Record<string, string> = { draft: '⬜ Draft', sent: '📤 Sent', accepted: '✅ Accepted', declined: '❌ Declined', expired: '⏰ Expired' }
      return {
        title: title || client,
        subtitle: [client, STATUS[status] ?? status].filter(Boolean).join(' · '),
      }
    },
  },
})

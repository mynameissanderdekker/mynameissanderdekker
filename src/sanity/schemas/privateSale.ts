import { defineField, defineType } from 'sanity'
import { randomBytes } from 'crypto'

function generateToken() {
  try {
    return randomBytes(16).toString('hex')
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  }
}

export const privateSale = defineType({
  name: 'privateSale',
  title: 'Private Sale',
  type: 'document',
  preview: {
    select: {
      title: 'title',
      clientName: 'clientName',
      isActive: 'isActive',
    },
    prepare({ title, clientName, isActive }) {
      return {
        title: title || 'Untitled',
        subtitle: [clientName, isActive ? 'Active' : 'Inactive'].filter(Boolean).join(' · '),
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Internal name for this selection (not shown to client)',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    // ── Client ──────────────────────────────────────────────────────────────
    defineField({
      name: 'clientName',
      title: 'Client name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'clientEmail',
      title: 'Client email',
      type: 'string',
    }),

    // ── Access ──────────────────────────────────────────────────────────────
    defineField({
      name: 'token',
      title: 'Access token',
      description: 'Auto-generated unique URL token — share as /private-sales/[token]',
      type: 'string',
      readOnly: true,
      initialValue: () => generateToken(),
    }),
    defineField({
      name: 'password',
      title: 'Password (optional)',
      description: 'If set, client must enter this before viewing the selection',
      type: 'string',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires at',
      description: 'Leave empty for no expiry',
      type: 'datetime',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      description: 'Inactive selections return a 404',
      type: 'boolean',
      initialValue: true,
    }),

    // ── Artworks ─────────────────────────────────────────────────────────────
    defineField({
      name: 'artworks',
      title: 'Artworks',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'privateSaleItem',
          preview: {
            select: {
              title: 'artwork.title',
              year: 'artwork.year',
              priceOverride: 'priceOverride',
            },
            prepare({ title, year, priceOverride }) {
              return {
                title: title || 'Untitled',
                subtitle: [year, priceOverride != null ? `€${priceOverride}` : 'catalogue price'].filter(Boolean).join(' · '),
              }
            },
          },
          fields: [
            defineField({
              name: 'artwork',
              title: 'Artwork',
              type: 'reference',
              to: [{ type: 'artwork' }],
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'priceOverride',
              title: 'Price override (€)',
              description: 'Leave empty to use the artwork\'s catalogue price',
              type: 'number',
            }),
            defineField({
              name: 'note',
              title: 'Note',
              description: 'Optional note shown below this artwork on the client page',
              type: 'text',
              rows: 2,
            }),
          ],
        },
      ],
    }),

    // ── Message ───────────────────────────────────────────────────────────────
    defineField({
      name: 'introText',
      title: 'Intro text',
      description: 'Personal message shown at the top of the client page',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'footerText',
      title: 'Footer text',
      description: 'Shown at the bottom (e.g. contact details, payment terms)',
      type: 'text',
      rows: 3,
    }),
  ],
})

import { defineField, defineType } from 'sanity'
import { CompactDimensions } from '../components/CompactDimensions'
import { CategoryInput } from '../components/CategoryInput'
import { ArtworkQRCode } from '../components/ArtworkQRCode'
import { ArtworkBuyers } from '../components/ArtworkBuyers'

// ── Main artwork schema ───────────────────────────────────────────────────────
export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  groups: [
    { name: 'info',       title: 'Informatie',      default: true },
    { name: 'edition',    title: 'Editie & Verkoop' },
    { name: 'context',    title: 'Context' },
    { name: 'visibility', title: 'Webshop' },
  ],
  fields: [
    // ── Informatie ────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'info',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categorie',
      type: 'string',
      group: 'info',
      components: { input: CategoryInput },
    }),
    defineField({
      name: 'year',
      title: 'Jaar',
      type: 'number',
      group: 'info',
      validation: (r) => r.required().min(1900).max(2100),
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
      group: 'info',
      description: 'Bijv. "Lambda print op dibond, ingelijst"',
    }),
    defineField({
      name: 'dimensions',
      title: 'Afmetingen (cm)',
      type: 'object',
      group: 'info',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm',  title: 'Breedte', type: 'number' }),
        defineField({ name: 'heightCm', title: 'Hoogte',  type: 'number' }),
        defineField({ name: 'depthCm',  title: 'Diepte',  type: 'number' }),
      ],
    }),
    defineField({
      name: 'qrCode',
      title: 'QR Code',
      type: 'string',
      group: 'info',
      readOnly: true,
      components: { field: ArtworkQRCode },
    }),
    defineField({
      name: 'isbn',
      title: 'ISBN',
      type: 'string',
      group: 'info',
      description: 'Alleen voor boeken/publicaties — bijv. 978-90-123456-7-8',
      hidden: ({ document }) => {
        const cat = ((document?.category as string) ?? '').toLowerCase()
        return !cat.includes('book') && !cat.includes('publicat')
      },
    }),
    defineField({
      name: 'weightKg',
      title: 'Gewicht (kg)',
      type: 'number',
      group: 'info',
      description: 'Voor verzendkostenberekening',
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'array',
      group: 'info',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'images',
      title: 'Afbeeldingen',
      type: 'array',
      group: 'info',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Eerste afbeelding = hoofdfoto',
    }),

    // ── Editie & Verkoop ──────────────────────────────────────────────────────
    defineField({
      name: 'editionTotal',
      title: 'Editie totaal',
      type: 'number',
      group: 'edition',
      description: 'Bijv. 7 (voor een editie van 7 + 2 AP)',
    }),
    defineField({
      name: 'editionAP',
      title: 'Artist Proofs (AP)',
      type: 'number',
      group: 'edition',
      description: 'Bijv. 2',
      initialValue: 0,
    }),
    defineField({
      name: 'priceExclVAT',
      title: 'Prijs (excl. BTW)',
      type: 'number',
      group: 'edition',
    }),
    defineField({
      name: 'vatRate',
      title: 'BTW percentage',
      type: 'number',
      group: 'edition',
      description: 'Bijv. 9 of 21',
      options: {
        list: [
          { title: '9%', value: 9 },
          { title: '21%', value: 21 },
          { title: '0% (export)', value: 0 },
        ],
      },
      initialValue: 9,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'edition',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Sold Out', value: 'sold_out' },
          { title: 'On Loan', value: 'on_loan' },
          { title: 'Not for Sale', value: 'not_for_sale' },
          { title: 'Enquire', value: 'enquire' },
        ],
        layout: 'radio',
      },
      initialValue: 'enquire',
    }),
    defineField({
      name: 'additionalStatusInfo',
      title: 'Extra statusinformatie (privé)',
      type: 'string',
      group: 'edition',
      description: 'Bijv. "Verkocht aan museum X" — nooit zichtbaar op de site',
    }),
    defineField({
      name: 'buyers',
      title: 'Kopers',
      type: 'string',
      group: 'edition',
      components: { input: ArtworkBuyers },
    }),

    // ── Context ───────────────────────────────────────────────────────────────
    defineField({
      name: 'exhibitions',
      title: 'Exposities',
      type: 'array',
      group: 'context',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }] }],
    }),
    defineField({
      name: 'artFairs',
      title: 'Art Fairs',
      type: 'array',
      group: 'context',
      of: [{ type: 'reference', to: [{ type: 'artFair' }] }],
    }),

    // ── Webshop ───────────────────────────────────────────────────────────────
    // Volgorde: Sell in webshop → View on wall → Uitgelicht → PNG → Afmetingen → Koop-link
    defineField({
      name: 'showInWebshop',
      title: 'Sell in webshop',
      type: 'boolean',
      group: 'visibility',
      description: 'Aan = "Buy" knop (winkelmandje). Uit = "Enquire" knop (contactformulier).',
      initialValue: false,
    }),
    defineField({
      name: 'showViewInRoom',
      title: 'View on wall',
      type: 'boolean',
      group: 'visibility',
      description: 'Toon de "View on wall" knop op de artwork pagina.',
      initialValue: false,
    }),
    defineField({
      name: 'featured',
      title: 'Uitgelicht (op webshop)',
      type: 'boolean',
      group: 'visibility',
      initialValue: false,
    }),
    defineField({
      name: 'roomImage',
      title: 'View on wall — PNG uitsnede',
      type: 'image',
      group: 'visibility',
      description: 'Upload een PNG van het werk (incl. lijst/passe-partout) zónder achtergrond. Snij de afbeelding strak rondom het werk — geen vrije ruimte of witruimte buiten de rand.',
      options: { accept: 'image/png' },
    }),
    defineField({
      name: 'framedDimensions',
      title: 'Afmetingen incl. lijst/passe-partout (cm)',
      type: 'object',
      group: 'visibility',
      description: 'Voor "View on wall" — buitenmaat incl. lijst en passe-partout.',
      components: { input: CompactDimensions },
      fields: [
        defineField({ name: 'widthCm', title: 'Breedte', type: 'number' }),
      ],
    }),
    defineField({
      name: 'buyUrl',
      title: 'Koop-link',
      type: 'url',
      group: 'visibility',
      description: 'Directe betaallink (Mollie, Stripe, etc.) — verschijnt als "Buy" knop wanneer status "Available" is',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      year: 'year',
      media: 'images.0',
      status: 'status',
      editionTotal: 'editionTotal',
    },
    prepare({ title, year, media, status, editionTotal }) {
      const statusLabel: Record<string, string> = {
        available: 'Available',
        sold_out: 'Sold Out',
        on_loan: 'On Loan',
        not_for_sale: 'Not for Sale',
        enquire: 'Enquire',
      }
      const edition = editionTotal ? ` — Ed. ${editionTotal}` : ''
      return {
        title: title ?? '—',
        subtitle: `${statusLabel[status] ?? status ?? ''}${edition}`,
        media,
      }
    },
  },
})

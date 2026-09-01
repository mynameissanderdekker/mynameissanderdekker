import { defineField, defineType } from 'sanity'
import { CirclePhotoField } from '../components/CirclePhotoField'
import { InstagramLink } from '../components/InstagramLink'
import { PurchasesTotalField } from '../components/PurchasesTotalField'
import { EditionPickerInput } from '../components/EditionPickerInput'
import { ContactLinkedSelections } from '../components/ContactLinkedSelections'

export const contact = defineType({
  name: 'contact',
  title: 'Contact',
  type: 'document',
  groups: [
    // Zelfde vier tabs als in de gallery-template: wie het is, wat je met ze
    // hebt, of ze de nieuwsbrief krijgen, en wat ze gekocht hebben.
    { name: 'person',     title: 'Person',     default: true },
    { name: 'crm',        title: 'CRM' },
    { name: 'newsletter', title: 'Newsletter' },
    { name: 'history',    title: 'History' },
  ],
  fields: [
    // ── Person ────────────────────────────────────────────────────────────────
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'person',
      options: { hotspot: true },
      components: { field: CirclePhotoField },
    }),
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'person',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'company',
      title: 'Company / Gallery',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'vatNumber',
      title: 'BTW number',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      group: 'person',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      group: 'person',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'street',
      title: 'Street & number',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'postalCode',
      title: 'Postal code',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      group: 'person',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      group: 'person',
      description: 'ISO country code: NL, DE, FR, GB, US, BE, DK …',
      options: {
        list: [
          { title: 'Netherlands (NL)',         value: 'NL' },
          { title: 'Belgium (BE)',              value: 'BE' },
          { title: 'Germany (DE)',              value: 'DE' },
          { title: 'France (FR)',               value: 'FR' },
          { title: 'United Kingdom (GB)',       value: 'GB' },
          { title: 'United States (US)',        value: 'US' },
          { title: 'Denmark (DK)',              value: 'DK' },
          { title: 'Austria (AT)',              value: 'AT' },
          { title: 'Finland (FI)',              value: 'FI' },
          { title: 'Italy (IT)',                value: 'IT' },
          { title: 'Spain (ES)',                value: 'ES' },
          { title: 'Switzerland (CH)',          value: 'CH' },
          { title: 'Australia (AU)',            value: 'AU' },
          { title: 'Canada (CA)',               value: 'CA' },
          { title: 'Sweden (SE)',               value: 'SE' },
          { title: 'Norway (NO)',               value: 'NO' },
          { title: 'Portugal (PT)',             value: 'PT' },
          { title: 'Japan (JP)',                value: 'JP' },
        ],
      },
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
      group: 'person',
      description: 'Username without @, e.g. "sanderdekker"',
      components: { input: InstagramLink },
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'string',
      group: 'person',
      description: 'Username or full URL',
    }),
    // Bepaalt hoe de factuur de BTW toont. Zonder dit rekent elke factuur op
    // de Nederlandse manier, ook naar een Duitse klant met BTW-nummer.
    defineField({
      name: 'clientLocation',
      title: 'Invoice location',
      type: 'string',
      group: 'person',
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
      title: 'Preferred language',
      type: 'string',
      group: 'person',
      options: {
        list: [
          { title: 'Dutch', value: 'nl' },
          { title: 'English', value: 'en' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'invoiceLanguage',
      title: 'Invoice language',
      type: 'string',
      group: 'person',
      options: {
        list: [
          { title: 'Dutch (NL)', value: 'nl' },
          { title: 'English (EN)', value: 'en' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),

    // ── CRM ───────────────────────────────────────────────────────────────────
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'crm',
      of: [{ type: 'reference', to: [{ type: 'contactTag' }] }],
    }),
    defineField({
      name: 'type',
      title: 'Contact type',
      type: 'string',
      group: 'crm',
      options: {
        list: [
          { title: 'Collector',         value: 'collector' },
          { title: 'Webshop customer',  value: 'webshop_customer' },
          { title: 'Gallery',           value: 'gallery' },
          { title: 'Journalist',        value: 'journalist' },
          { title: 'Artist',            value: 'artist' },
          { title: 'Newsletter',        value: 'newsletter' },
          { title: 'Other',             value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'newsletter',
    }),
    defineField({
      // 'Contact type = gallery' is te grof: er staan ook galeries in de
      // nieuwsbrieflijst waar je nooit mee werkt. Dit vinkje maakt het verschil
      // tussen kennen en samenwerken, en vult de locatiekeuze op een expositie.
      name: 'worksWithMe',
      title: 'I work with this gallery',
      type: 'boolean',
      group: 'crm',
      initialValue: false,
      description: 'Shows up as a venue when you add an exhibition.',
      hidden: ({ document }) => document?.type !== 'gallery',
    }),
    defineField({
      name: 'notes',
      title: 'Notes (private)',
      type: 'text',
      rows: 3,
      group: 'crm',
    }),
    // Een voornemen dat alleen in je hoofd zit vergeet je. Zodra de datum
    // bereikt is verschijnt er een bolletje bij Contacts in de navigatie.
    defineField({
      name: 'followUpDate',
      title: 'Follow-up date',
      description: 'When to get back in touch with this contact',
      type: 'date',
      group: 'crm',
    }),
    defineField({
      name: 'followUpNote',
      title: 'Follow-up note',
      description: 'E.g. "Call about the large piece — he was still hesitating"',
      type: 'string',
      group: 'crm',
    }),
    defineField({
      name: 'wishlist',
      title: 'Wishlist',
      description: 'Works this contact has shown interest in',
      type: 'array',
      group: 'crm',
      of: [{
        type: 'object',
        name: 'wishlistItem',
        fields: [
          // De gallery-template heeft hier ook een kunstenaar-verwijzing; bij
          // één kunstenaar zegt die niets.
          defineField({ name: 'artwork', title: 'Artwork', type: 'reference', to: [{ type: 'artwork' }] }),
          defineField({ name: 'maxBudget', title: 'Max budget (€)', type: 'number' }),
          defineField({ name: 'note', title: 'Note', type: 'string', description: 'E.g. "Large formats only"' }),
        ],
        preview: {
          select: { artwork: 'artwork.title', note: 'note', budget: 'maxBudget' },
          prepare({ artwork, note, budget }: { artwork?: string; note?: string; budget?: number }) {
            const budgetLabel = budget != null ? `≤ €${budget.toLocaleString('nl-NL')}` : null
            return {
              title: artwork || note || 'Interest',
              subtitle: [artwork ? note : null, budgetLabel].filter(Boolean).join(' · '),
            }
          },
        },
      }],
    }),

    // ── Newsletter ────────────────────────────────────────────────────────────
    defineField({
      name: 'subscribed',
      title: 'Subscribed to newsletter',
      type: 'boolean',
      group: 'newsletter',
      initialValue: true,
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscription date',
      type: 'datetime',
      group: 'newsletter',
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Unsubscription date',
      type: 'datetime',
      group: 'newsletter',
    }),
    defineField({
      // Waar het contact vandaan komt en waar het in geïnteresseerd is, staan
      // bij Torch op CRM — het zegt iets over de relatie, niet over de
      // nieuwsbrief.
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'crm',
      description: 'E.g. "website signup", "Art Rotterdam 2026", "Added manually"',
    }),
    defineField({
      name: 'interests',
      title: 'Interests',
      type: 'array',
      group: 'crm',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Photography',     value: 'photography' },
          { title: 'Installations',   value: 'installation' },
          { title: 'Publications',    value: 'publications' },
          { title: 'Exhibitions',     value: 'exhibitions' },
          { title: 'Art Fairs',       value: 'artfairs' },
          { title: 'Studio updates',  value: 'studio' },
        ],
        layout: 'grid',
      },
    }),

    // ── Purchase history ──────────────────────────────────────────────────────
    defineField({
      name: 'purchases',
      title: 'Purchased works',
      type: 'array',
      group: 'history',
      components: { field: PurchasesTotalField },
      description: 'Links to edition records — overview of what this collector has purchased',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Work',
              type: 'reference',
              to: [{ type: 'artwork' }],
            }),
            defineField({
              name: 'copyNumber',
              title: 'Edition',
              type: 'string',
              description: 'Select the edition sold, e.g. "3/7" or "1/2 AP"',
              components: { input: EditionPickerInput },
            }),
            defineField({
              name: 'soldVia',
              title: 'Sold via',
              type: 'string',
              options: {
                list: [
                  { title: 'Webshop (online)',  value: 'webshop' },
                  { title: 'Direct (studio)',   value: 'direct' },
                  { title: 'Gallery',           value: 'gallery' },
                  { title: 'Art Fair',          value: 'artfair' },
                  { title: 'Other',             value: 'other' },
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'editionNumber',
              title: 'Order number',
              type: 'string',
              description: 'WooCommerce/Stripe reference, e.g. "Order #9139"',
            }),
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
            }),
            defineField({
              name: 'price',
              title: 'Sale price (excl. BTW)',
              type: 'number',
            }),
          ],
          preview: {
            select: {
              title: 'artwork.title',
              year:  'artwork.year',
              copy: 'copyNumber',
              via: 'soldVia',
              date: 'date',
            },
            prepare({ title, year, copy, via, date }) {
              const channel: Record<string, string> = {
                webshop: 'Webshop', direct: 'Direct', gallery: 'Gallery',
                artfair: 'Art Fair', other: 'Other',
              }
              return {
                title: `${title ?? '—'} (${year ?? '?'})`,
                subtitle: [copy, channel[via] ?? via, date].filter(Boolean).join(' · '),
              }
            },
          },
        },
      ],
    }),
    defineField({
      // Was een handmatige lijst, terwijl de viewing room en de private sale
      // zelf al naar dit contact verwijzen. Twee lijsten die je gelijk moet
      // houden lopen altijd uit elkaar — deze wordt nu afgeleid.
      name: 'linkedSelections',
      title: 'Viewing rooms & private sales',
      description: 'Linked from the viewing room or private sale itself — read-only.',
      type: 'string',
      group: 'history',
      readOnly: true,
      components: { input: ContactLinkedSelections },
    }),
  ],

  preview: {
    select: {
      first:   'firstName',
      last:    'lastName',
      email:   'email',
      type:    'type',
      sub:     'subscribed',
      city:    'city',
      country: 'country',
      media:   'photo',
    },
    prepare({ first, last, email, type, sub, city, country, media }) {
      const typeLabel: Record<string, string> = {
        collector: 'Collector', webshop_customer: 'Webshop customer', gallery: 'Gallery',
        journalist: 'Journalist', artist: 'Artist', newsletter: 'Newsletter', other: 'Other',
      }
      const location = [city, country].filter(Boolean).join(', ')
      const status = sub === false ? ' · Unsubscribed' : ''
      return {
        title: [first, last].filter(Boolean).join(' ') || email || '—',
        subtitle: `${typeLabel[type] ?? type ?? ''}${location ? ` · ${location}` : ''}${status}`,
        media,
      }
    },
  },
})

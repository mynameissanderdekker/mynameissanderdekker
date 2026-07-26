import { defineField, defineType } from 'sanity'
import { CirclePhotoField } from '../components/CirclePhotoField'
import { InstagramLink } from '../components/InstagramLink'
import { PurchasesTotalField } from '../components/PurchasesTotalField'

export const contact = defineType({
  name: 'contact',
  title: 'Contact',
  type: 'document',
  groups: [
    { name: 'info',      title: 'Persoon',    default: true },
    { name: 'history',   title: 'Geschiedenis' },
    { name: 'email',     title: 'E-mail' },
  ],
  fields: [
    // ── Persoon ───────────────────────────────────────────────────────────────
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      components: { field: CirclePhotoField },
    }),
    defineField({
      name: 'firstName',
      title: 'Voornaam',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Achternaam',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'company',
      title: 'Bedrijf / Galerie',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'email',
      title: 'E-mailadres',
      type: 'string',
      group: 'info',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Telefoon',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'street',
      title: 'Straat & huisnummer',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'postalCode',
      title: 'Postcode',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'city',
      title: 'Stad',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'country',
      title: 'Land',
      type: 'string',
      group: 'info',
      description: 'ISO-landcode: NL, DE, FR, GB, US, BE, DK …',
      options: {
        list: [
          { title: 'Nederland (NL)',              value: 'NL' },
          { title: 'België (BE)',                  value: 'BE' },
          { title: 'Duitsland (DE)',               value: 'DE' },
          { title: 'Frankrijk (FR)',               value: 'FR' },
          { title: 'Verenigd Koninkrijk (GB)',     value: 'GB' },
          { title: 'Verenigde Staten (US)',        value: 'US' },
          { title: 'Denemarken (DK)',              value: 'DK' },
          { title: 'Oostenrijk (AT)',              value: 'AT' },
          { title: 'Finland (FI)',                 value: 'FI' },
          { title: 'Italië (IT)',                  value: 'IT' },
          { title: 'Spanje (ES)',                  value: 'ES' },
          { title: 'Zwitserland (CH)',             value: 'CH' },
          { title: 'Australië (AU)',               value: 'AU' },
          { title: 'Canada (CA)',                  value: 'CA' },
          { title: 'Zweden (SE)',                  value: 'SE' },
          { title: 'Noorwegen (NO)',               value: 'NO' },
          { title: 'Portugal (PT)',                value: 'PT' },
          { title: 'Japan (JP)',                   value: 'JP' },
        ],
      },
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
      group: 'info',
      description: 'Gebruikersnaam zonder @, bijv. "sanderdekker"',
      components: { input: InstagramLink },
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'string',
      group: 'info',
      description: 'Gebruikersnaam of volledige URL',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      group: 'info',
    }),
    defineField({
      name: 'type',
      title: 'Type contact',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: 'Collector',       value: 'collector' },
          { title: 'Webshop klant',   value: 'webshop_customer' },
          { title: 'Gallery',         value: 'gallery' },
          { title: 'Journalist',      value: 'journalist' },
          { title: 'Kunstenaar',      value: 'artist' },
          { title: 'Nieuwsbrief',     value: 'newsletter' },
          { title: 'Anders',          value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'newsletter',
    }),
    defineField({
      name: 'notes',
      title: 'Notities (privé)',
      type: 'text',
      rows: 3,
      group: 'info',
    }),

    // ── E-mail voorkeuren ─────────────────────────────────────────────────────
    defineField({
      name: 'subscribed',
      title: 'Ingeschreven voor nieuwsbrief',
      type: 'boolean',
      group: 'email',
      initialValue: true,
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Inschrijfdatum',
      type: 'datetime',
      group: 'email',
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Uitschrijfdatum',
      type: 'datetime',
      group: 'email',
    }),
    defineField({
      name: 'source',
      title: 'Herkomst',
      type: 'string',
      group: 'email',
      description: 'Bijv. "website signup", "Art Rotterdam 2026", "Handmatig toegevoegd"',
    }),
    defineField({
      name: 'interests',
      title: 'Interesses',
      type: 'array',
      group: 'email',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Fotografie',      value: 'photography' },
          { title: 'Installaties',    value: 'installation' },
          { title: 'Publicaties',     value: 'publications' },
          { title: 'Exposities',      value: 'exhibitions' },
          { title: 'Art Fairs',       value: 'artfairs' },
          { title: 'Studio updates',  value: 'studio' },
        ],
        layout: 'grid',
      },
    }),

    // ── Aankoopgeschiedenis ───────────────────────────────────────────────────
    defineField({
      name: 'purchases',
      title: 'Gekochte werken',
      type: 'array',
      group: 'history',
      components: { field: PurchasesTotalField },
      description: 'Koppeling naar edition records — overzicht van wat deze collector heeft gekocht',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'artwork',
              title: 'Werk',
              type: 'reference',
              to: [{ type: 'artwork' }],
            }),
            defineField({
              name: 'copyNumber',
              title: 'Exemplaarnummer',
              type: 'string',
              description: 'Het fysieke exemplaar, bijv. "3/7" of "AP 1/2"',
            }),
            defineField({
              name: 'soldVia',
              title: 'Verkocht via',
              type: 'string',
              options: {
                list: [
                  { title: 'Webshop (online)',  value: 'webshop' },
                  { title: 'Direct (studio)',   value: 'direct' },
                  { title: 'Gallery',           value: 'gallery' },
                  { title: 'Art Fair',          value: 'artfair' },
                  { title: 'Anders',            value: 'other' },
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'editionNumber',
              title: 'Bestellingsnummer',
              type: 'string',
              description: 'WooCommerce/Stripe referentie, bijv. "Order #9139"',
            }),
            defineField({
              name: 'date',
              title: 'Datum',
              type: 'date',
            }),
            defineField({
              name: 'price',
              title: 'Verkoopprijs (excl. BTW)',
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
                artfair: 'Art Fair', other: 'Anders',
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
      name: 'viewingRooms',
      title: 'Viewing Rooms ontvangen',
      type: 'array',
      group: 'history',
      of: [{ type: 'reference', to: [{ type: 'viewingRoom' }] }],
      description: 'Welke private selecties zijn naar deze persoon gestuurd',
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
        collector: 'Collector', webshop_customer: 'Webshop klant', gallery: 'Gallery',
        journalist: 'Journalist', artist: 'Kunstenaar', newsletter: 'Nieuwsbrief', other: 'Anders',
      }
      const location = [city, country].filter(Boolean).join(', ')
      const status = sub === false ? ' · Uitgeschreven' : ''
      return {
        title: [first, last].filter(Boolean).join(' ') || email || '—',
        subtitle: `${typeLabel[type] ?? type ?? ''}${location ? ` · ${location}` : ''}${status}`,
        media,
      }
    },
  },
})

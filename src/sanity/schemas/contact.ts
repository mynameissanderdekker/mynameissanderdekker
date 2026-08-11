import { defineField, defineType } from 'sanity'
import { CirclePhotoField } from '../components/CirclePhotoField'
import { InstagramLink } from '../components/InstagramLink'
import { PurchasesTotalField } from '../components/PurchasesTotalField'
import { EditionPickerInput } from '../components/EditionPickerInput'

export const contact = defineType({
  name: 'contact',
  title: 'Contact',
  type: 'document',
  groups: [
    { name: 'info',      title: 'Person',    default: true },
    { name: 'history',   title: 'History' },
    { name: 'email',     title: 'Email' },
  ],
  fields: [
    // ── Person ────────────────────────────────────────────────────────────────
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      components: { field: CirclePhotoField },
    }),
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'company',
      title: 'Company / Gallery',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'vatNumber',
      title: 'BTW number',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      group: 'info',
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'street',
      title: 'Street & number',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'postalCode',
      title: 'Postal code',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      group: 'info',
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      group: 'info',
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
      group: 'info',
      description: 'Username without @, e.g. "sanderdekker"',
      components: { input: InstagramLink },
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'string',
      group: 'info',
      description: 'Username or full URL',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      group: 'info',
    }),
    defineField({
      name: 'type',
      title: 'Contact type',
      type: 'string',
      group: 'info',
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
      name: 'notes',
      title: 'Notes (private)',
      type: 'text',
      rows: 3,
      group: 'info',
    }),

    // ── Email preferences ─────────────────────────────────────────────────────
    defineField({
      name: 'subscribed',
      title: 'Subscribed to newsletter',
      type: 'boolean',
      group: 'email',
      initialValue: true,
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscription date',
      type: 'datetime',
      group: 'email',
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Unsubscription date',
      type: 'datetime',
      group: 'email',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'email',
      description: 'E.g. "website signup", "Art Rotterdam 2026", "Added manually"',
    }),
    defineField({
      name: 'interests',
      title: 'Interests',
      type: 'array',
      group: 'email',
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
      name: 'viewingRooms',
      title: 'Viewing Rooms received',
      type: 'array',
      group: 'history',
      of: [{ type: 'reference', to: [{ type: 'viewingRoom' }] }],
      description: 'Which private selections have been sent to this person',
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

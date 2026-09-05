import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Zelfde tabbladen als de gallery-template, zodat de twee naast elkaar te
  // leggen zijn. Eén verschil: hier zit het adres ín invoiceSettings, dus
  // Contact is geen apart tabblad — een groep geldt voor het hele object.
  groups: [
    { name: 'site',    title: 'Site', default: true },
    { name: 'appearance', title: 'Appearance' },
    { name: 'social',  title: 'Social'  },
    { name: 'contact', title: 'Locations' },
    { name: 'invoice', title: 'Invoice & business' },
    { name: 'legal',   title: 'Legal'   },
  ],
  fields: [
    {
      // Wat een kunstenaar zelf aan het uiterlijk mag veranderen, zonder code.
      // Elk veld is een CSS-variabele uit globals.css; leeg = zoals het thema
      // het zegt. Kort gehouden met opzet: accent, achtergrond, tekst en
      // hoeken vangen "kan het iets meer van ons zijn?" zonder dat iemand
      // de site onleesbaar kan maken. Lettertypen zijn het thema (moeten bij
      // het bouwen bekend zijn), lay-out is de core. Zie lib/appearance.ts.
      name: 'appearance',
      group: 'appearance',
      title: 'Appearance',
      type: 'object',
      description: 'Leave a field empty to keep the default. Changes are live within a few minutes.',
      options: { collapsible: false },
      fields: [
        {
          name: 'accentColor', title: 'Accent colour', type: 'string',
          description: 'Buttons and strong text. Hex, e.g. #111111.',
          validation: (Rule: any) => Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { name: 'hex colour', invert: false }).warning('Use a hex colour like #1a1a1a'),
        },
        {
          name: 'accentTextColor', title: 'Text on accent', type: 'string',
          description: 'Text colour on buttons. Usually white or black.',
          validation: (Rule: any) => Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).warning('Use a hex colour like #ffffff'),
        },
        {
          name: 'backgroundColor', title: 'Background', type: 'string',
          description: 'Page background. Hex.',
          validation: (Rule: any) => Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).warning('Use a hex colour like #fbfaf7'),
        },
        {
          name: 'textColor', title: 'Text colour', type: 'string',
          description: 'Body text and headings. Hex.',
          validation: (Rule: any) => Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).warning('Use a hex colour like #111111'),
        },
        {
          name: 'borderRadius', title: 'Corners', type: 'string',
          options: { list: [
            { title: 'Sharp (default)', value: 'none' },
            { title: 'Slightly rounded', value: 'small' },
            { title: 'Rounded', value: 'medium' },
            { title: 'Pill buttons', value: 'round' },
          ], layout: 'radio' },
        },
      ],
    },

    // ── Identity ────────────────────────────────────────────────────────────
    defineField({
      name: 'siteName',
      group: 'site',
      title: 'Site name',
      type: 'string',
      description: 'Used in browser tab, SEO title, and og:title',
    }),
    defineField({
      name: 'siteDescription',
      group: 'site',
      title: 'Site description',
      type: 'text',
      rows: 3,
      description: 'Default meta description / og:description',
    }),
    defineField({
      name: 'logo',
      group: 'site',
      title: 'Logo',
      type: 'image',
      description: 'Main logo shown in navigation',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      group: 'site',
      title: 'Favicon',
      type: 'image',
      description: 'Browser tab icon (square, ideally 512×512 PNG)',
    }),
    defineField({
      name: 'ogImage',
      group: 'site',
      title: 'Default social share image',
      type: 'image',
      description: 'Fallback og:image when a page has no image (1200×630px)',
      options: { hotspot: true },
    }),

    // ── Contact ─────────────────────────────────────────────────────────────
    // Een lijst, geen enkel adres: naast de studio kan er een tweede werkplek,
    // een opslag of een tijdelijke ruimte zijn. Precies één adres gaat op de
    // factuur — juridisch kan dat er maar één zijn — maar op de site mogen er
    // meerdere staan, of geen.
    defineField({
      name: 'addresses',
      group: 'contact',
      title: 'Addresses',
      type: 'array',
      of: [{
        type: 'object',
        name: 'siteAddress',
        fields: [
          {
            name: 'label',
            title: 'Kind',
            type: 'string',
            options: {
              list: [
                { title: 'Studio',   value: 'studio'  },
                { title: 'Office',   value: 'office'  },
                { title: 'Storage',  value: 'storage' },
              ],
              layout: 'radio',
              direction: 'horizontal',
            },
            initialValue: 'studio',
          },
          {
            name: 'name',
            title: 'Name (optional)',
            type: 'string',
            description: 'Only needed when you have more than one of the same kind.',
          },
          { name: 'street',     title: 'Street + number', type: 'string' },
          { name: 'postalCode', title: 'Postal code',     type: 'string' },
          { name: 'city',       title: 'City',            type: 'string' },
          { name: 'country',    title: 'Country',         type: 'string' },
          { name: 'phone',      title: 'Phone',           type: 'string' },
          {
            name: 'showOnWebsite',
            title: 'Show on the website',
            type: 'boolean',
            // Standaard uit: een studioadres is meestal privé, terwijl het wel
            // op de factuur moet staan.
            initialValue: false,
            description: 'Appears in the footer. Off by default for a private studio.',
          },
          {
            name: 'useForInvoices',
            title: 'Use this address on invoices',
            type: 'boolean',
            initialValue: false,
            description: 'Exactly one address should have this on.',
          },
        ],
        preview: {
          select: { label: 'label', name: 'name', street: 'street', city: 'city', inv: 'useForInvoices', web: 'showOnWebsite' },
          prepare({ label, name, street, city, inv, web }: any) {
            const KIND: Record<string, string> = { studio: 'Studio', office: 'Office', storage: 'Storage' }
            const marks = [inv ? 'invoices' : null, web ? 'website' : null].filter(Boolean).join(' \u00b7 ')
            return {
              title: name || KIND[label] || 'Address',
              subtitle: [[street, city].filter(Boolean).join(', '), marks].filter(Boolean).join('  \u2014  '),
            }
          },
        },
      }],
      validation: (Rule) =>
        Rule.custom((list: any) => {
          const n = ((list ?? []) as any[]).filter((a) => a?.useForInvoices).length
          if (n === 0) return 'Mark one address to use on invoices.'
          if (n > 1) return 'Only one address can be used on invoices.'
          return true
        }),
    }),

    // ── Social ──────────────────────────────────────────────────────────────
    defineField({
      name: 'social',
      group: 'social',
      title: 'Social media',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'linkedin',  title: 'LinkedIn URL',  type: 'url' }),
        defineField({ name: 'facebook',  title: 'Facebook URL',  type: 'url' }),
        defineField({ name: 'twitter',   title: 'X / Twitter URL', type: 'url' }),
        defineField({ name: 'vimeo',     title: 'Vimeo URL',    type: 'url' }),
      ],
    }),

    defineField({
      name: 'email',
      group: 'site',
      title: 'Contact email',
      type: 'string',
    }),

    // ── Invoice / business ───────────────────────────────────────────────────
    defineField({
      name: 'invoiceSettings',
      group: 'invoice',
      title: 'Invoice & business info',
      type: 'object',
      description: 'Used on invoices and official documents',
      fields: [
        defineField({ name: 'legalName', title: 'Legal name', type: 'string', description: 'Full legal name as on KVK (e.g. "Sander Dekker")' }),
        defineField({
        // Een kunstenaar heeft meestal een studio die niet op de site hoort,
        // maar wel op de factuur moet staan.
        name: 'addressLabel',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0,
        title: 'This address is a',
        type: 'string',
        options: {
          list: [
            { title: 'Studio',  value: 'studio'  },
            { title: 'Gallery', value: 'gallery' },
            { title: 'Office',  value: 'office'  },
          ],
          layout: 'radio',
          direction: 'horizontal',
        },
        initialValue: 'studio',
      }),
      defineField({
        name: 'addressIsPublic',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0,
        title: 'Show this address on the website',
        type: 'boolean',
        initialValue: false,
        description: 'Off by default for a private studio. The address is still used on invoices.',
      }),
      defineField({ name: 'address',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0, title: 'Street address', type: 'string' }),
        defineField({ name: 'postalCode',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0, title: 'Postal code', type: 'string' }),
        defineField({ name: 'city',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0, title: 'City', type: 'string' }),
        defineField({ name: 'country',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0, title: 'Country', type: 'string', initialValue: 'Netherlands' }),
        defineField({ name: 'phone',
        // Verborgen zodra de adressenlijst gevuld is: dit veld blijft alleen
        // bestaan voor de terugval in de code.
        hidden: ({ document }: any) => (document?.addresses?.length ?? 0) > 0, title: 'Phone', type: 'string' }),
        defineField({ name: 'kvkNumber', title: 'KVK number', type: 'string' }),
        defineField({ name: 'vatNumber', title: 'BTW-nummer', type: 'string', description: 'e.g. NL000000000B01' }),
        defineField({ name: 'iban', title: 'IBAN', type: 'string' }),
        defineField({ name: 'bic', title: 'BIC / SWIFT', type: 'string' }),
        defineField({ name: 'website', title: 'Website on documents', type: 'string', description: 'Shown in the footer of invoices and PDFs. E.g. mynameissanderdekker.com' }),
        defineField({ name: 'invoicePrefix', title: 'Invoice number prefix', type: 'string', initialValue: 'SDK', description: 'Prefix for invoice numbers, e.g. "SDK"' }),
        defineField({ name: 'paymentTerms', title: 'Payment terms (days)', type: 'number', initialValue: 14 }),
        defineField({ name: 'invoiceNote', title: 'Invoice footer note', type: 'string', description: 'Optional extra note shown in payment box' }),
      ],
    }),

    // ── SEO defaults ────────────────────────────────────────────────────────
    defineField({
      name: 'googleSiteVerification',
      group: 'site',
      title: 'Google Search Console verification code',
      type: 'string',
    }),

    // ── Legal ───────────────────────────────────────────────────────────────
    // Ontbrak volledig, terwijl er wel een webshop draait — voorwaarden en een
    // privacyverklaring zijn dan niet optioneel.
    defineField({
      name: 'termsAndConditions',
      group: 'legal',
      title: 'Terms & Conditions',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'privacyPolicy',
      group: 'legal',
      title: 'Privacy Policy',
      type: 'array',
      of: [{ type: 'block' }],
    }),

  ],
  preview: {
    select: { title: 'siteName' },
    prepare: ({ title }) => ({ title: title ?? 'Site Settings' }),
  },
})

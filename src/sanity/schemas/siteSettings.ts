import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [

    // ── Identity ────────────────────────────────────────────────────────────
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      description: 'Used in browser tab, SEO title, and og:title',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site description',
      type: 'text',
      rows: 3,
      description: 'Default meta description / og:description',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Main logo shown in navigation',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Browser tab icon (square, ideally 512×512 PNG)',
    }),
    defineField({
      name: 'ogImage',
      title: 'Default social share image',
      type: 'image',
      description: 'Fallback og:image when a page has no image (1200×630px)',
      options: { hotspot: true },
    }),

    // ── Social ──────────────────────────────────────────────────────────────
    defineField({
      name: 'social',
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

    // ── Contact ─────────────────────────────────────────────────────────────
    defineField({
      name: 'email',
      title: 'Contact email',
      type: 'string',
    }),

    // ── SEO defaults ────────────────────────────────────────────────────────
    defineField({
      name: 'googleSiteVerification',
      title: 'Google Search Console verification code',
      type: 'string',
    }),

  ],
  preview: {
    select: { title: 'siteName' },
    prepare: ({ title }) => ({ title: title ?? 'Site Settings' }),
  },
})

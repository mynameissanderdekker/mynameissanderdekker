import { defineField, defineArrayMember } from 'sanity'

// ── Hero Video ────────────────────────────────────────────────────────────────
export const heroVideoBlock = {
  type: 'object',
  name: 'heroVideo',
  title: 'Video',
  preview: {
    select: { url: 'url' },
    prepare({ url }: { url?: string }) {
      return { title: '▶ Video', subtitle: url ?? 'No URL set' }
    },
  },
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL (MP4)',
      type: 'url',
      validation: r => r.required(),
    }),
    defineField({
      name: 'posterImage',
      title: 'Poster image',
      description: 'Shown before the video loads. Click to upload a still from the video.',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
}

// ── Text Section ──────────────────────────────────────────────────────────────
export const textSectionBlock = {
  type: 'object',
  name: 'textSection',
  title: 'Text',
  preview: {
    select: { content: 'content' },
    prepare({ content }: { content?: { children?: { text?: string }[] }[] }) {
      const first = content?.[0]?.children?.[0]?.text ?? ''
      return { title: '¶ Text', subtitle: first.slice(0, 60) || 'Empty' }
    },
  },
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  }),
                  defineField({
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false,
                  }),
                ],
              },
            ] as any,
          },
        },
      ],
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      initialValue: '8col',
      options: {
        list: [
          { title: 'Full width (12 col)', value: 'full' },
          { title: 'Wide (8 col)', value: '8col' },
          { title: 'Medium (6 col)', value: '6col' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'textAlign',
      title: 'Text alignment',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
    }),
  ],
}

// ── Image + Text ──────────────────────────────────────────────────────────────
export const imageTextBlock = {
  type: 'object',
  name: 'imageText',
  title: 'Image + Text',
  preview: {
    select: { layout: 'layout', media: 'image' },
    prepare({ layout, media }: { layout?: string; media?: { asset?: unknown } }) {
      return { title: `⬜ Image + Text`, subtitle: layout ?? '4+8', media: media as never }
    },
  },
  fields: [
    defineField({
      name: 'image',
      title: 'Image (upload)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL (external)',
      description: 'Alternative to uploading: paste an external image URL here. Used if no image is uploaded above.',
      type: 'url',
    }),
    defineField({
      name: 'content',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'imagePosition',
      title: 'Image position',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'imageSplit',
      title: 'Image width',
      type: 'string',
      initialValue: '50',
      options: {
        list: [
          { title: 'Small — 25%', value: '25' },
          { title: 'Medium — 33%', value: '33' },
          { title: 'Half — 50%', value: '50' },
          { title: 'Large — 66%', value: '66' },
          { title: 'Big — 75%', value: '75' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'caption',
      title: 'Image caption (optional)',
      type: 'string',
    }),
  ],
}

// ── Gallery ───────────────────────────────────────────────────────────────────
export const galleryBlock = {
  type: 'object',
  name: 'galleryBlock',
  title: 'Gallery',
  preview: {
    select: { images: 'images', externalUrls: 'externalUrls', columns: 'columns' },
    prepare({ images, externalUrls, columns }: { images?: unknown[]; externalUrls?: string[]; columns?: number }) {
      const count = (images?.length ?? 0) + (externalUrls?.length ?? 0)
      return { title: `⊞ Gallery — ${columns ?? 3} col`, subtitle: `${count} images` }
    },
  },
  fields: [
    defineField({
      name: 'images',
      title: 'Images (Sanity uploads)',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'externalUrls',
      title: 'External image URLs',
      description: 'For images hosted outside Sanity (e.g. WordPress CDN). One URL per item.',
      type: 'array',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      initialValue: 3,
      options: {
        list: [
          { title: '2 columns', value: 2 },
          { title: '3 columns', value: 3 },
          { title: '4 columns', value: 4 },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      description: 'Useful when there are fewer images than columns (e.g. 1 image centered)',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
    }),
  ],
}

// ── Pull Quote ────────────────────────────────────────────────────────────────
export const pullQuoteBlock = {
  type: 'object',
  name: 'pullQuote',
  title: 'Pull Quote',
  preview: {
    select: { text: 'text' },
    prepare({ text }: { text?: string }) {
      return { title: '" Pull Quote', subtitle: text?.slice(0, 60) ?? 'Empty' }
    },
  },
  fields: [
    defineField({
      name: 'text',
      title: 'Quote text',
      type: 'text',
      rows: 3,
      validation: r => r.required(),
    }),
  ],
}

// ── Zine Grid ─────────────────────────────────────────────────────────────────
export const zineGridBlock = {
  type: 'object',
  name: 'zineGrid',
  title: 'Zine Grid',
  preview: {
    select: { featured: 'showFeatured', all: 'showAll' },
    prepare({ featured, all }: { featured?: boolean; all?: boolean }) {
      const parts = [featured && 'featured', all && 'all'].filter(Boolean)
      return { title: '⊞ Zine Grid', subtitle: parts.join(' + ') || 'empty' }
    },
  },
  fields: [
    defineField({
      name: 'showFeatured',
      title: 'Show featured zines',
      description: 'Large cards with "Read the zine" link',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'showAll',
      title: 'Show all other zines',
      description: 'Smaller cards for the complete collection',
      type: 'boolean',
      initialValue: true,
    }),
  ],
}

// ── Divider ───────────────────────────────────────────────────────────────────
export const dividerBlock = {
  type: 'object',
  name: 'dividerBlock',
  title: 'Divider',
  preview: {
    prepare() {
      return { title: '── Divider' }
    },
  },
  fields: [
    defineField({
      name: 'placeholder',
      title: ' ',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
  ],
}

// ── Hero Image (external URL) ─────────────────────────────────────────────────
export const heroImageBlock = {
  type: 'object',
  name: 'heroImage',
  title: 'Hero Image',
  preview: {
    select: { url: 'imageUrl' },
    prepare({ url }: { url?: string }) {
      return { title: '🖼 Hero Image', subtitle: url ?? 'No URL set' }
    },
  },
  fields: [
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'External image URL (e.g. WordPress CDN) or upload a Sanity image below',
      validation: r => r.uri({ allowRelative: false }),
    }),
    defineField({
      name: 'image',
      title: 'Image (Sanity upload)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
    }),
  ],
}

// ── PDF Viewer ────────────────────────────────────────────────────────────────
export const pdfViewerBlock = {
  type: 'object',
  name: 'pdfViewer',
  title: 'PDF Viewer (Zine)',
  preview: {
    select: { url: 'pdfUrl' },
    prepare({ url }: { url?: string }) {
      return { title: '📄 PDF Viewer', subtitle: url ?? 'No PDF set' }
    },
  },
  fields: [
    defineField({
      name: 'pdfUrl',
      title: 'PDF URL',
      type: 'url',
      validation: r => r.required(),
    }),
  ],
}

// ── Video Embed (Vimeo / YouTube iframe) ──────────────────────────────────────
export const videoEmbedBlock = {
  type: 'object',
  name: 'videoEmbed',
  title: 'Video Embed (Vimeo / YouTube)',
  preview: {
    select: { url: 'embedUrl' },
    prepare({ url }: { url?: string }) {
      return { title: '▶ Video Embed', subtitle: url ?? 'No URL set' }
    },
  },
  fields: [
    defineField({
      name: 'embedUrl',
      title: 'Embed URL',
      description: 'e.g. https://player.vimeo.com/video/123456 or https://www.youtube.com/embed/abc',
      type: 'url',
      validation: r => r.required(),
    }),
    defineField({
      name: 'posterImage',
      title: 'Poster image',
      description: 'Shown before the video loads. Click to upload a still from the video.',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
}

// ── Spin Wheel ────────────────────────────────────────────────────────────────
export const spinWheelBlock = {
  type: 'object',
  name: 'spinWheel',
  title: 'Spin Wheel',
  preview: {
    select: { images: 'images' },
    prepare({ images }: { images?: string[] }) {
      return { title: '🔄 Spin Wheel', subtitle: `${images?.length ?? 0} images` }
    },
  },
  fields: [
    defineField({
      name: 'coverImage',
      title: 'Cover image URL',
      type: 'url',
    }),
    defineField({
      name: 'images',
      title: 'Image URLs',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'All images for the spin wheel (external URLs)',
    }),
  ],
}

// ── Spacer ────────────────────────────────────────────────────────────────────
export const spacerBlock = {
  type: 'object',
  name: 'spacer',
  title: 'Spacer',
  preview: {
    select: { size: 'size' },
    prepare({ size }: { size?: string }) {
      const labels: Record<string, string> = { small: '16px', medium: '48px', large: '96px' }
      return { title: '↕ Spacer', subtitle: labels[size ?? 'medium'] ?? 'Medium' }
    },
  },
  fields: [
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      initialValue: 'medium',
      options: {
        list: [
          { title: 'Small (16px)', value: 'small' },
          { title: 'Medium (48px)', value: 'medium' },
          { title: 'Large (96px)', value: 'large' },
        ],
        layout: 'radio',
      },
    }),
  ],
}

// ── Cards Grid ────────────────────────────────────────────────────────────────
export const cardsBlock = {
  type: 'object',
  name: 'cardsBlock',
  title: 'Cards (grid)',
  preview: {
    select: { cards: 'cards', columns: 'columns' },
    prepare({ cards, columns }: { cards?: unknown[]; columns?: number }) {
      return { title: `⊟ Cards — ${columns ?? 3} col`, subtitle: `${cards?.length ?? 0} cards` }
    },
  },
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      initialValue: 3,
      options: {
        list: [
          { title: '2 columns', value: 2 },
          { title: '3 columns', value: 3 },
          { title: '4 columns', value: 4 },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'card',
          title: 'Card',
          preview: {
            select: { title: 'title', media: 'image' },
            prepare({ title, media }: { title?: string; media?: unknown }) {
              return { title: title ?? '—', media: media as never }
            },
          },
          fields: [
            defineField({
              name: 'image',
              title: 'Image (upload)',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'imageUrl',
              title: 'Image URL (external)',
              description: 'Alternative to uploading — paste an external URL here.',
              type: 'url',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'buttonLabel',
              title: 'Button label',
              description: 'Leave empty to hide the button',
              type: 'string',
            }),
            defineField({
              name: 'buttonUrl',
              title: 'Button URL',
              type: 'url',
              validation: r => r.uri({ allowRelative: true }),
            }),
            defineField({
              name: 'text',
              title: 'Description',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [{ title: 'Normal', value: 'normal' }],
                  lists: [],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                      { title: 'Underline', value: 'underline' },
                    ],
                  },
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
}

// ── Person Profile ────────────────────────────────────────────────────────────
export const personBlock = {
  type: 'object',
  name: 'personBlock',
  title: 'Person Profile',
  preview: {
    select: { name: 'name', location: 'location' },
    prepare({ name, location }: { name?: string; location?: string }) {
      return { title: `👤 ${name ?? 'Person'}`, subtitle: location ?? '' }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'e.g. Sasha',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Moscow, RU',
    }),
    defineField({
      name: 'images',
      title: 'Photos (Sanity uploads)',
      description: '1–3 photos. Shown side by side above the text.',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'externalUrls',
      title: 'Photo URLs (external)',
      description: 'Alternative to uploading — paste external image URLs here.',
      type: 'array',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'imageSize',
      title: 'Photo size',
      description: 'Only used when there is a single photo.',
      type: 'string',
      options: {
        list: [
          { title: '1/4', value: '1/4' },
          { title: '2/4 — half', value: '2/4' },
          { title: '3/4', value: '3/4' },
          { title: 'Full width', value: 'full' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'imageAlign',
      title: 'Photo alignment',
      description: 'Only used when there is a single photo.',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
      ],
    }),
  ],
}

// ── All blocks (for use in pageBuilder array) ─────────────────────────────────
export const ALL_PAGE_BLOCKS = [
  heroImageBlock,
  heroVideoBlock,
  videoEmbedBlock,
  textSectionBlock,
  imageTextBlock,
  galleryBlock,
  pullQuoteBlock,
  pdfViewerBlock,
  spinWheelBlock,
  zineGridBlock,
  cardsBlock,
  personBlock,
  dividerBlock,
  spacerBlock,
].map(b => defineArrayMember(b as Parameters<typeof defineArrayMember>[0]))

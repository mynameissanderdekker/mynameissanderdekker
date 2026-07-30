import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const doc = {
  _id: 'campaign-tenfifteen-wallpaper-2025',
  _type: 'campaign',

  subject: 'TenFifteen wallpaper is now available 🖤🤍',
  previewText: 'You scroll every day. Hundreds of images. A peek into someone else\'s life.',

  // ── Section 1: Wallpaper ──────────────────────────────────────────────────
  heading: 'L I M I T E D  —  E D I T I O N',
  body: [
    'TenFifteen was built from that exact impulse.',
    '',
    'After creating large-scale installations from thousands of hand-placed photographs, TenFifteen now shifts again. This time into a limited edition wallpaper for your interior.',
    '',
    'Same density.',
    '',
    'Same rhythm.',
    '',
    'You don\'t scroll past this one.',
    '',
    'Look at it long enough and it might start looking back.',
    '',
    'Format: 70 × 600 cm. Each roll covers two full-height vertical panels on an average wall.',
    '',
    'Print & material: UV printed on 200 g/m² ProVlies matt non-woven with a smooth finish. PVC-free.',
    '',
    'Certificate sticker included.',
  ].join('\n'),
  buttonText: 'Get your wallpaper',
  buttonUrl: 'https://mynameissanderdekker.com/works',

  // ── Extra secties ─────────────────────────────────────────────────────────
  sections: [
    {
      _key: 'section-spin',
      _type: 'emailSection',
      heading: 'Spin the wheel',
      body: 'My website just had a major update, including a new interactive element within The Social Media Project.\n\nSpin to discover photos of the project\'s participants.',
      buttonText: 'SPIN',
      buttonUrl: 'https://mynameissanderdekker.com/projects/the-social-media-project',
    },
    {
      _key: 'section-zines',
      _type: 'emailSection',
      heading: 'The Zine Project',
      body: 'Between 2021 and 2025, I created The Zine Project: a series of ten completely handmade zines, each published in very small editions. All physical copies were sold out in minutes. For those who missed them, 3 zines are now available to read online.\n\n• Zine Nº.2 — Girls in Paris\n• Zine Nº.8 — The Warsaw SAGA\n• Zine Nº.9 — A.S.I.A.\n\nWishing you a happy day, and thank you for supporting my work. See you soon!',
      buttonText: 'Read the zines',
      buttonUrl: 'https://mynameissanderdekker.com/projects',
    },
  ],

  segment: 'newsletter',
}

async function run() {
  console.log('Seeding TenFifteen newsletter campaign...')
  const result = await client.createOrReplace(doc)
  console.log('✓', result._id)
  console.log('Done.')
}

run().catch(err => { console.error(err); process.exit(1) })

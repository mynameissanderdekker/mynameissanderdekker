/**
 * seed-publications.mjs
 * Run: node scripts/seed-publications.mjs
 *
 * Uploads cover + gallery images from WordPress to Sanity,
 * then patches the artwork documents with images, description,
 * price, status and meta.
 */

import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2026-07-25',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ── helpers ────────────────────────────────────────────────────────────────────

async function uploadFromUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const asset = await client.assets.upload('image', buffer, {
    filename: url.split('/').pop(),
    contentType,
  })
  console.log(`  ✓ uploaded ${url.split('/').pop()} → ${asset._id}`)
  return asset._id
}

function block(text, marks = []) {
  return {
    _type: 'block',
    _key: nanoid(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: nanoid(), text, marks }],
  }
}

function imageRef(assetId) {
  return { _type: 'image', _key: nanoid(), asset: { _type: 'reference', _ref: assetId } }
}

// ── data ───────────────────────────────────────────────────────────────────────

const WP = 'https://mynameissanderdekker.com/wp-content/uploads'

const items = [
  // ── Zine cover-only patches ─────────────────────────────────────────────────
  {
    ids: ['k57DXB4TxK58qNiTm5fIko'],
    label: "Zine Nº9 A.S.I.A.",
    coverUrl: `${WP}/2023/12/Mock-up-Cover.jpg`,
    galleryUrls: [],
  },
  {
    ids: ['k57DXB4TxK58qNiTm5fIpC'],
    label: "Zine Nº8 Warsaw SAGA",
    coverUrl: `${WP}/2026/01/Zine-No.8-'The-Warsaw-SAGA.jpg`,
    galleryUrls: [],
  },
  {
    ids: ['GskSHzltiom27vUz3q2u14'],
    label: "Zine Nº2 Girls in Paris",
    coverUrl: `${WP}/2026/01/Girls-in-Paris.jpg`,
    galleryUrls: [],
  },

  // ── My name is Sander Dekker Nº 1.5 ────────────────────────────────────────
  {
    ids: ['PGI1Mc19xNWwE3RgMt0y7T', 'k57DXB4TxK58qNiTm5VJHy'],
    label: "Nº1.5",
    coverUrl: `${WP}/2019/10/My-Name-Is-Sander-Dekker-1-1.5.jpg`,
    galleryUrls: [
      `${WP}/2019/10/227872-d3c7bb0b33624e409cb8ff19d645f092.jpeg`,
      `${WP}/2019/10/227872-103ce314f01a42b1a07f0ba12264e9fb.jpeg`,
      `${WP}/2019/10/227872-77df8c56bd93464fbfb4424ca06cc806.jpeg`,
      `${WP}/2019/10/227872-029db149d051443992cdef636352b043.jpeg`,
      `${WP}/2019/10/227872-76da3729374d43b4998368076cb8548d.jpeg`,
      `${WP}/2019/10/227872-6ccb87ea50474894a9719b9b02d412b6.jpeg`,
      `${WP}/2019/10/227872-49a5e2dae78d47b384ac4ba9b79f2810.jpeg`,
    ],
    extra: {
      priceExclVAT: 27.52,
      vatRate: 9,
      status: 'available',
      description: [
        block('December 2016 · 144 pages · 21×26cm · Hardcover · ISBN 9789082111323', ['em']),
        block('A woman from Sudan who survived war and found freedom through modelling. A man in Brooklyn whose entire life lives on in a single family portrait. A woman halfway through her transition, exploring her true identity for the first time.'),
        block('A stranger online, a message, a plane ticket, a knock on the door.'),
        block('This book documents the first years of The Social Media Project — encounters with people Dekker had never met, photographed in their own homes, with no preparation and no plan.'),
      ],
    },
  },

  // ── My name is Sander Dekker Nº 1 ──────────────────────────────────────────
  {
    ids: ['GskSHzltiom27vUz3phAgD'],
    label: "Nº1",
    coverUrl: `${WP}/2020/04/My-Name-Is-Sander-Dekker-1-1.jpg`,
    galleryUrls: [
      `${WP}/2019/10/227872-8c81e5c9e85544ca98841d053c5af258.jpeg`,
      `${WP}/2019/10/227872-95da2005ed644cc4b09fbec8239458e6.jpeg`,
      `${WP}/2019/10/227872-753a51bd4c0a40f4bba18f90290a4347.jpeg`,
      `${WP}/2019/10/227872-f3a51a5d30144eaaba005bfd4803f3b4.jpeg`,
      `${WP}/2019/10/227872-5d09993c97a9436e9178a2112d8b3330.jpeg`,
      `${WP}/2019/10/227872-44f39f7408f14885b84f69c0abe94058.jpeg`,
      `${WP}/2019/10/227872-353e354d704246d78e94a3acbb3647ed.jpeg`,
      `${WP}/2019/10/227872-0b63bd1fff0341149e64828b2404e2e7.jpeg`,
      `${WP}/2019/10/227872-152e10da2a574fc1aabc93bc02ae8e93.jpeg`,
      `${WP}/2019/10/227872-4ea2fe5cb22845a1a36c112e9b2cba4e.jpeg`,
    ],
    extra: {
      status: 'sold_out',
      description: [
        block('My debut photo book.'),
        block('Limited Edition of 300 copies · All signed and numbered · 80 pages · 28 × 28 cm · Offset printing · Hardcover + dustjacket', ['em']),
      ],
    },
  },
]

// ── main ───────────────────────────────────────────────────────────────────────

for (const item of items) {
  console.log(`\n▸ ${item.label}`)

  const coverAssetId = await uploadFromUrl(item.coverUrl)
  const galleryAssetIds = []
  for (const url of item.galleryUrls) {
    galleryAssetIds.push(await uploadFromUrl(url))
  }

  const images = [imageRef(coverAssetId), ...galleryAssetIds.map(imageRef)]

  for (const id of item.ids) {
    await client
      .patch(id)
      .set({ images, ...(item.extra ?? {}) })
      .commit()
    console.log(`  ✓ patched ${id}`)
  }
}

console.log('\n✅ Done.')

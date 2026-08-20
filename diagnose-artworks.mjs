// Diagnose artwork issues
// Run with: node diagnose-artworks.mjs

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2021-10-21',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// 1. Check Innate Curiosity project artworks
const project = await client.fetch(
  `*[_type == "project" && slug.current == "innate-curiosity"][0]{
    "artworks": [
      ...coalesce(artworkSeries[]->artworks[]->{_id,title,"slug":slug.current,status}, []),
      ...coalesce(artworks[]->{_id,title,"slug":slug.current,status}, [])
    ]
  }`
)
console.log('\n=== INNATE CURIOSITY ARTWORKS ===')
project?.artworks?.forEach(a => {
  console.log(`  ${a.title} | slug: ${a.slug} | status: ${a.status}`)
})

// 2. Check broken artwork pages
const broken = await client.fetch(
  `*[_type == "artwork" && slug.current in ["my-name-is-sander-dekker-no-1-5", "innate-curiosity-the-trace-v1"]][]{
    _id, title, "slug": slug.current, status,
    "imgRef": images[0].asset._ref,
    "imgUpload": defined(images[0]._upload)
  }`
)
console.log('\n=== BROKEN ARTWORK PAGES ===')
broken?.forEach(a => {
  console.log(`  ${a.title}`)
  console.log(`    slug: ${a.slug}`)
  console.log(`    status: ${a.status}`)
  console.log(`    image asset: ${a.imgRef ?? 'MISSING'}`)
  console.log(`    has _upload (incomplete): ${a.imgUpload}`)
})

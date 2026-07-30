// Run: node scripts/update-zine-nav.mjs
// Sets hideFromNav=true on 3 zine project pages, sets projectSlug on 3 zines

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read token from .env.local
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// 1. Hide these 3 project slugs from nav
const navSlugs = ['girls-in-paris', 'warsaw-saga', 'asia']
const projects = await client.fetch(
  `*[_type == "project" && slug.current in $slugs]{ _id, title, slug }`,
  { slugs: navSlugs }
)
console.log('Projects to hide from nav:', projects.map(p => p.title))
for (const p of projects) {
  await client.patch(p._id).set({ hideFromNav: true }).commit()
  console.log(`  ✓ hideFromNav=true → ${p.title}`)
}

// 2. Set pdfUrl on the 3 project pages
const pdfUpdates = [
  { slug: 'girls-in-paris', pdfUrl: 'https://mynameissanderdekker.com/wp-content/uploads/2025/11/Girls-in-Paris-1.pdf' },
  { slug: 'warsaw-saga',    pdfUrl: 'https://mynameissanderdekker.com/wp-content/uploads/2025/08/No8-The-Warsaw-SAGA.pdf' },
  { slug: 'asia',           pdfUrl: 'https://mynameissanderdekker.com/wp-content/uploads/2025/07/No9-Asia.pdf' },
]
for (const { slug, pdfUrl } of pdfUpdates) {
  const proj = projects.find(p => p.slug.current === slug)
  if (!proj) { console.log(`  ⚠ Project not found: ${slug}`); continue }
  await client.patch(proj._id).set({ pdfUrl }).commit()
  console.log(`  ✓ pdfUrl set → ${proj.title}`)
}

// 3. Set projectSlug on featured zines by number
const zineUpdates = [
  { number: 'Nº2', projectSlug: 'girls-in-paris' },
  { number: 'Nº8', projectSlug: 'warsaw-saga' },
  { number: 'Nº9', projectSlug: 'asia' },
]
for (const { number, projectSlug } of zineUpdates) {
  const zines = await client.fetch(
    `*[_type == "zine" && number == $number]{ _id, title, number }`,
    { number }
  )
  console.log(`\nZines with number "${number}":`, zines.map(z => z.title))
  for (const z of zines) {
    await client.patch(z._id).set({ projectSlug }).commit()
    console.log(`  ✓ projectSlug="${projectSlug}" → ${z.title}`)
  }
}

console.log('\nDone!')

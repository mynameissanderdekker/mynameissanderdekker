/**
 * migrate-social-media-persons.mjs
 *
 * Converts gallery + textSection block pairs in "the-social-media-project"
 * into the new personBlock type.
 *
 * Run with:  node scripts/migrate-social-media-persons.mjs
 * Add --dry-run to preview without writing.
 */

import { createClient } from '@sanity/client'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract plain text from a Sanity block */
function blockText(block) {
  return (block.children ?? []).map(c => c.text ?? '').join('')
}

/**
 * Parse "Name — Location. Rest of text." from the first block of a textSection.
 * Returns { name, location, remaining } where remaining is the rest as text.
 */
function parsePerson(content) {
  if (!content?.length) return null
  const firstText = blockText(content[0])

  // Pattern: "Name — Location. rest..."  OR  "Name — Location\nrest..."
  const match = firstText.match(/^(.+?)\s*—\s*([^.]+)\.\s*(.*)$/s)
  if (!match) return null

  const [, name, location, restOfFirst] = match

  // Rebuild body: restOfFirst as first paragraph, then remaining blocks
  const bodyBlocks = []

  if (restOfFirst.trim()) {
    bodyBlocks.push({
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: randomUUID(), text: restOfFirst.trim(), marks: [] }],
    })
  }

  // Add remaining blocks (2nd block onwards)
  for (const block of content.slice(1)) {
    bodyBlocks.push({ ...block, _key: block._key ?? randomUUID() })
  }

  return { name: name.trim(), location: location.trim(), bodyBlocks }
}

/**
 * Convert a galleryBlock + textSection pair into a personBlock.
 * Returns null if the pattern doesn't match.
 */
function toPersonBlock(gallery, text) {
  const parsed = parsePerson(text.content)
  if (!parsed) return null

  return {
    _type: 'personBlock',
    _key: randomUUID(),
    name: parsed.name,
    location: parsed.location,
    images: gallery.images ?? [],
    body: parsed.bodyBlocks,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const project = await client.fetch(
  `*[_type == "project" && slug.current == "the-social-media-project"][0]{
    _id, title,
    pageBuilder
  }`
)

if (!project) {
  console.error('❌  Project not found')
  process.exit(1)
}

console.log(`\n📄  Found: ${project.title} (${project._id})\n`)
console.log(`   ${project.pageBuilder?.length ?? 0} blocks total\n`)

const blocks = project.pageBuilder ?? []
const newBlocks = []
let i = 0
let converted = 0

while (i < blocks.length) {
  const curr = blocks[i]
  const next = blocks[i + 1]

  // Look for galleryBlock followed by textSection
  if (curr._type === 'galleryBlock' && next?._type === 'textSection') {
    const person = toPersonBlock(curr, next)
    if (person) {
      console.log(`  ✅  Converting: ${person.name} — ${person.location}`)
      console.log(`      ${person.images?.length ?? 0} images, ${person.body?.length ?? 0} body blocks`)
      newBlocks.push(person)
      converted++
      i += 2 // skip both blocks
      continue
    } else {
      console.log(`  ⚠️   galleryBlock at index ${i} — couldn't parse person from textSection, keeping as-is`)
    }
  }

  newBlocks.push(curr)
  i++
}

console.log(`\n   Converted ${converted} gallery+text pairs → personBlock\n`)

if (DRY_RUN) {
  console.log('🔍  DRY RUN — no changes written.\n')
  console.log('New block types:')
  newBlocks.forEach((b, idx) => console.log(`  ${idx}: ${b._type}${b.name ? ` (${b.name})` : ''}`))
  process.exit(0)
}

if (converted === 0) {
  console.log('Nothing to migrate.\n')
  process.exit(0)
}

console.log('💾  Writing to Sanity...\n')

await client
  .patch(project._id)
  .set({ pageBuilder: newBlocks })
  .commit()

console.log('✅  Done! Refresh Studio to see the changes.\n')

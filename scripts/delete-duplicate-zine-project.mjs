/**
 * Deletes the duplicate "The Zine Project" page document.
 * Keeps the one with _id 'project-the-zine-project' (our seeded version with pageBuilder).
 *
 * Run: node scripts/delete-duplicate-zine-project.mjs
 */

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

const KEEP_ID = 'project-the-zine-project'

async function run() {
  const docs = await client.fetch(
    `*[_type == "project" && title == "The Zine Project" && isPage == true]{ _id, title, "hasBuilder": defined(pageBuilder) }`
  )

  console.log(`Found ${docs.length} "The Zine Project" page(s):`)
  docs.forEach(d => console.log(` • ${d._id} — pageBuilder: ${d.hasBuilder}`))

  const toDelete = docs.filter(d => d._id !== KEEP_ID)

  if (toDelete.length === 0) {
    console.log('\n✅ No duplicates found — nothing to delete.')
    return
  }

  for (const doc of toDelete) {
    await client.delete(doc._id)
    console.log(`\n🗑  Deleted: ${doc._id}`)
  }

  console.log('\n✅ Done — only "project-the-zine-project" remains.')
}

run().catch(e => console.error('❌', e.message))

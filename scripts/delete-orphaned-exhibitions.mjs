/**
 * Deletes orphaned exhibition docs that have no cvProject set and showInCV == false/null.
 * These are pre-existing duplicates from before the CV system.
 *
 * Run: node scripts/delete-orphaned-exhibitions.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// Already deleted: vu76N7Rvcpr7D8P8kQ4cDd, exh-smp-2018-torch, QUHiY7bUv7QpTIkvvcObHM, vu76N7Rvcpr7D8P8kQ4jrp
// Kept intentionally: exh-zine-2026-studio, exh-ten15-torch (actively used)
const IDS: string[] = []

async function main() {
  for (const id of IDS) {
    await client.delete(id)
    console.log(`✓ Deleted ${id}`)
  }
  console.log('\nDone.')
}

main().catch(console.error)

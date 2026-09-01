import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

const KRISTIAN_ID = 'contact-hist-kristian-hornsleth'

const aw = await client.fetch(`*[_id == "artwork-hist-lady-of-the-manor"][0]{ _id, title }`)
if (!aw) { console.error('Lady of the Manor not found'); process.exit(1) }
console.log(`Artwork: ${aw.title} (${aw._id})`)

const contact = await client.fetch(`*[_id == $id][0]{ _id, purchases }`, { id: KRISTIAN_ID })
if (!contact) { console.error('Kristian Hornsleth not found'); process.exit(1) }

// Keep only one Lady-of-Manor purchase, set copyNumber to 6/30.
// Match both the published ref and the stray draft-doc ref — earlier runs
// added a duplicate purchase pointing at drafts.artwork-hist-lady-of-the-manor.
const AW_IDS = [aw._id, `drafts.${aw._id}`]
const ladyPurchases = (contact.purchases ?? []).filter(p => AW_IDS.includes(p.artwork?._ref))
const otherPurchases = (contact.purchases ?? []).filter(p => !AW_IDS.includes(p.artwork?._ref))

console.log(`  Found ${ladyPurchases.length} Lady of the Manor purchase(s) on Kristian`)
const preferred = ladyPurchases.find(p => p.artwork?._ref === aw._id) ?? ladyPurchases[0]
const keep = { ...preferred, copyNumber: '6/30', notes: '27x40.5cm · gift · 11-2019' }
const updated = [...otherPurchases, keep]

await client.patch(KRISTIAN_ID).set({ purchases: updated }).commit()
console.log(`  ✅ Kept 1 record, set copyNumber: 6/30`)
console.log('Done.')

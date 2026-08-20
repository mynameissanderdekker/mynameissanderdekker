/**
 * patch-artwork-editions.mjs
 *
 * Sets editionTotal + editionAP on all artwork-hist-* records that are missing them.
 * Data source: 2026.numbers (edition info was in the title column).
 *
 * DRY_RUN=true  → only prints what would change, no writes
 * Run: node scripts/patch-artwork-editions.mjs
 * Dry: DRY_RUN=true node scripts/patch-artwork-editions.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) console.log('=== DRY RUN — no changes will be made ===\n')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

// ── Edition data from 2026.numbers ───────────────────────────────────────────
// Format: { id, editionTotal, editionAP }
// editionAP = 2 for all standard editions (confirmed by Sander)
// editionAP = 0 for limited editions (Editie 30) and very small runs (Editie 3)

const EDITIONS = [
  // ── 2024 ──
  { id: 'artwork-hist-embrace-your-freedom',          editionTotal: 7,  editionAP: 2 },

  // ── 2023 ──
  { id: 'artwork-hist-crustacean-ballet',             editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-the-breakfast-club',            editionTotal: 5,  editionAP: 2 },

  // ── 2022 ──
  { id: 'artwork-hist-horticulture-ii',               editionTotal: 7,  editionAP: 2 },

  // ── 2021 ──
  { id: 'artwork-hist-got-no-time-for-that-shit',     editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-nimby',                         editionTotal: 7,  editionAP: 2 },

  // ── 2020 ──
  { id: 'artwork-hist-anastasia',                     editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-speedy-harmony',                editionTotal: 7,  editionAP: 2 },

  // ── 2019 ──
  { id: 'artwork-hist-a-pattern-of-madness',          editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-activate-your-beast-mode',      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-composition-in-blue',           editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-from-russia-with-love',         editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-horticulture',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-im-just-creating',              editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-iris-skywalker',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-its-a-wrap',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-kaliexpress',                   editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lad-os-danse-pa-roser',         editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lean-and-mean',                 editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lunar-lunacy-effect',           editionTotal: 30, editionAP: 0 }, // limited edition
  { id: 'artwork-hist-new-found-freedom',             editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-next-generation-of-changemakers', editionTotal: 5, editionAP: 2 },
  { id: 'artwork-hist-sorry-were-dead',               editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-villa-volta',                   editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-we-are-all-made-of-stardust',   editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-we-are-all-of-us-stars',        editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-when-offline',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-world-peace',                   editionTotal: 5,  editionAP: 2 },

  // ── 2018 ──
  { id: 'artwork-hist-a-pattern-of-madness-ii',       editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-and-we-deserve-to-twinkle',     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-anthony-and-otto',              editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-classic-rock',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-confetti-party',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-el-diablo-luchador-ii',         editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-so-fashion',                    editionTotal: 5,  editionAP: 2 },

  // ── 2017 ──
  { id: 'artwork-hist-horsing-around',                editionTotal: 30, editionAP: 0 }, // limited edition
  { id: 'artwork-hist-lady-of-the-manor',             editionTotal: 30, editionAP: 0 }, // limited edition
  // k57 IDs = webshop versions of the same limited editions
  { id: 'k57DXB4TxK58qNiTm5ZQiI',                    editionTotal: 30, editionAP: 0 }, // Limited edition: Lady of the Manor
  { id: 'k57DXB4TxK58qNiTm5ZQmg',                    editionTotal: 30, editionAP: 0 }, // Limited edition: Horsing Around
  { id: 'k57DXB4TxK58qNiTm5VJYQ',                    editionTotal: 30, editionAP: 0 }, // Special Edition: Day At The Museum

  // ── 2016 ──
  { id: 'artwork-hist-catching-popcorn',              editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-day-at-the-museum',             editionTotal: 30, editionAP: 0 }, // limited edition
  { id: 'artwork-hist-out-of-the-blue',               editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-play-with-fire',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-smoking-bunny',                 editionTotal: 30, editionAP: 0 }, // limited edition
  { id: 'artwork-hist-venetian-triptych',             editionTotal: 5,  editionAP: 2 },

  // ── 2015 ──
  { id: 'artwork-hist-chocolate-puma',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-employee-of-the-month',         editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-foodporn',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-hall-pass',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-i-spy-with-my-little-eye',      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-ill-show-you-mine',             editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-la-squeeze',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-sharky-3d',                     editionTotal: 3,  editionAP: 0 }, // Editie 3
  { id: 'artwork-hist-the-beast',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-the-oracle',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-tool-mans-dream',               editionTotal: 5,  editionAP: 2 },

  // ── 2014 ──
  { id: 'artwork-hist-cars-n-heels',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-cheeky-bum',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-the-maestro',                   editionTotal: 5,  editionAP: 2 },

  // ── 2013 ──
  { id: 'artwork-hist-connect-the-dots',              editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-kont-eva-lagerweij',            editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-sharky',                        editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-the-jungle',                    editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-walls',                         editionTotal: 10, editionAP: 2 },

  // ── 2012 ──
  { id: 'artwork-hist-air-gitar-isabel',              editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-burger-bullet',                 editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-disco-balls',                   editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-eye-of-the-tiger',              editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-holy-dress',                    editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-kont-eva-lagerweij',            editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-laura-naaktop-bank',            editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-magic-world',                   editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-nyc-rooftop',                   editionTotal: 10, editionAP: 2 },
]

// Deduplicate by ID (kont-eva-lagerweij appears in both 2013 and 2012 section above)
const seen = new Set()
const dedupedEditions = EDITIONS.filter(e => {
  if (seen.has(e.id)) return false
  seen.add(e.id)
  return true
})

// ── Apply patches ─────────────────────────────────────────────────────────────

let patched = 0
let skipped = 0

for (const { id, editionTotal, editionAP } of dedupedEditions) {
  // Fetch current state
  const current = await client.fetch(
    `*[_id == $id][0]{ _id, title, editionTotal, editionAP }`,
    { id }
  )

  if (!current) {
    console.warn(`⚠  Not found: ${id}`)
    skipped++
    continue
  }

  // Skip if already correct
  if (current.editionTotal === editionTotal && current.editionAP === editionAP) {
    console.log(`✓  Already set: "${current.title}" — ${editionTotal} + ${editionAP} AP`)
    skipped++
    continue
  }

  console.log(`→ "${current.title}" (${id})`)
  console.log(`  editionTotal: ${current.editionTotal ?? 'null'} → ${editionTotal}`)
  console.log(`  editionAP:    ${current.editionAP ?? 'null'} → ${editionAP}`)

  if (!DRY_RUN) {
    await client.patch(id).set({ editionTotal, editionAP }).commit()
    patched++
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN]' : 'Done —'} ${patched} artworks patched, ${skipped} already correct / not found.`)
if (DRY_RUN) console.log('Run without DRY_RUN=true to apply.')

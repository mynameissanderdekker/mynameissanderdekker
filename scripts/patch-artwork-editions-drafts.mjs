/**
 * patch-artwork-editions-drafts.mjs
 *
 * Same as patch-artwork-editions.mjs but also patches draft documents
 * (stored as "drafts.<id>"). Needed because the Studio shows drafts over
 * published documents, so patches to published docs aren't visible until
 * the draft is discarded or republished.
 *
 * Run: node scripts/patch-artwork-editions-drafts.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_WRITE_TOKEN,
  useCdn:    false,
})

const EDITIONS = [
  { id: 'artwork-hist-embrace-your-freedom',            editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-crustacean-ballet',               editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-the-breakfast-club',              editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-horticulture-ii',                 editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-got-no-time-for-that-shit',       editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-nimby',                           editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-anastasia',                       editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-speedy-harmony',                  editionTotal: 7,  editionAP: 2 },
  { id: 'artwork-hist-a-pattern-of-madness',            editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-activate-your-beast-mode',        editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-composition-in-blue',             editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-from-russia-with-love',           editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-horticulture',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-im-just-creating',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-iris-skywalker',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-its-a-wrap',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-kaliexpress',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lad-os-danse-pa-roser',           editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lean-and-mean',                   editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-lunar-lunacy-effect',             editionTotal: 30, editionAP: 0 },
  { id: 'artwork-hist-new-found-freedom',               editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-next-generation-of-changemakers', editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-sorry-were-dead',                 editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-villa-volta',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-we-are-all-made-of-stardust',     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-we-are-all-of-us-stars',          editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-when-offline',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-world-peace',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-a-pattern-of-madness-ii',         editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-and-we-deserve-to-twinkle',       editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-anthony-and-otto',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-classic-rock',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-confetti-party',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-el-diablo-luchador-ii',           editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-so-fashion',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-horsing-around',                  editionTotal: 30, editionAP: 0 },
  { id: 'artwork-hist-lady-of-the-manor',               editionTotal: 30, editionAP: 0 },
  { id: 'k57DXB4TxK58qNiTm5ZQiI',                      editionTotal: 30, editionAP: 0 },
  { id: 'k57DXB4TxK58qNiTm5ZQmg',                      editionTotal: 30, editionAP: 0 },
  { id: 'k57DXB4TxK58qNiTm5VJYQ',                      editionTotal: 30, editionAP: 0 },
  { id: 'artwork-hist-catching-popcorn',                editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-day-at-the-museum',               editionTotal: 30, editionAP: 0 },
  { id: 'artwork-hist-out-of-the-blue',                 editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-play-with-fire',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-smoking-bunny',                   editionTotal: 30, editionAP: 0 },
  { id: 'artwork-hist-venetian-triptych',               editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-chocolate-puma',                  editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-employee-of-the-month',           editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-foodporn',                        editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-hall-pass',                       editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-i-spy-with-my-little-eye',        editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-ill-show-you-mine',               editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-la-squeeze',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-sharky-3d',                       editionTotal: 3,  editionAP: 0 },
  { id: 'artwork-hist-the-beast',                       editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-the-oracle',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-tool-mans-dream',                 editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-cars-n-heels',                    editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-cheeky-bum',                      editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-the-maestro',                     editionTotal: 5,  editionAP: 2 },
  { id: 'artwork-hist-connect-the-dots',                editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-kont-eva-lagerweij',              editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-sharky',                          editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-the-jungle',                      editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-walls',                           editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-air-gitar-isabel',                editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-burger-bullet',                   editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-disco-balls',                     editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-eye-of-the-tiger',                editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-holy-dress',                      editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-laura-naaktop-bank',              editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-magic-world',                     editionTotal: 10, editionAP: 2 },
  { id: 'artwork-hist-nyc-rooftop',                     editionTotal: 10, editionAP: 2 },
]

let patched = 0

for (const { id, editionTotal, editionAP } of EDITIONS) {
  const draftId = `drafts.${id}`

  // Check if a draft exists
  const draft = await client.fetch(`*[_id == $id][0]{ _id }`, { id: draftId })

  if (draft) {
    await client.patch(draftId).set({ editionTotal, editionAP }).commit()
    console.log(`✓ Draft patched: ${id}`)
    patched++
  }
}

console.log(`\nDone — ${patched} drafts patched.`)
console.log('Refresh the Studio to see the values.')

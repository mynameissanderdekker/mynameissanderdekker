/**
 * Aankopen in het CRM die naar `drafts.<id>` verwijzen rechtzetten.
 *
 * Een verwijzing hoort nooit naar een concept te wijzen: zodra het concept
 * gepubliceerd is, bestaat dat id niet meer en wijst de aankoop nergens naar.
 * De Collectie-tab van die klant toont dan een leeg vak. Negen aankopen bij
 * acht contacten, allemaal uit de historische import (Lady of the Manor,
 * Villa Volta, Horsing Around). Het gepubliceerde werk bestaat gewoon — het
 * `drafts.`-voorvoegsel is het enige wat mis is.
 *
 *   node --env-file=.env.local scripts/fix-purchase-draft-refs.mjs        # tonen
 *   DRY=0 node --env-file=.env.local scripts/fix-purchase-draft-refs.mjs  # uitvoeren
 */
import { createClient } from '@sanity/client'
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production', apiVersion: '2026-06-18', useCdn: false, token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN }).withConfig({ perspective: 'raw' })
const DRY = process.env.DRY !== '0'

const contacten = await c.fetch(`*[_type == "contact" && count(purchases[artwork._ref match "drafts.*"]) > 0]{
  _id, firstName, lastName, "rows": purchases[artwork._ref match "drafts.*"]{_key, "ref": artwork._ref}
}`)
for (const k of contacten) {
  const p = c.patch(k._id)
  for (const r of k.rows) {
    const doel = r.ref.replace(/^drafts\./, '')
    const bestaat = await c.fetch(`defined(*[_id == $id][0]._id)`, { id: doel })
    console.log(`${k._id.padEnd(34)} ${r.ref} → ${doel} ${bestaat ? '' : '  ✗ bestaat niet, overgeslagen'}`)
    if (bestaat) p.set({ [`purchases[_key=="${r._key}"].artwork._ref`]: doel })
  }
  if (!DRY) await p.commit()
}
console.log(DRY ? '\nDroogloop — niets gewijzigd. Uitvoeren met DRY=0.' : '\nKlaar.')

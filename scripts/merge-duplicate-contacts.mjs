/**
 * Twee contacten samenvoegen: het importrecord (`contact-hist-…`) gaat op in
 * het volledige record. Alles wat naar het importrecord verwijst — orders,
 * offertes, reserveringen, herkomst op werken — wordt omgeleid, velden die
 * het volledige record mist worden overgenomen, en dan pas gaat het
 * importrecord weg. Aankopen die al op het volledige record staan worden
 * niet nog een keer toegevoegd.
 *
 *   node --env-file=.env.local scripts/merge-duplicate-contacts.mjs         # tonen
 *   DRY=0 node --env-file=.env.local scripts/merge-duplicate-contacts.mjs   # uitvoeren
 */
import { createClient } from '@sanity/client'
const c = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production', apiVersion: '2026-06-18', useCdn: false, token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN }).withConfig({ perspective: 'raw' })
const DRY = process.env.DRY !== '0'

const PAREN = [
  { houd: 'GskSHzltiom27vUz3pM6px', weg: 'contact-hist-shirien-van-maurik' },
  { houd: 'k57DXB4TxK58qNiTm5TIJG', weg: 'contact-hist-frans-oomen' },
]

for (const { houd, weg } of PAREN) {
  const [H, W] = await c.fetch(`[*[_id==$h][0], *[_id==$w][0]]`, { h: houd, w: weg })
  if (!H || !W) { console.log(`overgeslagen: ${weg} of ${houd} bestaat niet (meer)`); continue }
  console.log(`\n${W.firstName} ${W.lastName}: ${weg} → ${houd}`)

  // 1. Velden die het volledige record mist, overnemen (nooit overschrijven).
  const aanvulling = {}
  for (const [k, v] of Object.entries(W)) {
    if (k.startsWith('_') || k === 'purchases') continue
    if ((H[k] == null || H[k] === '') && v != null && v !== '') aanvulling[k] = v
  }
  // Het importrecord zegt "gallery" waar het volledige "collector" zegt; het
  // e-mailadres is een galerie-adres, dus dat wint.
  if (W.type === 'gallery' && H.type !== 'gallery') aanvulling.type = 'gallery'
  console.log('  overnemen:', Object.keys(aanvulling).length ? aanvulling : '(niets)')

  // 2. Aankopen die het volledige record nog niet heeft.
  const heeft = new Set((H.purchases ?? []).map((p) => `${p.artwork?._ref}|${p.date ?? ''}`))
  const nieuw = (W.purchases ?? []).filter((p) => !heeft.has(`${p.artwork?._ref}|${p.date ?? ''}`))
  console.log(`  aankopen erbij: ${nieuw.length} (${(W.purchases ?? []).length} op het importrecord, al aanwezig: ${(W.purchases ?? []).length - nieuw.length})`)

  // 3. Wat verwijst naar het importrecord?
  const refs = await c.fetch(`*[references($w)]{_id, _type}`, { w: weg })
  console.log(`  verwijzingen om te leiden: ${refs.length}`, refs.map((r) => `${r._type}:${r._id}`).join(', ') || '')

  if (DRY) continue

  const tx = c.transaction()
  tx.patch(houd, (p) => {
    let q = p.setIfMissing({ purchases: [] })
    if (Object.keys(aanvulling).length) q = q.set(aanvulling)
    if (nieuw.length) q = q.append('purchases', nieuw)
    return q
  })
  // Verwijzingen omleiden: elke _ref naar `weg` wordt `houd`. Documentbreed,
  // via een JSON-vervanging op het hele document — geen veldnamen raden.
  for (const r of refs) {
    const doc = await c.fetch(`*[_id==$id][0]`, { id: r._id })
    const vervangen = JSON.parse(JSON.stringify(doc).split(`"${weg}"`).join(`"${houd}"`))
    tx.createOrReplace(vervangen)
  }
  tx.delete(weg)
  await tx.commit()
  console.log('  samengevoegd.')
}
console.log(DRY ? '\nDroogloop — niets gewijzigd. Uitvoeren met DRY=0.' : '\nKlaar.')

/**
 * Elke pagina van de site één keer openen — en kijken wat eruit komt.
 *
 * Zelfde gedachte als in de gallery-template: de audits kijken naar de data, de
 * testruns naar één flow, dit doet wat een bezoeker doet — overal op klikken.
 *
 * Let op: negen van de pagina's zijn client-componenten en zijn buiten Next
 * niet te renderen (ze gebruiken `useParams`). Voor die pagina's is de
 * API-rondgang de meting.
 *
 *   npx tsx --env-file=.env.local scripts/walkthrough.mts
 *
 * Leest alleen.
 */

import { createClient } from '@sanity/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-06-18',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN
const req = (url: string) => ({
  url, nextUrl: new URL(url),
  cookies: { get: () => undefined },
  headers: { get: (h: string) => (h === 'x-sanity-token' ? TOKEN : null) },
  json: async () => ({}),
}) as never

let stuk = 0, verdacht = 0, ok = 0
const bevindingen: string[] = []

const ROMMEL: [string, RegExp][] = [
  ['undefined', />[^<]*\bundefined\b[^<]*</],
  ['NaN', />[^<]*\bNaN\b[^<]*</],
  ['[object Object]', /\[object Object\]/],
  ['€ NaN of leeg bedrag', /€\s*(NaN|undefined|\s*<)/],
]

async function pagina(label: string, pad: string, params: Record<string, string> = {}) {
  try {
    const mod = await import(pad)
    const uit = mod.default({ params: Promise.resolve(params), searchParams: Promise.resolve({}) })
    const html = renderToStaticMarkup((uit instanceof Promise ? await uit : uit) as ReactElement)
    const tekst = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (tekst.length < 40) {
      console.log(`  ✗ ${label}  — rendert leeg (${tekst.length} tekens)`)
      bevindingen.push(`${label}: lege pagina`); stuk++; return
    }
    const fout = ROMMEL.filter(([, re]) => re.test(html)).map(([n]) => n)
    if (fout.length) {
      console.log(`  ! ${label}  — ${fout.join(', ')}`)
      bevindingen.push(`${label}: ${fout.join(', ')}`); verdacht++; return
    }
    console.log(`  ✓ ${label}  — ${tekst.length} tekens`); ok++
  } catch (err) {
    const m = String((err as Error).message).split('\n')[0].slice(0, 120)
    // JSX draait in deze repo niet buiten Next; dat is een beperking van de
    // meting, geen fout in de pagina.
    if (/React is not defined|useState|useContext|app router/.test(m)) {
      console.log(`  · ${label}  — client-component, niet te renderen buiten Next`)
      return
    }
    console.log(`  ✗ ${label}  — ${m}`)
    bevindingen.push(`${label}: ${m}`); stuk++
  }
}

async function api(label: string, pad: string, url: string, params: Record<string, string> = {}) {
  try {
    const mod = await import(pad)
    const res = await mod.GET(req(url), { params: Promise.resolve(params) } as never)
    if (res.status >= 400) {
      console.log(`  ✗ ${label}  — status ${res.status}`)
      bevindingen.push(`${label}: status ${res.status}`); stuk++; return
    }
    const type = res.headers?.get?.('content-type') ?? ''
    const n = type.includes('json') ? JSON.stringify(await res.json()).length : (await res.arrayBuffer()).byteLength
    console.log(`  ✓ ${label}  — ${res.status}, ${n} bytes`); ok++
  } catch (err) {
    const m = String((err as Error).message).split('\n')[0].slice(0, 120)
    console.log(`  ✗ ${label}  — ${m}`)
    bevindingen.push(`${label}: ${m}`); stuk++
  }
}

const d = await client.fetch<Record<string, string | undefined>>(`{
  "werk": *[_type=="artwork" && defined(slug.current)][0].slug.current,
  "werkId": *[_type=="artwork"][0]._id,
  // Een expositie krijgt alleen een pagina als hasPage aanstaat — de CV-lijst
  // linkt er ook alleen dan naartoe. Zonder dat filter test je een 404 die
  // geen fout is. (Geen backticks in dit commentaar: het staat binnen een
  // template-literal en breekt hem anders.)
  "expo": *[_type=="exhibition" && defined(slug.current) && hasPage == true][0].slug.current,
  "beurs": *[_type=="artFair" && defined(slug.current) && hasPage == true][0].slug.current,
  "project": *[_type=="project" && defined(slug.current)][0].slug.current,
  "order": *[_type=="order"][0].orderNumber,
  "offerte": *[_type=="proposal"][0]._id,
  // De adminpagina leest pressRelease, niet press.
  "pers": *[_type=="pressRelease"][0]._id
}`)

console.log(`Rondgang door "${process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'}"`)
console.log(`  werk ${d.werk} · expo ${d.expo} · beurs ${d.beurs} · project ${d.project} · order ${d.order}\n`)

console.log('── Publieke pagina\'s ──')
await pagina('/', '../src/app/page')
await pagina('/about', '../src/app/(site)/about/page')
await pagina('/works', '../src/app/(site)/works/page')
await pagina('/works/all', '../src/app/(site)/works/all/page')
await pagina('/projects', '../src/app/(site)/projects/page')
await pagina('/contact', '../src/app/(site)/contact/page')
await pagina('/legal-terms', '../src/app/(site)/legal-terms/page')
await pagina('/cookie-policy', '../src/app/(site)/cookie-policy/page')
if (d.werk) await pagina(`/works/${d.werk}`, '../src/app/(site)/works/[slug]/page', { slug: d.werk })
if (d.expo) await pagina(`/exhibitions/${d.expo}`, '../src/app/(site)/exhibitions/[slug]/page', { slug: d.expo })
if (d.beurs) await pagina(`/art-fairs/${d.beurs}`, '../src/app/(site)/art-fairs/[slug]/page', { slug: d.beurs })
if (d.project) await pagina(`/projects/${d.project}`, '../src/app/(site)/projects/[slug]/page', { slug: d.project })
if (d.offerte) await pagina(`/proposal/${d.offerte}`, '../src/app/proposal/[id]/page', { id: d.offerte })

console.log('\n── Admin ──')
if (d.order) await pagina(`/admin/invoices/${d.order}`, '../src/app/admin/invoices/[invoiceNumber]/page', { invoiceNumber: d.order })
if (d.werkId) await pagina('/admin/artwork/coa', '../src/app/admin/artwork/[id]/coa/page', { id: d.werkId })
if (d.pers) await pagina('/admin/press', '../src/app/admin/press/[id]/page', { id: d.pers })

console.log('\n── API\'s ──')
await api('/api/shipping-zones', '../src/app/api/shipping-zones/route', 'http://x/api/shipping-zones')
await api('/api/admin/segments', '../src/app/api/admin/segments/route', 'http://x/api/admin/segments')
await api('/api/admin/search-artworks', '../src/app/api/admin/search-artworks/route', 'http://x/api/admin/search-artworks?q=a')
await api('/api/admin/search-contacts', '../src/app/api/admin/search-contacts/route', 'http://x/api/admin/search-contacts?q=a')
if (d.expo) await api('/api/room/exhibition', '../src/app/api/room/exhibition/[slug]/route', `http://x/api/room/exhibition/${d.expo}`, { slug: d.expo })
if (d.beurs) await api('/api/room/artfair', '../src/app/api/room/artfair/[slug]/route', `http://x/api/room/artfair/${d.beurs}`, { slug: d.beurs })

console.log(`\n── Uitslag ──\n  ${ok} in orde · ${verdacht} verdacht · ${stuk} stuk`)
if (bevindingen.length) {
  console.log('\nWat er langskwam:')
  for (const b of bevindingen) console.log(`  · ${b}`)
}
process.exit(stuk ? 1 : 0)

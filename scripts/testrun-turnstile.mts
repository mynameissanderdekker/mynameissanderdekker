/**
 * De botbeveiliging op de formulieren, via de echte routes.
 *
 * Aanleiding: Cloudflare meldde "siteverify isn't being called" voor de
 * nieuwsbrief van mynameissanderdekker.com. De code léék te kloppen — er stond
 * een siteverify-aanroep in — maar hij zat achter `if (secretKey)`. Ontbreekt
 * die sleutel in de omgeving, dan wordt er niets gecontroleerd en staat het
 * formulier open, terwijl de bezoeker een widget ziet draaien.
 *
 * Dat is precies het soort fout dat je niet vindt door te lezen. Dit script
 * roept de routes echt aan, met en zonder sleutel in de omgeving.
 *
 *   npx tsx --env-file=.env.local scripts/testrun-turnstile.mts
 *
 * Er wordt niets weggeschreven: elk verzoek hoort te stranden op de
 * beveiligingscontrole, vóór de route iets doet.
 */

let fails = 0
const check = (l: string, ok: boolean, d = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails++
}

const req = (body: unknown) => ({
  json: async () => body,
  headers: { get: (h: string) => (h.toLowerCase() === 'x-forwarded-for' ? '203.0.113.7' : null) },
}) as never

// De route kan alleen geladen worden als de rest van de omgeving compleet is
// (Sanity, Resend). Ontbreekt die, dan slaan we de routecontroles over in
// plaats van te struikelen — de controles op de sleutel en de hostnames
// hebben geen omgeving nodig en zijn juist bij een verse installatie nuttig.
let contact: { POST: (r: never) => Promise<Response> } | null = null
let laadfout = ''
try { contact = await import('../src/app/api/contact/route') } catch (err) { laadfout = String(err).slice(0, 120) }

// Alle verplichte velden ingevuld, zodat een afwijzing niet van een
// ontbrekend veld kan komen maar alleen van de beveiligingscontrole.
// `category` is van Torch, `subject` van de artist-template.
const volledig = {
  name: 'Bot Botsen', email: 'bot@example.invalid', message: 'hallo',
  category: 'Other', subject: 'other', phone: '', newsletter: false,
}

console.log('── 1–3. Het contactformulier ──')
if (!contact) {
  console.log(`  · overgeslagen — route niet te laden: ${laadfout}`)
  console.log('    (vul .env.local aan om deze drie controles te draaien)')
} else {
  const r1 = await contact.POST(req({ ...volledig }))
  const b1 = await r1.json().catch(() => ({}))
  check('weigert een inzending zonder token', r1.status >= 400, `${r1.status} ${JSON.stringify(b1).slice(0, 70)}`)

  const r2 = await contact.POST(req({ ...volledig, turnstileToken: 'niet-echt-maar-ziet-er-echt-uit' }))
  check('een verzonnen token komt er niet door', r2.status >= 400, `${r2.status}`)

  // De situatie die het gat veroorzaakte: de variabele ontbreekt op de server.
  // Toen liep alles gewoon door; nu hoort de route dicht te gaan.
  const bewaard = process.env.TURNSTILE_SECRET_KEY
  delete process.env.TURNSTILE_SECRET_KEY
  const r3 = await contact.POST(req({ ...volledig, turnstileToken: 'x' }))
  const b3 = await r3.json().catch(() => ({}))
  check('ontbrekende sleutel sluit het formulier (503), laat het niet open',
    r3.status === 503, `${r3.status} ${JSON.stringify(b3).slice(0, 80)}`)
  if (bewaard) process.env.TURNSTILE_SECRET_KEY = bewaard
}

console.log('\n── 4. Is de sleutel van deze site geldig? ──')
// Cloudflare antwoordt `invalid-input-secret` als de sleutel zelf niet deugt,
// en `invalid-input-response` als alleen het token onzin is. Het tweede is
// gezond: de sleutel werkt, dit token niet. Het eerste betekent dat élke
// inzending wordt geweigerd — het formulier is dan stuk zonder dat iemand het
// merkt, want een bezoeker ziet alleen "probeer het opnieuw".
const res4 = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? '', response: 'XXXX.DUMMY.TOKEN.XXXX' }),
})
const codes4 = ((await res4.json().catch(() => ({}))) as { 'error-codes'?: string[] })['error-codes'] ?? []
// Let op: dit toetst de sleutel in *deze* omgeving. Staat er in .env.local een
// plaatshouder terwijl de echte sleutel alleen op Vercel staat, dan faalt dit
// lokaal terecht — en dan hoor je hem hier alsnog goed te zetten, want anders
// werkt het contactformulier op je eigen machine niet.
check('TURNSTILE_SECRET_KEY hoort bij een echte widget',
  !codes4.includes('invalid-input-secret'), codes4.join(', ') || 'geen foutcodes')

// ── De andere publieke formulieren van deze site ─────────────────────────────
// Elk formulier dat zonder inlog een mail of een record kan maken hoort langs
// dezelfde controle. Welke dat zijn verschilt per template; wat er niet is,
// slaan we over.
// De nieuwsbrief heet niet overal hetzelfde: `subscribe` in de artist-template,
// `newsletter` bij ia-kahkonen. Beide staan hier; wat niet bestaat wordt
// overgeslagen.
const overige: { naam: string; pad: string; body: Record<string, unknown> }[] = [
  { naam: 'nieuwsbrief (subscribe)', pad: '../src/app/api/subscribe/route', body: { email: 'bot@example.invalid', firstName: 'Bot', lastName: 'Botsen' } },
  { naam: 'nieuwsbrief (newsletter)', pad: '../src/app/api/newsletter/route', body: { email: 'bot@example.invalid', firstName: 'Bot', lastName: 'Botsen' } },
  { naam: 'werk-aanvraag', pad: '../src/app/api/enquire/route', body: { ...volledig, artworkTitle: 'Iets', artistName: 'Iemand' } },
]
console.log('\n── 5. Andere publieke formulieren ──')
for (const f of overige) {
  let route: { POST: (r: never) => Promise<Response> } | null = null
  try { route = await import(f.pad) } catch (err) {
    const bestaat = !/Cannot find module/.test(String(err))
    console.log(`  · ${f.naam} — ${bestaat ? `route niet te laden: ${String(err).slice(0, 90)}` : 'bestaat niet in deze template'}`)
    continue
  }
  if (!route?.POST) { console.log(`  · ${f.naam} — geen POST-route`); continue }
  const res = await route.POST(req(f.body))
  check(`${f.naam} weigert zonder token`, res.status >= 400, `${res.status}`)
}

console.log('\n── 6. Is er een toegestane hostname? ──')
// Een lege lijst betekent dat élk token wordt afgewezen — de formulieren zijn
// dan dicht voor iedereen, ook voor echte bezoekers. In productie komt de lijst
// uit TURNSTILE_HOSTNAMES, NEXT_PUBLIC_BASE_URL of de Vercel-variabelen.
const { turnstileHosts } = await import('../src/lib/verifyTurnstile')
const hosts = turnstileHosts()
check('er is minstens één toegestane hostname', hosts.length > 0, hosts.join(', ') || 'LEEG — alles wordt geweigerd')

console.log('\n── 7. Token van een ander formulier ──')
// Een token met de verkeerde `action` hoort te stranden. Zonder die controle
// is één token uit de nieuwsbriefwidget genoeg om het contactformulier mee te
// bestoken.
const { verifyTurnstile } = await import('../src/lib/verifyTurnstile')
const r5 = await verifyTurnstile('XXXX.DUMMY.TOKEN.XXXX', { action: 'contact', ip: null })
check('siteverify wordt daadwerkelijk aangeroepen en wijst af', !r5.ok, r5.ok ? 'doorgelaten!' : `${r5.status} ${r5.error}`)

console.log(fails ? `\n${fails} punt(en) kloppen niet.` : '\nDe formulieren zijn dicht.')
process.exit(fails ? 1 : 0)

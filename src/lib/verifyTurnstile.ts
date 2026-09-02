/**
 * De Turnstile-controle: één plek, en dicht als er iets niet klopt.
 *
 * Alle drie de formulieren (nieuwsbrief en contact op beide sites) hadden
 * dezelfde vorm:
 *
 *     const secret = process.env.TURNSTILE_SECRET_KEY
 *     if (secret) { ...controleren... }
 *
 * Staat die sleutel niet in de omgeving, dan wordt er dus **niets**
 * gecontroleerd en gaat het formulier gewoon open. Cloudflare ziet dat van de
 * andere kant: de widget geeft wel tokens uit, maar niemand haalt ze op —
 * "siteverify isn't being called". Een bot die het formulier rechtstreeks
 * aanroept merkt van de widget helemaal niets.
 *
 * Dezelfde fout als bij `ADMIN_PASSWORD`: een ontbrekende sleutel liet
 * iedereen door in plaats van niemand. Daarom hier ook dicht bij twijfel.
 *
 * Verder gecontroleerd, conform de handleiding van Cloudflare:
 *
 *   - `action`  — het token hoort bij dít formulier. Zonder die controle kan
 *                 een token van het contactformulier gebruikt worden om de
 *                 nieuwsbrief te spammen (en andersom).
 *   - `hostname` — het token is op onze eigen site opgehaald, niet op een
 *                 kopie van het formulier elders.
 *
 * Een token is eenmalig: Cloudflare wisselt hem één keer in. Opnieuw
 * aanbieden mislukt vanzelf, dus daar hoeven wij niets voor bij te houden.
 */

export type TurnstileCheck =
  | { ok: true }
  | { ok: false; status: number; error: string }

interface SiteverifyResponse {
  success?: boolean
  action?: string
  hostname?: string
  'error-codes'?: string[]
}

/** Waar het formulier vandaan mag komen. */
function toegestaneHosts(): Set<string> {
  const uitEnv = (process.env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  if (uitEnv.length) return new Set(uitEnv)

  // Geen aparte lijst ingesteld: de site zelf. `NEXT_PUBLIC_BASE_URL` staat in
  // de meeste omgevingen al; Vercel zet de andere twee vanzelf, zodat een
  // installatie zonder eigen basis-URL (ia-kahkonen) niet meteen dichtslaat.
  const hosts = new Set<string>()
  const kandidaten = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]
  for (const k of kandidaten) {
    if (!k) continue
    try {
      hosts.add(new URL(k.startsWith('http') ? k : `https://${k}`).hostname)
    } catch {
      // Een onleesbare waarde is geen reden om alles toe te laten.
    }
  }
  // Alleen buiten productie: een productieomgeving hoort nooit een token van
  // localhost te accepteren.
  if (process.env.NODE_ENV !== 'production') {
    hosts.add('localhost')
    hosts.add('127.0.0.1')
  }
  return hosts
}

/**
 * Waar zou een token vandaan mogen komen? Voor `scripts/testrun-turnstile.mts`:
 * een lege lijst betekent dat élke inzending wordt geweigerd, en dat wil je
 * weten vóór je deployt, niet erna.
 */
export function turnstileHosts(): string[] {
  return [...toegestaneHosts()]
}

export async function verifyTurnstile(
  token: unknown,
  opts: { action: string; ip?: string | null }
): Promise<TurnstileCheck> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Niet stilzwijgend doorlaten. Dit is een configuratiefout die je wilt
    // zien in de logs én in het antwoord, niet een gat dat maanden open staat.
    console.error('[turnstile] TURNSTILE_SECRET_KEY ontbreekt — formulier geweigerd')
    return { ok: false, status: 503, error: 'De beveiligingscontrole is niet ingesteld. Neem contact op.' }
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { ok: false, status: 400, error: 'Beveiligingscontrole ontbreekt. Ververs de pagina en probeer opnieuw.' }
  }

  let uitslag: SiteverifyResponse
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Zonder tijdslimiet blijft een formulierinzending hangen als
      // Cloudflare traag is.
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        ...(opts.ip ? { remoteip: opts.ip } : {}),
      }),
    })
    // Ook bij een 4xx het antwoord uitlezen: Cloudflare zet de reden in
    // `error-codes`, en juist die wil je in de logs zien. Een generieke
    // "onbereikbaar" verbergt precies het verschil tussen een verkeerd token
    // (normaal) en een verkeerde sleutel (kapotte configuratie).
    uitslag = (await res.json().catch(() => ({}))) as SiteverifyResponse
    if (!res.ok && !Array.isArray(uitslag['error-codes'])) {
      throw new Error(`siteverify ${res.status}`)
    }
  } catch (err) {
    console.error('[turnstile] siteverify onbereikbaar', err)
    return { ok: false, status: 403, error: 'Beveiligingscontrole mislukt. Probeer het opnieuw.' }
  }

  // De sleutel zelf deugt niet. Dat is geen bezoeker die iets fout doet maar
  // een configuratiefout: elke inzending wordt geweigerd tot hij is opgelost.
  if (uitslag['error-codes']?.includes('invalid-input-secret')) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is ongeldig — controleer de sleutel in Cloudflare')
    return { ok: false, status: 503, error: 'De beveiligingscontrole is niet goed ingesteld. Neem contact op.' }
  }

  const hosts = toegestaneHosts()
  const goed =
    uitslag.success === true &&
    uitslag.action === opts.action &&
    !!uitslag.hostname &&
    hosts.has(uitslag.hostname)

  if (!goed) {
    console.error('[turnstile] afgewezen', {
      success: uitslag.success,
      action: uitslag.action,
      verwachteAction: opts.action,
      hostname: uitslag.hostname,
      codes: uitslag['error-codes'],
    })
    return { ok: false, status: 403, error: 'Beveiligingscontrole mislukt. Probeer het opnieuw.' }
  }

  return { ok: true }
}

/** Het IP van de bezoeker, zoals de proxy het doorgeeft. */
export function clientIp(req: { headers: { get(name: string): string | null } }): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

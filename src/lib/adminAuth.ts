import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Toegang tot /admin en de admin-API's.
 *
 * Wat er stond: routes vergeleken een `admin_session`-cookie met
 * `ADMIN_PASSWORD`, maar niets zette die cookie ooit — er was geen login — en
 * `ADMIN_PASSWORD` stond niet in de omgeving. `undefined !== undefined` is
 * onwaar, dus elke controle liet iedereen door. De factuurpagina had helemaal
 * geen controle. Gevolg: elke factuur (naam, adres, BTW-nummer, wat iemand
 * kocht en voor hoeveel) was voor iedereen te lezen op een URL met een
 * oplopend nummer, net als de verkooplijst, de certificaten en de
 * consignatie-overeenkomsten.
 *
 * Twee regels nu:
 *   - **fail closed**: geen `ADMIN_PASSWORD` betekent niemand erin, niet iedereen
 *   - de cookie bevat niet het wachtwoord zelf maar een afgeleide (HMAC), zodat
 *     een gelekte cookie het wachtwoord niet prijsgeeft
 *
 * Studio-gebruikers komen ook binnen met hun Sanity-token in de
 * `x-sanity-token`-header; de Studio-knoppen sturen die al mee.
 */

export const ADMIN_COOKIE = 'admin_session'

/** De waarde die in de cookie hoort. `null` als er geen wachtwoord is ingesteld. */
export function adminCookieValue(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return createHmac('sha256', pw).update('admin-session-v1').digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Klopt deze cookiewaarde? Fail closed. */
export function isValidAdminCookie(value: string | undefined | null): boolean {
  const expected = adminCookieValue()
  if (!expected || !value) return false
  return safeEqual(value, expected)
}

/** Is dit een geldig Sanity-token van een ingelogde Studio-gebruiker? */
export async function isValidSanityToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  try {
    const res = await fetch('https://api.sanity.io/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Voor API-routes: cookie óf Sanity-token. Werkt met een `Request` of een
 * `NextRequest` (die heeft `cookies.get`).
 */
export async function isAdminRequest(req: {
  headers: { get(name: string): string | null }
  cookies?: { get(name: string): { value: string } | undefined }
}): Promise<boolean> {
  const cookie = req.cookies?.get(ADMIN_COOKIE)?.value
    ?? req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`))?.[1]
  if (isValidAdminCookie(cookie)) return true
  return isValidSanityToken(req.headers.get('x-sanity-token'))
}

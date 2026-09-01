/**
 * Wie deze site is — één plek.
 *
 * Werkt voor een galerie en voor een kunstenaar: het gaat om de naam, het
 * adres en de zakelijke gegevens die onder documenten en mails komen.
 *
 * Deze gegevens stonden verspreid in `siteSettings` (`addresses[]`,
 * `invoiceSettings`) en daarnaast hardcoded door de code heen.
 * Welke won hing af van welke code je toevallig raakte, en bij hergebruik van
 * de template stond er "TORCH Gallery, Lauriergracht 94" op andermans
 * certificaat.
 *
 * De volgorde is: het adres dat is aangevinkt voor facturen wint, daarna het
 * adres in `invoiceSettings`, en pas dan niets. Zo blijft een
 * bestaande installatie werken terwijl een nieuwe alleen de adressenlijst
 * hoeft te vullen.
 *
 * Gebruik:
 *   const g = await getSiteIdentity(client)
 *   g.name          // "TORCH gallery"
 *   g.addressLine   // "Lauriergracht 94, 1016 RN Amsterdam"
 *   g.footerLine    // "TORCH gallery · Lauriergracht 94, 1016 RN Amsterdam · info@…"
 */

export interface SiteIdentity {
  name: string
  legalName: string
  street: string
  postalCode: string
  city: string
  country: string
  phone: string
  email: string
  website: string
  kvkNumber: string
  vatNumber: string
  iban: string
  bic: string
  logoUrl: string
  /** "Lauriergracht 94, 1016 RN Amsterdam" — leeg als er geen adres is. */
  addressLine: string
  /** Naam · adres · e-mail, voor onderaan een document. */
  footerLine: string
  /** Naam · website, voor een smalle voettekst. */
  shortFooterLine: string
}

export const SITE_IDENTITY_QUERY = `*[_type == "siteSettings"][0]{
  siteName,
  email,
  "logoUrl": logo.asset->url,
  "invoiceAddress": addresses[useForInvoices == true][0],
  invoiceSettings
}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSiteIdentity(s: any): SiteIdentity {
  const addr = s?.invoiceAddress ?? {}
  const inv  = s?.invoiceSettings ?? {}

  const pick = (...vals: unknown[]) =>
    (vals.find((v) => typeof v === 'string' && v.trim() !== '') as string) ?? ''

  const name       = pick(s?.siteName, inv.legalName)
  const street     = pick(addr.street, inv.address)
  const postalCode = pick(addr.postalCode, inv.postalCode)
  const city       = pick(addr.city, inv.city)
  const country    = pick(addr.country, inv.country)
  const email      = pick(s?.email)
  const website    = pick(inv.website)

  const addressLine = [street, [postalCode, city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  return {
    name,
    legalName: pick(inv.legalName, s?.siteName),
    street, postalCode, city, country,
    phone: pick(addr.phone, inv.phone),
    email, website,
    kvkNumber: pick(inv.kvkNumber),
    vatNumber: pick(inv.vatNumber),
    iban: pick(inv.iban),
    bic: pick(inv.bic),
    logoUrl: pick(s?.logoUrl),
    addressLine,
    footerLine: [name, addressLine, email].filter(Boolean).join(' · '),
    shortFooterLine: [name, website].filter(Boolean).join(' · '),
  }
}

/** Haalt de gegevens op met een Sanity-client die een `fetch` heeft. */
export async function getSiteIdentity(
  client: { fetch: <T>(q: string) => Promise<T> }
): Promise<SiteIdentity> {
  const s = await client.fetch<unknown>(SITE_IDENTITY_QUERY).catch(() => null)
  return buildSiteIdentity(s)
}

import type { SanityClient } from '@sanity/client'

/**
 * Het volgende nummer in de factuurreeks.
 *
 * Deze regel stond op drie plekken en week op de belangrijkste af. De
 * verkooptool en de offerte haalden een net nummer op — SDK-26-004 — maar de
 * webshop zette er `${prefix}-${Date.now()}` neer: SDK-1788290398168.
 *
 * Dat is geen kosmetisch verschil. De belastingdienst verlangt een
 * doorlopende, ononderbroken nummering per boekjaar; twee reeksen naast
 * elkaar, waarvan één een tijdstempel, is dat niet. En bij een vraag over
 * "factuur 004" moest je raden welke reeks bedoeld werd.
 *
 * Alle drie de ingangen lopen nu hierlangs, zodat een webshopbestelling en
 * een verkoop aan de balie in dezelfde reeks vallen.
 *
 * Let op: dit geeft alleen een kandidaat. Twee aanroepen op hetzelfde moment
 * krijgen hetzelfde nummer — "theoretisch mogelijk" stond hier, en het bleek
 * bij de eerste meting gewoon te gebeuren (scripts/testrun-double-sale.mts:
 * twee orders, allebei -006). Wie een order aanmaakt gebruikt daarom
 * `createNumberedOrder` in lib/createOrder.ts: die maakt het nummer uniek via
 * het document-id en probeert bij een botsing opnieuw. Roep `nextNumber` dus
 * niet rechtstreeks aan om een order te schrijven.
 */
export async function nextNumber(
  client: SanityClient,
  opts: { type?: 'invoice' | 'proposal'; fallbackPrefix?: string } = {}
): Promise<string> {
  const { type = 'invoice', fallbackPrefix = 'SDK' } = opts

  const yy = String(new Date().getFullYear()).slice(-2)
  const prefix =
    (await client.fetch<string | null>(
      `*[_type == "siteSettings"][0].invoiceSettings.invoicePrefix`
    )) ?? fallbackPrefix
  const base = `${prefix}-${yy}-`

  // Drie velden, want de wegen zijn het oneens: de verkooptool schrijft het
  // nummer in `orderNumber`, de webshopfactuur in `invoiceNumber`, en een
  // offerte houdt zijn eigen reeks bij. Naar één ervan kijken levert een
  // nummer op dat al bestaat.
  const [lastOrder, lastInvoice, lastProposal] = await Promise.all([
    client.fetch<string | null>(
      `*[_type == "order" && orderNumber match $p] | order(orderNumber desc)[0].orderNumber`,
      { p: `${base}*` }
    ),
    client.fetch<string | null>(
      `*[_type == "order" && invoiceNumber match $p] | order(invoiceNumber desc)[0].invoiceNumber`,
      { p: `${base}*` }
    ),
    client.fetch<string | null>(
      `*[_type == "proposal" && proposalNumber match $p] | order(proposalNumber desc)[0].proposalNumber`,
      { p: `PROP-${base}*` }
    ),
  ])

  const seqFrom = (s: string | null) => {
    if (!s) return 0
    const n = parseInt(s.split('-').pop() ?? '0', 10)
    return isNaN(n) ? 0 : n
  }

  let next = Math.max(seqFrom(lastOrder), seqFrom(lastInvoice), seqFrom(lastProposal)) + 1
  const maak = (n: number) => {
    const seq = String(n).padStart(3, '0')
    return type === 'proposal' ? `PROP-${base}${seq}` : `${base}${seq}`
  }

  // Doorschuiven zolang het nummer bezet is. Nodig omdat oudere documenten
  // niet altijd netjes oplopen — een handmatig ingetypt nummer kan hoger
  // liggen dan wat hierboven is gevonden.
  for (let poging = 0; poging < 25; poging++) {
    const kandidaat = maak(next)
    const bezet = await client.fetch<number>(
      `count(*[(_type == "order" && (orderNumber == $n || invoiceNumber == $n))
              || (_type == "proposal" && proposalNumber == $n)])`,
      { n: kandidaat }
    )
    if (!bezet) return kandidaat
    next++
  }

  // Onwaarschijnlijk, maar beter een nummer dat opvalt dan een botsing die
  // stilletjes twee facturen hetzelfde nummer geeft.
  return `${base}${Date.now()}`
}

import type { SanityClient } from '@sanity/client'

/**
 * Prijs, voorraad en kortingscode bepaalt de server, niet de browser.
 *
 * `create-session` nam alles over uit het verzoek: `priceIncl` ging
 * rechtstreeks in de Stripe-sessie, en de kortingscode kwam als kant-en-klaar
 * bedrag binnen (`coupon.discountAmount`, `coupon.value`, `coupon.type`) — de
 * uitkomst van `validate-coupon`, maar dan zoals de klant hem terugstuurde.
 * Niets keek in de collectie of het werk bestond, te koop was, op voorraad was,
 * of wat het kostte. Wie de winkelwagen aanpaste kon elk werk voor €0,01
 * afrekenen, en een kortingscode van 100% verzinnen.
 *
 * Deze module is de enige plek waar een webshopprijs wordt bepaald.
 */

export interface CartLine {
  /** `<artworkId>` of `<artworkId>::<sku of label>` voor een uitvoering. */
  id: string
  quantity?: number
}

export interface PricedLine {
  artworkId: string
  title: string
  /** Inclusief BTW, per stuk. */
  priceIncl: number
  priceExcl: number
  vatRate: number
  quantity: number
  variantLabel?: string
  imageUrl?: string
}

export class CheckoutError extends Error {}

const cent = (n: number) => Math.round(n * 100) / 100

export async function priceCart(client: SanityClient, lines: CartLine[]): Promise<PricedLine[]> {
  const out: PricedLine[] = []

  for (const line of lines) {
    const [baseId, variantKey] = String(line.id).replace(/^drafts\./, '').split('::')
    const q = Math.max(1, Math.floor(line.quantity ?? 1))

    const doc = await client.fetch<{
      _id: string; _type: string; title: string; status?: string; availableInShop?: boolean
      stock?: number | null; vatRate?: number | string
      priceExclVAT?: number; priceIncVat?: number; onSale?: boolean; salePrice?: number
      options?: { label?: string; sku?: string; priceExclVAT?: number }[]
      imageUrl?: string
    } | null>(
      `*[_type in ["artwork", "publication"] && _id == $id && !(_id in path("drafts.**"))][0]{
        _id, _type, title, status, availableInShop, stock, vatRate,
        priceExclVAT, priceIncVat, onSale, salePrice,
        options[]{ label, sku, priceExclVAT },
        "imageUrl": images[0].asset->url
      }`,
      { id: baseId }
    )
    if (!doc) throw new CheckoutError(`Dit werk bestaat niet meer.`)
    if (doc.availableInShop === false) throw new CheckoutError(`"${doc.title}" is niet online te koop.`)
    if (doc.status === 'sold') throw new CheckoutError(`"${doc.title}" is verkocht.`)

    const vat = Number(doc.vatRate ?? 9)

    // Uitvoering (optie) gekozen? Zoeken op sku, anders op label.
    let variant: { label?: string; sku?: string; priceExclVAT?: number } | undefined
    if (variantKey) {
      variant = doc.options?.find((o) => o.sku === variantKey) ?? doc.options?.find((o) => o.label === variantKey)
      if (!variant) throw new CheckoutError(`Uitvoering "${variantKey}" van "${doc.title}" bestaat niet meer.`)
    }

    // Prijs: optie wint (excl. → incl.), anders sale-prijs als die aanstaat,
    // anders de catalogusprijs incl., anders excl. + BTW.
    let priceIncl: number | undefined
    if (variant?.priceExclVAT != null) priceIncl = cent(variant.priceExclVAT * (1 + vat / 100))
    else if (doc.onSale && doc.salePrice != null) priceIncl = doc.salePrice
    else if (doc.priceIncVat != null) priceIncl = doc.priceIncVat
    else if (doc.priceExclVAT != null) priceIncl = cent(doc.priceExclVAT * (1 + vat / 100))
    if (priceIncl == null || priceIncl <= 0) throw new CheckoutError(`"${doc.title}" heeft geen prijs.`)

    // Voorraad: een uniek werk is er één; een editie of publicatie telt `stock`.
    const beschikbaar = doc.stock != null ? doc.stock : (doc.status === 'available' ? 1 : 0)
    if (beschikbaar < q) {
      throw new CheckoutError(beschikbaar === 0
        ? `"${doc.title}" is niet meer beschikbaar.`
        : `"${doc.title}" heeft nog maar ${beschikbaar} stuks op voorraad.`)
    }

    out.push({
      artworkId: doc._id,
      title: variant?.label ? `${doc.title} — ${variant.label}` : doc.title,
      priceIncl, priceExcl: cent(priceIncl / (1 + vat / 100)), vatRate: vat,
      quantity: q, variantLabel: variant?.label, imageUrl: doc.imageUrl,
    })
  }
  return out
}

export interface AppliedCoupon {
  code: string
  sanityId: string
  type: 'percentage' | 'fixed'
  value: number
  discountAmount: number
}

/**
 * De kortingscode opnieuw beoordelen op de server, tegen het servertotaal.
 * Dezelfde regels als `validate-coupon`; een ongeldige code geeft `null`, geen
 * fout — de klant krijgt dan gewoon geen korting.
 */
export async function applyCoupon(client: SanityClient, code: string | undefined | null, orderTotal: number): Promise<AppliedCoupon | null> {
  if (!code) return null
  const today = new Date().toISOString().split('T')[0]
  const coupon = await client.fetch<{
    _id: string; code: string; type: 'percentage' | 'fixed'; value: number
    validFrom?: string; validUntil?: string; usageLimit?: number; usageCount?: number; minOrderAmount?: number
  } | null>(`*[_type == "coupon" && code == $code && active == true][0]`, { code: code.trim().toUpperCase() })
  if (!coupon) return null
  if (coupon.validFrom && today < coupon.validFrom) return null
  if (coupon.validUntil && today > coupon.validUntil) return null
  if (coupon.usageLimit != null && (coupon.usageCount ?? 0) >= coupon.usageLimit) return null
  if (coupon.minOrderAmount != null && orderTotal < coupon.minOrderAmount) return null

  const discountAmount = coupon.type === 'percentage'
    ? cent(orderTotal * coupon.value / 100)
    : Math.min(coupon.value, orderTotal)

  return { code: coupon.code, sanityId: coupon._id, type: coupon.type, value: coupon.value, discountAmount }
}

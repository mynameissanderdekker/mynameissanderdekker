import type { SanityClient, Transaction } from '@sanity/client'

/**
 * Wat er met een werk gebeurt zodra het verkocht is.
 *
 * Dit stond twee keer, en de twee versies deden iets anders. `createSale` (de
 * verkooptool en de mobiele app) boekte bij een editie de voorraad af en zette
 * pas op `sold` bij nul, en haalde het werk uit de webshop. `processOrder` (de
 * Stripe-webhook) zette elk artwork meteen op `sold` — ook een editie van vijf
 * — en liet `availableInShop` aan staan, zodat een verkocht stuk in de winkel
 * bleef liggen. Publicaties vielen daar bovendien in een tak die bedoeld was
 * voor het inmiddels verwijderde `webshopItem`, en werden nooit als verkocht
 * gemarkeerd.
 *
 * Eén regel, één plek. Wie het aanroept maakt niet uit — de uitkomst hoort
 * hetzelfde te zijn.
 */
export async function markSold(
  client: SanityClient,
  itemId: string,
  quantity = 1,
  variant?: string,
  opts: {
    /**
     * Onderdeel van een grotere transactie (order + werk in één keer). Dan
     * wordt hier niets gecommit; de aanroeper doet dat.
     */
    tx?: Transaction
    /**
     * Alleen schrijven als het werk sinds het lezen niet is veranderd. Twee
     * verkopen op hetzelfde moment lezen allebei "beschikbaar"; met deze
     * controle slaagt er precies één en faalt de transactie van de ander.
     * Zonder: scripts/testrun-double-sale.mts liet twee orders ontstaan.
     */
    ifRevisionId?: string
  } = {}
): Promise<void> {
  // Een variant (bv. "Signed") heeft eigen voorraad, los van het basisproduct.
  // Die werd nooit afgeboekt: een gesigneerde editie van 2 bleef na verkoop
  // gewoon op 2 staan en kon opnieuw worden besteld.
  if (variant) {
    const v = await client.fetch<{ _key: string; stock?: number } | null>(
      `*[_id == $id][0].shopVariants[lower(badge) == lower($b)][0]{ _key, stock }`,
      { id: itemId, b: variant }
    )
    if (v) {
      const remaining = Math.max((v.stock ?? 1) - quantity, 0)
      const vp = client.patch(itemId)
        .set({
          [`shopVariants[_key=="${v._key}"].stock`]: remaining,
          ...(remaining === 0 ? { [`shopVariants[_key=="${v._key}"].status`]: 'sold' } : {}),
        })
      if (opts.ifRevisionId) vp.ifRevisionId(opts.ifRevisionId)
      if (opts.tx) opts.tx.patch(vp); else await vp.commit()
    }
    return
  }

  const art = await client.fetch<{
    _type?: string
    editionType?: string
    editionTotal?: number
    stock?: number
    status?: string
  } | null>(
    `*[_id == $id][0]{ _type, editionType, editionTotal, stock, status }`,
    { id: itemId }
  )
  if (!art) return

  const patch = client.patch(itemId)
  if (opts.ifRevisionId) patch.ifRevisionId(opts.ifRevisionId)

  // Een publicatie is per definitie een oplage: daar telt de voorraad, niet
  // het editietype.
  const isEdition =
    art._type === 'publication' ||
    (art.editionType === 'edition' && (art.editionTotal ?? 0) > 1)

  if (isEdition) {
    const remaining = (art.stock ?? art.editionTotal ?? 1) - quantity
    patch.set({ stock: Math.max(remaining, 0) })
    if (remaining <= 0) patch.set({ status: 'sold', availableInShop: false })
    // Stond het in optie en zijn er nog exemplaren, dan is het weer te koop.
    else if (art.status === 'reserved') patch.set({ status: 'available' })
  } else {
    patch.set({ status: 'sold', availableInShop: false })
  }

  // Een verkoop maakt een optie ongeldig, ook als iemand anders kocht. Bleef
  // dit staan, dan hield het werk zijn plek in ⏳ Reservations en bood het
  // reserveringspaneel "verlengen" aan voor iets dat verkocht is.
  patch.unset(['reservedFor', 'reservedUntil', 'reservedNote'])

  if (opts.tx) opts.tx.patch(patch)
  else await patch.commit()
}

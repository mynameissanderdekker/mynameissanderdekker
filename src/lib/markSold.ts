import type { SanityClient } from '@sanity/client'

/**
 * Wat er met een werk gebeurt zodra het verkocht is.
 *
 * Dit gebeurde hier hélemaal niet. Noch de verkooptool (`/api/manual-sale`)
 * noch de webshop-webhook raakte het werk aan: alleen de synchronisatie vanuit
 * Torch zette ooit een status op `sold`. Verkocht je iets via je eigen site,
 * dan bleef het op `available` staan — zichtbaar in de webshop, opnieuw te
 * koop, en de voorraad liep niet terug.
 *
 * Eén regel, één plek, gedeeld met de gallery-template.
 */
export async function markSold(
  client: SanityClient,
  itemId: string,
  quantity = 1
): Promise<void> {
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

  await patch.commit()
}

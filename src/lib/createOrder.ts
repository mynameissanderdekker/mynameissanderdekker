import type { SanityClient, Transaction } from '@sanity/client'
import { nextNumber } from './nextNumber'

/**
 * Een order aanmaken met een nummer dat gegarandeerd uniek is — ook als twee
 * verkopen op precies hetzelfde moment binnenkomen.
 *
 * `nextNumber` leest het hoogste nummer en telt er één bij op. Twee aanroepen
 * tegelijk lezen hetzelfde hoogste nummer en komen op hetzelfde nieuwe nummer
 * uit. Gemeten met scripts/testrun-double-sale.mts: twee orders, allebei
 * TGA-26-006. Twee facturen met hetzelfde nummer is geen schoonheidsfout;
 * de belastingdienst verlangt een unieke, doorlopende reeks.
 *
 * De oplossing zit niet in de teller maar in het document-id: de order krijgt
 * `_id: order-<nummer>`. Sanity weigert een `create` op een id dat al bestaat,
 * dus van twee gelijktijdige pogingen slaagt er precies één; de ander krijgt
 * een foutmelding, haalt een vers nummer en probeert opnieuw. Geen aparte
 * teller die onderhouden moet worden, geen lock.
 *
 * Alles wat bij de verkoop hoort (het werk op verkocht zetten, met
 * revisiecontrole) gaat in dezelfde transactie via `addToTx`. Faalt dat deel,
 * dan ontstaat er ook geen order — een halve verkoop bestaat niet.
 */
export function orderIdFor(orderNumber: string): string {
  return `order-${orderNumber.replace(/[^A-Za-z0-9._-]/g, '-')}`
}

export async function createNumberedOrder<T extends Record<string, unknown>>(
  client: SanityClient,
  build: (orderNumber: string) => T,
  opts: {
    /** Probeer eerst dit nummer (bv. het offertenummer); anders het volgende vrije. */
    preferredNumber?: string | null
    /** Extra mutaties in dezelfde transactie — bv. het werk op verkocht zetten. */
    addToTx?: (tx: Transaction) => Promise<void>
    numberOpts?: Parameters<typeof nextNumber>[1]
  } = {}
): Promise<{ _id: string; orderNumber: string }> {
  let laatsteFout: unknown = null
  for (let poging = 0; poging < 5; poging++) {
    const orderNumber =
      poging === 0 && opts.preferredNumber ? opts.preferredNumber : await nextNumber(client, opts.numberOpts)
    const _id = orderIdFor(orderNumber)

    const tx = client.transaction().create({ _id, _type: 'order', orderNumber, ...build(orderNumber) })
    if (opts.addToTx) await opts.addToTx(tx)

    try {
      await tx.commit()
      return { _id, orderNumber }
    } catch (err) {
      const msg = String((err as Error).message ?? err)
      // Het nummer is intussen bezet: opnieuw met een vers nummer.
      if (/already exists/i.test(msg)) { laatsteFout = err; continue }
      // Het werk is intussen veranderd (verkocht door iemand anders): niet
      // opnieuw proberen, dat is precies wat we wilden voorkomen.
      if (/revision/i.test(msg)) {
        throw new Error('Dit werk is zojuist door iemand anders verkocht. De verkoop is niet vastgelegd.')
      }
      throw err
    }
  }
  throw new Error(`Geen vrij ordernummer gevonden na 5 pogingen: ${String((laatsteFout as Error)?.message ?? '')}`)
}

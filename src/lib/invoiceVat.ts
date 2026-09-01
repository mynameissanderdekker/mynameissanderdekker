/**
 * Welk BTW-tarief geldt er voor deze klant?
 *
 * De factuur — web én PDF — rekende altijd het Nederlandse tarief, ongeacht
 * `clientLocation` op het contact. Een Duitse zakelijke klant met BTW-nummer
 * kreeg dus 9% of 21% op zijn factuur, terwijl daar 0% met "BTW verlegd" hoort
 * te staan. Buiten de EU idem: 0%, export.
 *
 * Eén helper voor beide weergaven, zodat ze niet uit elkaar kunnen lopen —
 * dat is precies wat er met de orderfilters gebeurde.
 *
 * Let op: dit is een technische omzetting, geen belastingadvies. Of "BTW
 * verlegd" mag, hangt af van een geldig BTW-nummer van de afnemer; die
 * controle hoort bij het invullen van het contact, niet hier.
 */

export type ClientLocation = 'nl' | 'eu' | 'export' | 'world' | undefined | null

export interface VatTreatment {
  /** Het tarief dat op de factuur komt. 0 bij verlegd of export. */
  rate: (baseRate: number) => number
  /** Regel onder de totalen, of null bij een gewone binnenlandse factuur. */
  note: { en: string; nl: string } | null
}

export function vatTreatment(location: ClientLocation): VatTreatment {
  switch (location) {
    case 'eu':
      return {
        rate: () => 0,
        note: {
          en: 'VAT reverse charged — Article 138 EU VAT Directive.',
          nl: 'BTW verlegd — artikel 138 EU-btw-richtlijn.',
        },
      }
    // `world` is de waarde die het price-list-schema gebruikt, `export` die van
    // het contact. Twee namen voor hetzelfde geval; beide hier afgevangen.
    case 'export':
    case 'world':
      return {
        rate: () => 0,
        note: {
          en: 'Export outside the EU — 0% VAT.',
          nl: 'Uitvoer buiten de EU — 0% btw.',
        },
      }
    default:
      // 'nl' en niet ingevuld: het gewone tarief van het werk.
      return { rate: (baseRate) => baseRate, note: null }
  }
}

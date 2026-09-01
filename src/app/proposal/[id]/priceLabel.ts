/**
 * Het bedrag dat de klant op de offerte ziet.
 *
 * Stond als `fmt` in ProposalPage.tsx. Hierheen gehaald omdat het geen opmaak
 * is maar een toezegging: dit getal is wat de klant denkt te gaan betalen, en
 * het hoort te kloppen met de factuur. Als losse functie is dat te toetsen —
 * `scripts/testrun-proposal.mts` legt beide naast elkaar.
 *
 * De fout die hier zat: `priceOverride` bewaart volgens het schema een bedrag
 * **exclusief** BTW ("Price override (€ excl. BTW)"). De oude versie nam dat
 * getal ongewijzigd over en zette er voor een Nederlandse klant "incl. 9% btw"
 * achter. Sprak de galerie €1800 af, dan las de klant "€ 1.800 incl. 9% btw"
 * terwijl de factuur €1962 werd — €162 verschil, precies de BTW.
 */

export interface ProposalPriceItem {
  showPrice?: boolean
  priceOverride?: number
  artwork?: {
    priceIncVat?: number
    priceExVat?: number
    vatRate?: string | number
  }
}

/** BTW-tarief als getal; standaard 9% (het kunsttarief). */
function rate(aw: ProposalPriceItem['artwork']): number {
  const n = Number(aw?.vatRate ?? 9)
  return Number.isFinite(n) ? n : 9
}

export function fmtProposalPrice(
  item: ProposalPriceItem,
  clientLocation = 'nl'
): string | null {
  const aw = item.artwork
  const btw = rate(aw)
  const euro = (n: number) => '€ ' + Math.round(n).toLocaleString('nl-NL')

  // Een afgesproken prijs is altijd exclusief BTW. Wat de klant te zien krijgt
  // hangt af van waar hij zit, dus reken hier terug of bij.
  const excl = item.priceOverride
    ?? aw?.priceExVat
    ?? (aw?.priceIncVat != null ? aw.priceIncVat / (1 + btw / 100) : undefined)

  if (excl == null) return null

  if (clientLocation === 'nl') {
    // Staat er een catalogusprijs incl. BTW én is er geen korting afgesproken,
    // dan is dát het getal dat de galerie zelf heeft ingevoerd — dat afronden
    // via de excl.-omweg zou een euro kunnen schelen.
    const incl = item.priceOverride == null && aw?.priceIncVat != null
      ? aw.priceIncVat
      : excl * (1 + btw / 100)
    return `${euro(incl)} incl. ${btw}% btw`
  }

  // Binnen de EU wordt de BTW verlegd, buiten de EU geldt 0%. In beide gevallen
  // betaalt de klant het bedrag exclusief.
  if (clientLocation === 'eu') return `${euro(excl)} excl. btw`
  return euro(excl)
}

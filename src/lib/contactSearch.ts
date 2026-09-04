/**
 * Eén zoekregel voor contacten, per woord.
 *
 * Drie plekken (verkooptool, reserveringspaneel, mobiele app) zochten met
 * `firstName match $q || lastName match $q || …` op de hele invoer. Typ je
 * "Tessa Testklant" — het meest voor de hand liggende — dan vind je niets:
 * geen enkel veld bevat de volledige naam. Alleen "Tessa" of "Testklant" los
 * werkte, en dat weet een medewerker niet.
 *
 * Nu: elk woord moet ergens voorkomen (voornaam, achternaam, bedrijf, e-mail
 * of het oude `name`-veld). "Tessa Testklant", "Testklant Tessa" en
 * "tessa example" vinden allemaal hetzelfde contact.
 */
export function contactSearchFilter(input: string, maxWords = 4): { filter: string; params: Record<string, string> } {
  const woorden = input.trim().split(/\s+/).filter(Boolean).slice(0, maxWords)
  if (!woorden.length) return { filter: 'false', params: {} }
  const params: Record<string, string> = {}
  const delen = woorden.map((w, i) => {
    params[`w${i}`] = `${w}*`
    return `(firstName match $w${i} || lastName match $w${i} || company match $w${i} || email match $w${i} || name match $w${i})`
  })
  return { filter: `(${delen.join(' && ')})`, params }
}

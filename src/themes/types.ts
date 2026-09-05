/**
 * Wat een thema ís — zie themes/types.ts in gingerbeard-gallery voor de
 * volledige afweging. Kort: een klant is een Sanity-project, een
 * Vercel-project en een thema. Het thema is code voor wat niet uit Sanity kan
 * komen (lettertypen, uitgangstokens); wat een kunstenaar zelf mag veranderen
 * staat in Site Settings → Appearance en gaat óver het thema.
 */
export interface Theme {
  name: string
  /** Klassenamen van next/font, als het thema die gebruikt. Leeg = systeemstack uit globals.css. */
  fontClassName: string
  /** CSS-variabelen die de standaardwaarden uit globals.css overschrijven. Leeg = standaard. */
  tokens: Record<string, string>
}

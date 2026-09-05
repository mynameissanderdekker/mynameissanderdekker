/**
 * Wat een galerie zelf aan het uiterlijk mag veranderen, zonder code.
 *
 * Site Settings → Appearance. Elk veld hier komt overeen met een
 * CSS-variabele uit globals.css; leeg laten betekent "zoals het thema het
 * zegt". Dit is bewust een kórte lijst: accent, achtergrond, tekst en
 * hoekafronding vangen het grootste deel van "kan het iets meer van ons
 * zijn?", zonder dat een galerie een pagina onleesbaar kan maken.
 *
 * Wat hier níet in zit, en waarom: lettertypen (moeten bij het bouwen bekend
 * zijn — dat is het thema), de grijsschaal (te veel knoppen om goed te
 * zetten; volgt uit tekst- en achtergrondkleur), en lay-out.
 */
export interface Appearance {
  accentColor?: string
  accentTextColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: 'none' | 'small' | 'medium' | 'round'
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Alleen een echte hexkleur komt erdoor; alles anders wordt genegeerd. */
function kleur(v?: string): string | undefined {
  const w = v?.trim()
  return w && HEX.test(w) ? w : undefined
}

const RADIUS: Record<NonNullable<Appearance['borderRadius']>, [string, string]> = {
  none:   ['0px',   '0px'],
  small:  ['4px',   '2px'],
  medium: ['10px',  '6px'],
  round:  ['999px', '10px'],
}

export function appearanceTokens(a?: Appearance | null): Record<string, string> {
  if (!a) return {}
  const t: Record<string, string> = {}
  const accent = kleur(a.accentColor)
  const accentText = kleur(a.accentTextColor)
  const bg = kleur(a.backgroundColor)
  const text = kleur(a.textColor)

  if (accent) { t['--color-accent'] = accent; t['--tone-ink'] = accent }
  if (accentText) t['--color-accent-text'] = accentText
  if (bg) { t['--color-bg'] = bg; t['--tone-paper'] = bg }
  if (text) t['--color-text'] = text
  if (a.borderRadius && RADIUS[a.borderRadius]) {
    const [r, rs] = RADIUS[a.borderRadius]
    t['--radius'] = r
    t['--radius-sm'] = rs
  }
  return t
}

/**
 * De tokens als één CSS-regel voor op de pagina, laag over laag: het thema
 * eerst, dan wat de galerie in Site Settings zette. Een latere laag wint.
 * Staat hier apart van themes/ omdat dat next/font laadt en dus alleen binnen
 * Next draait — en dit moet ook in een testrun te controleren zijn.
 */
export function tokensAlsCss(...lagen: Array<Record<string, string | undefined> | null | undefined>): string {
  const samen: Record<string, string> = {}
  for (const laag of lagen) {
    for (const [k, v] of Object.entries(laag ?? {})) {
      if (typeof v === 'string' && v.trim()) samen[k] = v.trim()
    }
  }
  const regels = Object.entries(samen).map(([k, v]) => `${k}:${v}`)
  return regels.length ? `:root{${regels.join(';')}}` : ''
}

import type { Theme } from './types'
import { theme as standaard } from './default'
import { theme as mnsdk } from './mynameissanderdekker'

export type { Theme } from './types'

/**
 * Gekozen met NEXT_PUBLIC_THEME op het Vercel-project. Leeg of onbekend =
 * `default`, en dat is bewust het uiterlijk van vóór de thema's: een
 * ontbrekende variabele mag een site nooit anders laten uitzien.
 */
const THEMAS: Record<string, Theme> = {
  default: standaard,
  mynameissanderdekker: mnsdk,
}

const gekozen = process.env.NEXT_PUBLIC_THEME?.trim().toLowerCase() || 'default'
if (process.env.NEXT_PUBLIC_THEME && !THEMAS[gekozen]) {
  console.warn(`[themes] Onbekend thema "${process.env.NEXT_PUBLIC_THEME}" — standaardthema gebruikt.`)
}

export const theme: Theme = THEMAS[gekozen] ?? standaard

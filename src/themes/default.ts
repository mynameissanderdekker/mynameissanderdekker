import type { Theme } from './types'

/**
 * Het standaardthema: de site zoals hij eruitzag vóór er thema's waren —
 * Helvetica Neue uit de systeemstack, zwart-wit met de Mindmap-roze.
 * mynameissanderdekker draait hierop zolang het Vercel-project geen
 * NEXT_PUBLIC_THEME heeft; er verandert dus niets.
 */
export const theme: Theme = {
  name: 'default',
  fontClassName: '',
  tokens: {},
}

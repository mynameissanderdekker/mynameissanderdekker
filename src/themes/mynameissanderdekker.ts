import { theme as standaard } from './default'
import type { Theme } from './types'

/**
 * Sander Dekker — mynameissanderdekker.com.
 *
 * Gelijk aan het standaardthema: deze site ís het uitgangspunt waarvan de
 * tokens zijn afgemeten. Het bestand bestaat zodat de site een eigen plek
 * heeft zodra `default` ooit een neutraler ontwerp krijgt.
 *
 * Wat hier op termijn thuishoort en nu nog in de core staat: de
 * Mindmap-homepage (src/components/MindmapHomepage.tsx). Die is merk, geen
 * functionaliteit; de kleuren komen al uit --brand-1, de component zelf nog
 * niet uit het thema.
 */
export const theme: Theme = {
  ...standaard,
  name: 'mynameissanderdekker',
}

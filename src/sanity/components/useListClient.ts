'use client'

import { useMemo } from 'react'
import { useClient } from 'sanity'
import { apiVersion } from '../env'

/**
 * De Sanity-client voor lijsten en overzichten in de Studio.
 *
 * Waarom niet gewoon `useClient()`: die geeft van een document met
 * onopgeslagen wijzigingen **twee** resultaten terug — `drafts.<id>` en
 * `<id>`. In een keuzelijst zie je de kunstenaar dan dubbel staan, in een
 * rapportage telt de order twee keer mee. Dat laatste raakte de omzet en de
 * BTW-aangifte.
 *
 * Het `drafts`-perspectief voegt beide samen: één document per id, met het
 * concept als het bestaat. Je ziet dus nog steeds werk dat nog niet
 * gepubliceerd is — precies één keer.
 *
 * Dit vervangt het overal met de hand toevoegen van
 * `!(_id in path("drafts.**"))`. Die regel werd steevast ergens vergeten, en
 * hij verbergt bovendien nieuwe documenten die nog nooit gepubliceerd zijn.
 *
 * **Niet gebruiken** waar de code juist de rauwe id's nodig heeft: de
 * uniciteitscontroles op opslagcodes vergelijken tegen `drafts.<id>` en moeten
 * beide versies zien. Die gebruiken `useClient()` rechtstreeks.
 */
export function useListClient() {
  const client = useClient({ apiVersion })
  // `useClient()` geeft steeds hetzelfde object terug, maar `.withConfig()`
  // maakt er een nieuwe instantie van. Zonder useMemo krijg je die dus bij
  // elke render opnieuw, en omdat componenten `client` in hun
  // useCallback-afhankelijkheden hebben staan, blijven ze in een lus opnieuw
  // ophalen — zichtbaar als een lijst die knippert en op "Loading…" blijft.
  return useMemo(() => client.withConfig({ perspective: 'drafts' }), [client])
}

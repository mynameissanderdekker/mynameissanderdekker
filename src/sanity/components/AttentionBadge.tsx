'use client'

import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { FolderIcon } from '@sanity/icons'
import { apiVersion } from '../env'

/**
 * Pulserend bolletje in de Studio-navigatie voor dingen die actie vragen.
 *
 * Rood = wachtend op jou (nieuwe order, openstaande inzending).
 * Oranje = loopt af of is verlopen (reservering, follow-up, offerte).
 *
 * Gebruik in structure.ts:
 *
 *   .icon(attentionBadge(`count(*[_type == "order" && status == "new"])`))
 *   .icon(attentionBadge(query, { color: 'amber', label: 'reserveringen' }))
 *
 * De teller luistert live mee via een Sanity-listener, dus het bolletje
 * verdwijnt zodra het laatste item is afgehandeld — zonder verversen.
 */

type BadgeColor = 'red' | 'amber'

const DOT: Record<BadgeColor, string> = { red: '🔴', amber: '🟠' }

export function attentionBadge(
  query: string,
  options: { color?: BadgeColor; label?: string; listenOn?: string } = {}
) {
  const { color = 'red', label = 'items', listenOn } = options

  return function AttentionBadge() {
    // 'drafts'-perspectief: anders telt een document waarvan de draft al is
    // afgehandeld maar nog niet gepubliceerd, nog mee via zijn oude revisie.
    const client = useClient({ apiVersion }).withConfig({ perspective: 'drafts' })
    const [count, setCount] = useState(0)

    useEffect(() => {
      let mounted = true

      const fetchCount = () => {
        client.fetch<number>(query, { today: new Date().toISOString().slice(0, 10) })
          .then(n => { if (mounted) setCount(n) })
          .catch(() => { /* stil falen — een badge mag de Studio nooit breken */ })
      }

      fetchCount()

      // Alleen luisteren op het relevante type, niet op de hele dataset.
      const typeMatch = listenOn ?? query.match(/_type\s*==\s*"([a-zA-Z]+)"/)?.[1]
      const subscription = typeMatch
        ? client.listen(`*[_type == "${typeMatch}"]`, {}, { visibility: 'query' }).subscribe(fetchCount)
        : null

      return () => {
        mounted = false
        subscription?.unsubscribe()
      }
    }, [client])

    // Niets te melden: het gewone mapicoon, niet niks. Sanity vult geen
    // standaardicoon aan zodra je er zelf een meegeeft, dus `null` liet de
    // regel inspringen ten opzichte van de rest van de lijst.
    if (!count) return <FolderIcon />

    return (
      <span
        title={`${count} ${label} ${count === 1 ? 'vraagt' : 'vragen'} aandacht`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          fontSize: 11,
          lineHeight: 1,
        }}
      >
        <span className="orders-badge-pulse">{DOT[color]}</span>
      </span>
    )
  }
}

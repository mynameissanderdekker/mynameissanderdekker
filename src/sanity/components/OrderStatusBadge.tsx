'use client'
import React from 'react'

const STATUS_COLORS: Record<string, string> = {
  new:        '#e03131',
  processing: '#f08c00',
  shipped:    '#2f9e44',
  delivered:  '#2f9e44',
  cancelled:  '#868e96',
  refunded:   '#868e96',
}

const STATUS_LABELS: Record<string, string> = {
  new:        'Nieuw',
  processing: 'Verwerken',
  shipped:    'Verzonden',
  delivered:  'Afgeleverd',
  cancelled:  'Geannuleerd',
  refunded:   'Terugbetaald',
}

interface Props { status?: string }

export function OrderStatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status ?? ''] || '#868e96'
  const label = STATUS_LABELS[status ?? ''] || status || 'Nieuw'
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 25, height: 25, borderRadius: '50%', background: color, flexShrink: 0,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
    </span>
  )
}

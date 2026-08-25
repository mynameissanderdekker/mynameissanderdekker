import React from 'react'
import type { FieldProps } from 'sanity'

// Renders as a `components.field` wrapper — no default label, just the badge.
// Hidden via schema `hidden` prop when artwork is not synced to Torch.
export function SyncBadge(_props: FieldProps) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', fontSize: 12, borderRadius: 4,
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      color: '#16a34a', fontWeight: 500,
    }}>
      ⮂ Gesynchroniseerd met Torch gallery
    </div>
  )
}

'use client'
import type { ArrayOfObjectsInputProps } from 'sanity'

const STATUS_META: Record<string, { label: string; emoji: string }> = {
  new:        { label: 'New',        emoji: '🆕' },
  processing: { label: 'Processing', emoji: '⚙️' },
  shipped:    { label: 'Shipped',    emoji: '📦' },
  delivered:  { label: 'Delivered',  emoji: '✅' },
  cancelled:  { label: 'Cancelled',  emoji: '❌' },
  refunded:   { label: 'Refunded',   emoji: '💸' },
  paid:       { label: 'Paid',       emoji: '💳' },
}

interface Entry {
  _key: string
  status?: string
  changedAt?: string
  changedBy?: string
  note?: string
}

function formatDate(iso?: string) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function OrderStatusHistoryTimeline(props: ArrayOfObjectsInputProps) {
  const items = ([...(props.value as unknown as Entry[] ?? [])]).sort(
    (a, b) => (b.changedAt || '').localeCompare(a.changedAt || '')
  )

  if (items.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #888)', padding: '8px 0' }}>
        No status changes recorded yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(entry => {
        const meta = STATUS_META[entry.status ?? ''] ?? { label: entry.status || 'Unknown', emoji: '•' }
        return (
          <div
            key={entry._key}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13,
              padding: '6px 10px', border: '1px solid var(--card-border-color, #e0e0e0)', borderRadius: 4,
            }}
          >
            <span>{meta.emoji}</span>
            <span style={{ fontWeight: 500 }}>{meta.label}</span>
            <span style={{ color: 'var(--card-muted-fg-color, #888)' }}>
              — {formatDate(entry.changedAt)} — {entry.changedBy || 'system'}
              {entry.note ? ` (${entry.note})` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

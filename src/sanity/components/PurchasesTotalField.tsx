'use client'
import { useFormValue } from 'sanity'
import type { FieldProps } from 'sanity'

export function PurchasesTotalField(props: FieldProps) {
  const purchases = useFormValue(['purchases']) as Array<{ price?: number }> | undefined

  const total = (purchases ?? []).reduce((sum, p) => sum + (p.price ?? 0), 0)
  const count = (purchases ?? []).length

  return (
    <div>
      {props.renderDefault(props)}
      {count > 0 && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: 4,
          fontSize: 13,
          color: '#333',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>{count} werk{count !== 1 ? 'en' : ''}</span>
          <strong>Totaal: €{total.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
      )}
    </div>
  )
}

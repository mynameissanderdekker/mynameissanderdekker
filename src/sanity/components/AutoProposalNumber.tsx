'use client'

import { useState } from 'react'
import { set } from 'sanity'
import { useListClient } from './useListClient'
import type { StringInputProps } from 'sanity'

/**
 * Proposal number input: shows the field + a "Genereer nummer" button.
 * The number is sequential and shared with invoices (PROP-SDK-26-001),
 * so converting a proposal to an invoice keeps the same sequence number.
 */
export function AutoProposalNumber(props: StringInputProps) {
  const { value, onChange, readOnly } = props
  const client = useListClient()
  const token: string = (client as unknown as { config?: () => { token?: string } }).config?.()?.token ?? ''
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/generate-number?type=proposal', {
        headers: { 'x-sanity-token': token },
      })
      if (res.ok) {
        const { number } = await res.json()
        onChange(set(number))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {props.renderDefault(props)}
      {!value && !readOnly && (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          style={{
            marginTop: 6,
            padding: '4px 10px',
            fontSize: 12,
            background: loading ? '#9ca3af' : '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Genereren…' : 'Genereer nummer'}
        </button>
      )}
    </div>
  )
}

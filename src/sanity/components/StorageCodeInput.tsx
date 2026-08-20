'use client'

import { useEffect, useRef, useState } from 'react'
import { useClient, useFormValue } from 'sanity'
import { set, unset } from 'sanity'
import type { StringInputProps } from 'sanity'

// Artist code is always SDK (Sander Dekker) on this site
const ARTIST_CODE = 'SDK'

export function StorageCodeInput(props: StringInputProps) {
  const { onChange, value = '', readOnly } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  const year = useFormValue(['year']) as number | string | undefined
  const docId = useFormValue(['_id']) as string | undefined

  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState(false)
  const generated = useRef(false)

  const yearShort = year ? String(year).slice(2) : null
  const prefix = yearShort ? `${ARTIST_CODE}-${yearShort}-` : null

  // Auto-generate when prefix becomes available and field is empty
  useEffect(() => {
    if (!prefix || value || generated.current || readOnly) return
    generated.current = true
    setLoading(true)

    client
      .fetch<string[]>(
        `*[_type == "artwork" && defined(storageCode) && storageCode match $pattern][].storageCode`,
        { pattern: `${prefix}*` }
      )
      .then(codes => {
        const nums = codes.map(c => {
          const m = c?.replace(prefix, '').match(/^(\d+)$/)
          return m ? parseInt(m[1], 10) : 0
        }).filter(n => n > 0)

        const max = nums.length > 0 ? Math.max(...nums) : 0
        const next = String(max + 1).padStart(3, '0')
        onChange(set(`${prefix}${next}`))
      })
      .finally(() => setLoading(false))
  }, [prefix]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check uniqueness on change
  useEffect(() => {
    if (!value || value.length < 6) { setConflict(false); return }
    const rawId = (docId ?? '').replace(/^drafts\./, '')
    client
      .fetch<number>(
        `count(*[_type == "artwork" && storageCode == $code && _id != $id && _id != $draftId])`,
        { code: value, id: rawId, draftId: `drafts.${rawId}` }
      )
      .then(n => setConflict(n > 0))
  }, [value, docId, client])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v ? set(v) : unset())
    generated.current = true
  }

  if (!prefix && !value) {
    return (
      <div style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: 4, color: '#999', fontSize: 13 }}>
        Vul eerst het jaar in.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        value={loading ? 'Generating…' : value}
        disabled={loading || readOnly}
        onChange={handleChange}
        style={{
          padding: '8px 12px',
          fontFamily: 'monospace', fontSize: 14,
          border: conflict ? '1px solid #e53e3e' : '1px solid #d1d5db',
          borderRadius: 4,
          background: readOnly ? '#f9fafb' : '#fff',
          color: loading ? '#9ca3af' : '#111',
          outline: 'none',
        }}
      />
      {conflict && (
        <span style={{ fontSize: 12, color: '#e53e3e' }}>⚠ {value} is al in gebruik — pas de code aan</span>
      )}
      {!conflict && !loading && value && (
        <span style={{ fontSize: 12, color: '#38a169' }}>✓ {value}</span>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClient, useFormValue } from 'sanity'
import { set, unset } from 'sanity'
import type { StringInputProps } from 'sanity'

// Artist code is always SDK (Sander Dekker) on this site
const ARTIST_CODE = 'SDK'

export function StorageCodeInput(props: StringInputProps) {
  const { onChange, value = '' } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  const year = useFormValue(['year']) as number | undefined
  const docId = useFormValue(['_id']) as string | undefined

  const [suffix, setSuffix] = useState('')
  const [conflict, setConflict] = useState(false)
  const [loading, setLoading] = useState(false)

  // Parse existing value into suffix on load
  useEffect(() => {
    if (value && value.includes('-')) {
      setSuffix(value.split('-')[2] ?? '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const yearShort = year ? String(year).slice(2) : null
  const prefix = yearShort ? `${ARTIST_CODE}-${yearShort}-` : null
  const fullCode = prefix && suffix ? `${prefix}${suffix}` : ''

  // Check uniqueness
  useEffect(() => {
    if (!fullCode || suffix.length < 3) { setConflict(false); return }
    const rawId = docId?.replace(/^drafts\./, '')
    setLoading(true)
    client.fetch<number>(
      `count(*[_type == "artwork" && storageCode == $code && _id != $id && _id != $draftId])`,
      { code: fullCode, id: rawId ?? '', draftId: `drafts.${rawId}` }
    ).then(n => {
      setConflict(n > 0)
      setLoading(false)
    })
  }, [fullCode, docId, client])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 3)
    setSuffix(raw)
    const newCode = prefix ? `${prefix}${raw}` : ''
    onChange(raw ? set(newCode) : unset())
  }, [prefix, onChange])

  if (!yearShort) {
    return (
      <div style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: 4, color: '#999', fontSize: 13 }}>
        Vul eerst het jaar in om een storage code te genereren
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 14, color: '#555' }}>
          {prefix}
        </div>
        <input
          type="text"
          value={suffix}
          onChange={handleChange}
          placeholder="001"
          maxLength={3}
          style={{ width: 72, padding: '8px 10px', fontFamily: 'monospace', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 }}
        />
      </div>
      {suffix.length > 0 && suffix.length < 3 && (
        <span style={{ fontSize: 12, color: '#999' }}>Vul 3 cijfers in</span>
      )}
      {conflict && (
        <span style={{ fontSize: 12, color: '#e53e3e' }}>⚠ {fullCode} is al in gebruik — kies een ander nummer</span>
      )}
      {loading && <span style={{ fontSize: 12, color: '#999' }}>Controleren…</span>}
      {!conflict && !loading && suffix.length === 3 && (
        <span style={{ fontSize: 12, color: '#38a169' }}>✓ {fullCode} is beschikbaar</span>
      )}
    </div>
  )
}

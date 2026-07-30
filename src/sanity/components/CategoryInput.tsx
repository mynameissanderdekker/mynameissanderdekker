'use client'

import { useEffect, useState } from 'react'
import { useClient } from 'sanity'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { StringInputProps } from 'sanity'
import { set, unset } from 'sanity'

/**
 * Multi-select category input for array fields (worksPage sections).
 * Chips toggle on/off; multiple can be selected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CategoryMultiInput(props: any) {
  const { value = [], onChange } = props
  const selected: string[] = Array.isArray(value) ? value : []
  const client = useClient({ apiVersion: '2024-01-01' })
  const [existing, setExisting] = useState<string[] | null>(null)

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique([
          ...*[_type == "artwork" && defined(category) && category != ""].category,
          ...*[_type == "zine" && defined(category) && category != ""].category
        ]) | order(@)`
      )
      .then((cats) => setExisting((cats ?? []).filter(Boolean)))
      .catch(() => setExisting([]))
  }, [client])

  function toggle(cat: string) {
    const next = selected.includes(cat)
      ? selected.filter(c => c !== cat)
      : [...selected, cat]
    onChange(set(next))
  }

  if (existing === null) {
    return <p style={{ margin: 0, fontSize: 13, color: '#aaa' }}>Loading categories…</p>
  }

  if (existing.length === 0) {
    return <p style={{ margin: 0, fontSize: 13, color: '#aaa' }}>No categories found yet. Add a category to an artwork first.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {existing.map((cat) => {
          const active = selected.includes(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: active ? '2px solid #000' : '1px solid #ccc',
                background: active ? '#000' : '#fff',
                color: active ? '#fff' : '#333',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
          Selected: <strong>{selected.join(', ')}</strong>
        </p>
      )}
    </div>
  )
}

/**
 * Single-select category input for string fields (artwork, zine).
 * - Toont bestaande categorieën als klikbare chips
 * - Tekstveld + '+' om een nieuwe aan te maken
 */
export function CategoryInput(props: StringInputProps) {
  const { value, onChange } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [existing, setExisting] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
      )
      .then((cats) => setExisting((cats ?? []).filter(Boolean)))
  }, [client])

  function select(cat: string) {
    onChange(cat ? set(cat) : unset())
  }

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    select(trimmed)
    setDraft('')
    if (!existing.includes(trimmed)) {
      setExisting((prev) => [...prev, trimmed].sort())
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Bestaande categorieën */}
      {existing.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {existing.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => select(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: value === cat ? '2px solid #000' : '1px solid #ccc',
                background: value === cat ? '#000' : '#fff',
                color: value === cat ? '#fff' : '#333',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: value === cat ? 600 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Nieuwe categorie toevoegen */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Nieuwe categorie..."
          style={{
            flex: 1,
            padding: '7px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          style={{
            padding: '7px 14px',
            background: draft.trim() ? '#000' : '#e0e0e0',
            color: draft.trim() ? '#fff' : '#999',
            border: 'none',
            borderRadius: 4,
            fontSize: 18,
            cursor: draft.trim() ? 'pointer' : 'default',
          }}
        >
          +
        </button>
      </div>

      {value && (
        <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
          Geselecteerd: <strong>{value}</strong>
          <button
            type="button"
            onClick={() => select('')}
            style={{ marginLeft: 8, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 12 }}
          >
            ✕ wissen
          </button>
        </p>
      )}
    </div>
  )
}

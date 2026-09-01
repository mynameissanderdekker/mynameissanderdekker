'use client'

import { useEffect, useState } from 'react'
import { useListClient } from './useListClient'
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
  const client = useListClient()
  const [existing, setExisting] = useState<string[] | null>(null)

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique([
          ...*[_type == "artwork" && defined(category) && category != ""].category,
          ...*[_type == "publication" && defined(category) && category != ""].category
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

// Default MNSDK artwork categories (always shown, even before any artwork has a category)
const DEFAULT_CATEGORIES = ['Artwork', 'Special Edition', 'Wallpaper', 'Zine', 'Book']

/**
 * Single-select category input for string fields (artwork, zine).
 * - Shows default MNSDK categories + any custom categories already used in artworks
 * - Pills toggle selection; text field + '+' to add a new custom category
 */
export function CategoryInput(props: StringInputProps) {
  const { value, onChange } = props
  const client = useListClient()
  const [extra, setExtra] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
      )
      .then((cats) => {
        const custom = (cats ?? []).filter(Boolean).filter(c => !DEFAULT_CATEGORIES.includes(c))
        setExtra(custom)
      })
  }, [client])

  const categories = [...DEFAULT_CATEGORIES, ...extra]

  function select(cat: string) {
    onChange(value === cat ? unset() : set(cat))
  }

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    select(trimmed)
    setDraft('')
    if (!categories.includes(trimmed)) {
      setExtra((prev) => [...prev, trimmed].sort())
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {categories.map((cat) => {
          const active = value === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => select(cat)}
              style={{
                padding: '5px 14px',
                borderRadius: '999px',
                border: active ? '1.5px solid #111' : '1.5px solid #d0d0d0',
                background: active ? '#111' : 'transparent',
                color: active ? '#fff' : '#444',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Add custom category */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Nieuwe categorie..."
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #d0d0d0',
            background: '#f5f5f5',
            cursor: draft.trim() ? 'pointer' : 'default',
            fontSize: '18px',
            lineHeight: 1,
            color: '#666',
          }}
        >
          +
        </button>
      </div>

      {value && (
        <span style={{ fontSize: '12px', color: '#888' }}>
          Geselecteerd: <strong style={{ color: '#111' }}>{value}</strong>
          &nbsp;
          <button
            type="button"
            onClick={() => onChange(unset())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '12px' }}
          >
            × wissen
          </button>
        </span>
      )}
    </div>
  )
}

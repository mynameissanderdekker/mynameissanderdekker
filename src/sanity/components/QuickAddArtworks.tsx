'use client'
import { useClient } from 'sanity'
import type { ArrayOfObjectsInputProps } from 'sanity'
import { insert, setIfMissing, PatchEvent } from 'sanity'
import { useState, useCallback } from 'react'

interface ArtworkResult {
  _id: string
  title: string
  year?: number
  medium?: string
  category?: string
}

export function QuickAddArtworks(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtworkResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set())

  const currentItems = (props.value ?? []) as Array<{ artwork?: { _ref?: string } }>
  const addedIds = new Set([
    ...currentItems.map(item => item.artwork?._ref).filter(Boolean),
    ...addedKeys,
  ])

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await client.fetch<ArtworkResult[]>(
        `*[_type == "artwork" && !(_id in path("drafts.**")) && title match $q] | order(year desc) [0...12]{ _id, title, year, medium, category }`,
        { q: `${q}*` }
      )
      setResults(res ?? [])
    } finally {
      setSearching(false)
    }
  }, [client])

  function addArtwork(artwork: ArtworkResult) {
    if (addedIds.has(artwork._id)) return
    const newItem = {
      _type: 'privateSaleItem',
      _key: crypto.randomUUID(),
      artwork: { _type: 'reference', _ref: artwork._id },
    }
    props.onChange(
      PatchEvent.from([
        setIfMissing([]),
        insert([newItem], 'after', [-1]),
      ])
    )
    setAddedKeys(prev => new Set([...prev, artwork._id]))
    setQuery('')
    setResults([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--card-muted-fg-color, #666)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Quick add artwork
        </div>
        <input
          type="text"
          placeholder="Search by title…"
          value={query}
          onChange={e => search(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--card-border-color, #ccc)',
            borderRadius: 4,
            fontSize: 13,
            background: 'var(--card-bg-color, #fff)',
            color: 'inherit',
            outline: 'none',
            width: '100%',
          }}
        />
        {searching && (
          <div style={{ fontSize: 12, color: 'var(--card-muted-fg-color, #888)' }}>Searching…</div>
        )}
        {results.length > 0 && (
          <div style={{ border: '1px solid var(--card-border-color, #e0e0e0)', borderRadius: 4, overflow: 'hidden', background: 'var(--card-bg-color, #fff)' }}>
            {results.map(a => {
              const isAdded = addedIds.has(a._id)
              return (
                <div
                  key={a._id}
                  onClick={() => addArtwork(a)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    background: isAdded ? 'var(--card-bg-color, #f9f9f9)' : 'var(--card-bg-color, #fff)',
                    color: isAdded ? 'var(--card-muted-fg-color, #aaa)' : 'inherit',
                    cursor: isAdded ? 'default' : 'pointer',
                    borderBottom: '1px solid var(--card-border-color, #f0f0f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isAdded) (e.currentTarget as HTMLElement).style.background = 'var(--card-hover-bg, #f5f5f5)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isAdded ? 'var(--card-bg-color, #f9f9f9)' : 'var(--card-bg-color, #fff)' }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{a.title}</span>
                    {a.year && <span style={{ marginLeft: 6, color: 'var(--card-muted-fg-color, #888)', fontSize: 12 }}>{a.year}</span>}
                    {a.category && <span style={{ marginLeft: 6, color: 'var(--card-muted-fg-color, #aaa)', fontSize: 11 }}>{a.category}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: isAdded ? 'var(--card-muted-fg-color, #aaa)' : '#16a34a', fontWeight: 500 }}>
                    {isAdded ? 'Added ✓' : '+ Add'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Default Sanity array UI */}
      {props.renderDefault(props)}
    </div>
  )
}

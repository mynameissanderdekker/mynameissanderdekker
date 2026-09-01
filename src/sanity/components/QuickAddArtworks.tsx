'use client'
import { useListClient } from './useListClient'
import type { ArrayOfObjectsInputProps } from 'sanity'
import { insert, setIfMissing, PatchEvent } from 'sanity'
import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArtworkChip {
  _id: string
  title: string
  year?: number
}

interface EntityOption {
  _id: string
  title: string
}

type Mode = null | 'project' | 'exhibition'

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--card-muted-fg-color, #888)',
    marginRight: 4,
  } as React.CSSProperties,
  btn: (active: boolean) => ({
    padding: '5px 12px',
    fontSize: 12,
    border: `1px solid ${active ? '#111' : 'var(--card-border-color, #ccc)'}`,
    borderRadius: 20,
    background: active ? '#111' : 'var(--card-bg-color, #fff)',
    color: active ? '#fff' : 'inherit',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.1s',
  } as React.CSSProperties),
  cancelBtn: {
    padding: '5px 12px',
    fontSize: 12,
    border: '1px solid var(--card-border-color, #ccc)',
    borderRadius: 20,
    background: 'transparent',
    color: 'var(--card-muted-fg-color, #888)',
    cursor: 'pointer',
    marginLeft: 'auto',
  } as React.CSSProperties,
  select: {
    padding: '7px 10px',
    fontSize: 13,
    border: '1px solid var(--card-border-color, #ccc)',
    borderRadius: 4,
    background: 'var(--card-bg-color, #fff)',
    color: 'inherit',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    marginBottom: 12,
  } as React.CSSProperties,
  chipArea: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 12,
  } as React.CSSProperties,
  chip: (excluded: boolean) => ({
    padding: '4px 10px',
    fontSize: 12,
    border: `1px solid ${excluded ? 'var(--card-border-color, #ddd)' : '#111'}`,
    borderRadius: 20,
    background: excluded ? 'transparent' : 'transparent',
    color: excluded ? 'var(--card-muted-fg-color, #aaa)' : 'inherit',
    textDecoration: excluded ? 'line-through' : 'none',
    cursor: 'pointer',
    transition: 'all 0.1s',
    userSelect: 'none' as const,
  } as React.CSSProperties),
  addBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    borderRadius: 4,
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  selectAll: {
    padding: '8px 12px',
    fontSize: 12,
    border: 'none',
    background: 'none',
    color: 'var(--card-muted-fg-color, #888)',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickAddArtworks(props: ArrayOfObjectsInputProps) {
  const client = useListClient()

  const [mode, setMode] = useState<Mode>(null)
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [selectedEntity, setSelectedEntity] = useState('')
  const [artworks, setArtworks] = useState<ArtworkChip[]>([])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // IDs already in the list
  const currentItems = (props.value ?? []) as Array<{ artwork?: { _ref?: string } }>
  const alreadyAdded = new Set(currentItems.map(i => i.artwork?._ref).filter(Boolean))

  // ── Open a mode ─────────────────────────────────────────────────────────────

  const openMode = useCallback(async (m: Mode) => {
    setMode(m)
    setSelectedEntity('')
    setArtworks([])
    setExcluded(new Set())
    setLoading(true)

    try {
      if (m === 'project') {
        const res = await client.fetch<EntityOption[]>(
          `*[_type == "projectSeries" && !(_id in path("drafts.**"))] | order(title asc) { _id, title }`
        )
        setEntities(res ?? [])
      } else if (m === 'exhibition') {
        const res = await client.fetch<EntityOption[]>(
          `*[_type == "exhibition" && !(_id in path("drafts.**"))] | order(title desc) { _id, title }`
        )
        setEntities(res ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [client])

  // ── Select entity → load artworks ────────────────────────────────────────

  const selectEntity = useCallback(async (id: string) => {
    setSelectedEntity(id)
    if (!id) { setArtworks([]); return }
    setLoading(true)

    try {
      let res: ArtworkChip[] = []
      if (mode === 'project') {
        res = await client.fetch<ArtworkChip[]>(
          `*[_type == "projectSeries" && _id == $id][0].artworks[]->{ _id, title, year }`,
          { id }
        )
      } else if (mode === 'exhibition') {
        res = await client.fetch<ArtworkChip[]>(
          `*[_type == "artwork" && !(_id in path("drafts.**")) && $id in exhibitions[]._ref] | order(year desc) { _id, title, year }`,
          { id }
        )
      }
      setArtworks(res ?? [])
      setExcluded(new Set())
    } finally {
      setLoading(false)
    }
  }, [client, mode])

  // ── Toggle chip ──────────────────────────────────────────────────────────

  function toggleExclude(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Add selected artworks ─────────────────────────────────────────────────

  function addSelected() {
    const toAdd = artworks
      .filter(a => !excluded.has(a._id) && !alreadyAdded.has(a._id))
      .map(a => ({
        _type: 'privateSaleItem',
        _key: crypto.randomUUID(),
        artwork: { _type: 'reference', _ref: a._id },
      }))

    if (toAdd.length === 0) { cancel(); return }

    props.onChange(
      PatchEvent.from([
        setIfMissing([]),
        insert(toAdd, 'after', [-1]),
      ])
    )
    cancel()
  }

  function cancel() {
    setMode(null)
    setEntities([])
    setSelectedEntity('')
    setArtworks([])
    setExcluded(new Set())
  }

  // ── Counts ───────────────────────────────────────────────────────────────

  const available = artworks.filter(a => !alreadyAdded.has(a._id))
  const toAddCount = available.filter(a => !excluded.has(a._id)).length

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header row */}
      <div style={s.header}>
        <span style={s.label}>Quick add</span>
        <button
          type="button"
          style={s.btn(mode === 'project')}
          onClick={() => mode === 'project' ? cancel() : openMode('project')}
        >
          + Project
        </button>
        <button
          type="button"
          style={s.btn(mode === 'exhibition')}
          onClick={() => mode === 'exhibition' ? cancel() : openMode('exhibition')}
        >
          + Exhibition
        </button>
        {mode && (
          <button type="button" style={s.cancelBtn} onClick={cancel}>
            Cancel
          </button>
        )}
      </div>

      {/* Bulk-add panel */}
      {mode && (
        <div style={{ padding: '12px 16px', border: '1px solid var(--card-border-color, #e0e0e0)', borderRadius: 6, background: 'var(--card-bg-color, #fafafa)' }}>

          {/* Entity selector */}
          <select
            style={s.select}
            value={selectedEntity}
            onChange={e => selectEntity(e.target.value)}
          >
            <option value="">
              {loading ? 'Loading…' : mode === 'project' ? 'Select project series…' : 'Select exhibition…'}
            </option>
            {entities.map(e => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>

          {/* Artwork chips */}
          {artworks.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--card-muted-fg-color, #888)', marginBottom: 8 }}>
                <strong style={{ color: 'inherit' }}>{available.length} works found</strong>
                {available.length > 0 && <span style={{ marginLeft: 6 }}>· Click to exclude</span>}
              </div>

              <div style={s.chipArea}>
                {artworks.map(a => {
                  const isAdded = alreadyAdded.has(a._id)
                  const isExcluded = excluded.has(a._id) || isAdded
                  return (
                    <button
                      key={a._id}
                      type="button"
                      style={s.chip(isExcluded)}
                      onClick={() => !isAdded && toggleExclude(a._id)}
                      title={isAdded ? 'Already in selection' : undefined}
                    >
                      {a.title}{a.year ? ` · ${a.year}` : ''}
                      {isAdded && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  style={{ ...s.addBtn, opacity: toAddCount === 0 ? 0.4 : 1 }}
                  disabled={toAddCount === 0}
                  onClick={addSelected}
                >
                  Add {toAddCount} work{toAddCount !== 1 ? 's' : ''}
                </button>
                {excluded.size > 0 && (
                  <button
                    type="button"
                    style={s.selectAll}
                    onClick={() => setExcluded(new Set())}
                  >
                    Select all
                  </button>
                )}
              </div>
            </>
          )}

          {selectedEntity && artworks.length === 0 && !loading && (
            <div style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #888)' }}>No artworks found.</div>
          )}
        </div>
      )}

      {/* Default Sanity array UI (existing items + add individual) */}
      {props.renderDefault(props)}
    </div>
  )
}

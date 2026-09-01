'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient, set, PatchEvent } from 'sanity'
import type { ArrayOfObjectsInputProps } from 'sanity'

interface Artwork {
  _id: string
  title: string
  artistName: string
  imageUrl?: string
  status?: string
  year?: string
  category?: string
}

// Ongebruikt sinds het kunstenaarsfilter eruit is: op een kunstenaarssite is er
// er maar één. Categorie, jaar en status blijven over als nuttige assen.
interface Artist {
  _id: string
  name: string
  represented?: boolean
}

export function ExhibitionArtworkPicker(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion: '2024-01-01' })

  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('available')
  const [filterYear, setFilterYear] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'medium' | 'large'>('medium')
  const [adding, setAdding] = useState(false)
  const [conflictIds, setConflictIds] = useState<Map<string, string>>(new Map()) // artworkId → event title

  // For plain reference arrays, each item is { _key, _type: 'reference', _ref }
  const existingIds = useMemo(
    () => new Set((props.value ?? []).map((item: any) => item?._ref).filter(Boolean)),
    [props.value]
  )

  // Get current document ID (strip drafts. prefix)
  const rawDocId = (props as any).id ?? ''
  const currentDocId = rawDocId.replace(/^drafts\./, '')

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const [aws, conflicts] = await Promise.all([
      client.fetch<Artwork[]>(`
        *[_type == "artwork" && !(_id in path("drafts.**"))] | order(title asc) {
          _id, title, status, year, category,
          "imageUrl": images[0].asset->url,
        }
      `),
      client.fetch<Array<{ title: string; refs: string[] }>>(
        `*[(_type == "exhibition" || _type == "artFair") && _id != $id && (endDate >= $today || startDate >= $today)] {
          title,
          "refs": artworks[]._ref
        }`,
        { id: currentDocId, today }
      ),
    ])
    setArtworks(aws)
    // Build map: artworkId → event title
    const map = new Map<string, string>()
    for (const event of conflicts) {
      for (const ref of (event.refs ?? [])) {
        if (!map.has(ref)) map.set(ref, event.title)
      }
    }
    setConflictIds(map)
    setLoading(false)
  }, [client, currentDocId])

  function openPanel() {
    setOpen(true)
    if (artworks.length === 0) load()
  }

  const filtered = useMemo(() => {
    let list = artworks
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => a.title?.toLowerCase().includes(q))
    }
    if (filterStatus) list = list.filter(a => a.status === filterStatus)
    if (filterYear) list = list.filter(a => String(a.year ?? '') === filterYear)
    if (filterCategory) list = list.filter(a => a.category === filterCategory)
    return list
  }, [artworks, search, filterStatus, filterYear, filterCategory])

  function toggle(id: string) {
    if (existingIds.has(id)) return
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function toggleAll() {
    const selectable = filtered.filter(a => !existingIds.has(a._id)).map(a => a._id)
    if (selectable.every(id => selected.has(id))) {
      setSelected(prev => { const s = new Set(prev); selectable.forEach(id => s.delete(id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); selectable.forEach(id => s.add(id)); return s })
    }
  }

  function addSelected() {
    if (!selected.size) return
    setAdding(true)
    const newItems = [...selected].map(id => ({
      _type: 'reference',
      _key: crypto.randomUUID(),
      _ref: id,
    }))
    const merged = [...(props.value ?? []), ...newItems]
    props.onChange(PatchEvent.from(set(merged)))
    setSelected(new Set())
    setAdding(false)
    setOpen(false)
  }

  const years = useMemo(() => {
    const s = new Set(artworks.map(a => String(a.year ?? '')).filter(Boolean))
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [artworks])

  const categories = useMemo(() => {
    const s = new Set(artworks.map(a => a.category).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [artworks])

  const selectableInView = filtered.filter(a => !existingIds.has(a._id))
  const allSelectableSelected = selectableInView.length > 0 && selectableInView.every(a => selected.has(a._id))
  const sel: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', fontSize: 13, background: '#fff' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!open && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
          <button
            onClick={openPanel}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #111', background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Add artworks
          </button>
        </div>
      )}

      {open && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search by title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...sel, flex: '1 1 160px', minWidth: 0 }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sel, flex: '0 1 130px' }}>
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="not_for_sale">Not for sale</option>
            </select>
            {years.length > 0 && (
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...sel, flex: '0 1 100px' }}>
                <option value="">All years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {categories.length > 0 && (
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...sel, flex: '0 1 130px' }}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          {/* Select all + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
            <input type="checkbox" checked={allSelectableSelected} onChange={toggleAll} style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {selected.size > 0 ? `${selected.size} selected` : `Select all (${selectableInView.length})`}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
              {(['list', 'medium', 'large'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  style={{ padding: '3px 8px', fontSize: 12, border: 'none', cursor: 'pointer', background: viewMode === m ? '#111' : '#fff', color: viewMode === m ? '#fff' : '#6b7280' }}>
                  {m === 'list' ? '☰' : m === 'medium' ? '⊞' : '⬛'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { setOpen(false); setSelected(new Set()) }}
              style={{ fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={addSelected} disabled={adding || selected.size === 0}
              style={{ padding: '6px 14px', background: selected.size === 0 ? '#e5e7eb' : '#111', color: selected.size === 0 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: selected.size === 0 ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {adding ? 'Adding…' : `+ Add ${selected.size || ''} work${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Grid / list */}
          {loading ? (
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No works found.</p>
          ) : viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 420, overflowY: 'auto' }}>
              {filtered.map(a => {
                const added = existingIds.has(a._id)
                const isSelected = selected.has(a._id)
                const conflict = !added ? conflictIds.get(a._id) : undefined
                const thumb = a.imageUrl ? `${a.imageUrl}?w=80&h=80&fit=crop&auto=format` : null
                return (
                  <div key={a._id} onClick={() => toggle(a._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid #f3f4f6', cursor: added ? 'default' : 'pointer', background: isSelected ? '#f0fdf4' : '#fff', opacity: added ? 0.45 : 1 }}>
                    <input type="checkbox" checked={isSelected || added} disabled={added} onChange={() => toggle(a._id)} onClick={e => e.stopPropagation()} style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <div style={{ width: 32, height: 32, flexShrink: 0, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 14, color: '#d1d5db' }}>🖼</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111', flexShrink: 0, minWidth: 120 }}>{a.artistName ?? '—'}</span>
                    <span style={{ fontSize: 12, fontStyle: 'italic', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title ?? '—'}</span>
                    {conflict && <span title={`Ook bij: ${conflict}`} style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 12, color: '#d97706' }}>⚠ {conflict}</span>}
                    {added && <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, color: '#9ca3af' }}>Added</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${viewMode === 'large' ? 120 : 80}px, 1fr))`, gap: 6, maxHeight: 420, overflowY: 'auto' }}>
              {filtered.map(a => {
                const added = existingIds.has(a._id)
                const isSelected = selected.has(a._id)
                const conflict = !added ? conflictIds.get(a._id) : undefined
                const sz = viewMode === 'large' ? 110 : 72
                const thumb = a.imageUrl ? `${a.imageUrl}?w=${sz * 2}&h=${sz * 2}&fit=crop&auto=format` : null
                return (
                  <button key={a._id} onClick={() => toggle(a._id)} disabled={added}
                    title={conflict ? `⚠ Ook bij: ${conflict}\n${a.title}${a.artistName ? ` · ${a.artistName}` : ''}` : `${a.title}${a.artistName ? ` · ${a.artistName}` : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 4px', borderRadius: 6, border: `2px solid ${conflict ? '#f59e0b' : isSelected ? '#111' : '#e5e7eb'}`, background: isSelected ? '#f0fdf4' : '#fff', cursor: added ? 'default' : 'pointer', fontFamily: 'inherit', opacity: added ? 0.4 : 1, textAlign: 'center', position: 'relative' }}>
                    {added && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 3, padding: '1px 4px' }}>✓</span>}
                    {conflict && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 3, padding: '1px 4px' }}>⚠</span>}
                    {thumb
                      ? <img src={thumb} alt="" style={{ width: sz, height: sz, objectFit: 'cover', borderRadius: 3, display: 'block' }} />
                      : <div style={{ width: sz, height: sz, background: '#f3f4f6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#d1d5db' }}>🖼</div>}
                    <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.3, maxWidth: sz + 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {a.title || 'Untitled'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Standard Sanity array render (shows added items with remove button) */}
      {props.renderDefault(props)}
    </div>
  )
}

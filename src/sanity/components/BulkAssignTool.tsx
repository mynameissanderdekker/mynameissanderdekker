'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useListClient } from './useListClient'

interface Artwork {
  _id: string
  title: string
  year?: number
  imageUrl?: string
  exhibitions: string[]
  artFairs: string[]
  vatRate?: string
  status?: string
  availableInShop?: boolean
  editionType?: string
}

interface Event {
  _id: string
  title: string
  type: 'exhibition' | 'artFair'
  startDate?: string
  endDate?: string
}

type Action = 'assign' | 'vatRate' | 'status' | 'availableInShop' | 'editionType' | 'location'

const ACTION_LABELS: Record<Action, string> = {
  assign:          'Assign to event',
  vatRate:         'VAT rate',
  status:          'Status',
  availableInShop: 'Webshop',
  editionType:     'Edition type',
  location:        'Location',
}

const ACTION_ICONS: Record<Action, string> = {
  assign:          '🗓',
  vatRate:         '🧾',
  status:          '🔵',
  availableInShop: '🛒',
  editionType:     '📋',
  location:        '📍',
}

const btn = (bg: string, fg = '#fff'): React.CSSProperties => ({
  background: bg, color: fg, border: 'none', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'opacity .15s',
})

const sel: React.CSSProperties = {
  border: '1px solid #d1d5db', borderRadius: 6,
  padding: '7px 12px', fontSize: 14,
}

/**
 * Overgenomen uit de gallery-template, zonder de kunstenaar-dimensie: daar wijs
 * je werk toe aan een van de 93 kunstenaars, hier is er maar één. Wat overblijft
 * is toewijzen aan een expositie of beurs, plus BTW, status, editietype,
 * webshop en locatie — in één keer voor een hele selectie.
 */
export function BulkAssignTool() {
  const client = useListClient()

  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [events, setEvents]     = useState<Event[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Action
  const [action, setAction]         = useState<Action>('assign')
  const [targetId, setTargetId]     = useState('')   // for assign
  // Waar werken liggen is precies het soort veld dat je in bulk zet: een hele
  // beurs komt in één keer terug in de opslag.
  const [locations, setLocations]   = useState<Array<{ _id: string; name: string; type?: string }>>([])
  const [actionValue, setActionValue] = useState('')  // for vatRate / status / editionType / availableInShop

  // Filters
  const [search, setSearch]               = useState('')
  const [filterExhibition, setFilterExhibition] = useState('')
  const [filterArtFair, setFilterArtFair] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'medium' | 'large'>('large')

  const load = useCallback(async () => {
    setLoading(true)
    const [aws, exps, afs] = await Promise.all([
      client.fetch<Artwork[]>(`
        *[_type == "artwork"] | order(year desc, title asc) {
          _id, title, year, vatRate, status, availableInShop, editionType,
          "imageUrl": images[0].asset->url,
          "exhibitions": exhibitions[]._ref,
          "artFairs": artFairs[]._ref,
        }
      `),
      client.fetch<{_id:string;title:string;startDate?:string;endDate?:string}[]>(
        `*[_type=="exhibition"]|order(title asc){_id,title,startDate,endDate}`
      ),
      client.fetch<{_id:string;title:string;startDate?:string;endDate?:string}[]>(
        `*[_type=="artFair"]|order(title asc){_id,title,startDate,endDate}`
      ),
    ])
    setArtworks(aws)
    client
      .fetch<Array<{ _id: string; name: string; type?: string }>>(
        `*[_type=="location"]|order(name asc){_id,name,type}`
      )
      .then(setLocations)
      .catch(() => setLocations([]))

    setEvents([
      ...exps.map(e => ({ ...e, type: 'exhibition' as const })),
      ...afs.map(e => ({ ...e, type: 'artFair' as const })),
    ])
    setLoading(false)
  }, [client])

  useEffect(() => { load() }, [load])

  const targetEvent = events.find(e => e._id === targetId)

  const filtered = useMemo(() => {
    let list = artworks
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => a.title?.toLowerCase().includes(q))
    }
    if (filterExhibition) list = list.filter(a => a.exhibitions?.includes(filterExhibition))
    if (filterArtFair)    list = list.filter(a => a.artFairs?.includes(filterArtFair))
    return list
  }, [artworks, search, filterExhibition, filterArtFair])

  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(a => a._id)))
  }

  function toggle(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function alreadyLinked(artwork: Artwork) {
    if (!targetId || !targetEvent) return false
    return targetEvent.type === 'exhibition'
      ? artwork.exhibitions?.includes(targetId)
      : artwork.artFairs?.includes(targetId)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleApply() {
    if (selected.size === 0) return
    setSaving(true)
    const ids = [...selected]

    try {
      if (action === 'assign') {
        if (!targetId || !targetEvent) { setSaving(false); return }
        const field = targetEvent.type === 'exhibition' ? 'exhibitions' : 'artFairs'
        const tx = client.transaction()
        for (const id of ids) {
          const a = artworks.find(x => x._id === id)
          if (!a) continue
          const already = field === 'exhibitions' ? a.exhibitions?.includes(targetId) : a.artFairs?.includes(targetId)
          if (already) continue
          tx.patch(id, p => p.setIfMissing({ [field]: [] }).append(field, [{ _type: 'reference', _ref: targetId }]))
        }
        await tx.commit()
        showToast(`✓ ${ids.length} work(s) assigned to "${targetEvent.title}"`)

      } else if (action === 'vatRate') {
        if (!actionValue) { setSaving(false); return }
        const tx = client.transaction()
        for (const id of ids) tx.patch(id, { set: { vatRate: actionValue } })
        await tx.commit()
        showToast(`✓ VAT rate set to ${actionValue}% on ${ids.length} work(s)`)

      } else if (action === 'status') {
        if (!actionValue) { setSaving(false); return }
        const tx = client.transaction()
        for (const id of ids) tx.patch(id, { set: { status: actionValue } })
        await tx.commit()
        showToast(`✓ Status set to "${actionValue}" on ${ids.length} work(s)`)

      } else if (action === 'availableInShop') {
        const val = actionValue === 'true'
        const tx = client.transaction()
        for (const id of ids) tx.patch(id, { set: { availableInShop: val } })
        await tx.commit()
        showToast(`✓ Webshop visibility set to "${val ? 'visible' : 'hidden'}" on ${ids.length} work(s)`)

      } else if (action === 'location') {
        if (!actionValue) { setSaving(false); return }
        const loc = locations.find(l => l._id === actionValue)
        const tx = client.transaction()
        for (const id of ids) {
          tx.patch(id, {
            set: {
              currentLocation: { _type: 'reference', _ref: actionValue },
              // Sinds wanneer het er ligt hoort erbij: zonder datum weet je
              // later niet of dit nog klopt.
              locationSince: new Date().toISOString().slice(0, 10),
            },
          })
        }
        await tx.commit()
        showToast(`✓ Location set to "${loc?.name ?? 'location'}" on ${ids.length} work(s)`)

      } else if (action === 'editionType') {
        if (!actionValue) { setSaving(false); return }
        const tx = client.transaction()
        for (const id of ids) tx.patch(id, { set: { editionType: actionValue } })
        await tx.commit()
        showToast(`✓ Edition type set to "${actionValue}" on ${ids.length} work(s)`)
      }

      setSelected(new Set())
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleUnassign() {
    if (!targetId || selected.size === 0 || !targetEvent) return
    setSaving(true)
    const field = targetEvent.type === 'exhibition' ? 'exhibitions' : 'artFairs'
    const tx = client.transaction()
    for (const id of selected) tx.patch(id, p => p.unset([`${field}[_ref=="${targetId}"]`]))
    await tx.commit()
    setSaving(false)
    showToast(`✓ ${selected.size} work(s) unlinked from "${targetEvent.title}"`)
    setSelected(new Set())
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  function groupedEventOptions(type: 'exhibition' | 'artFair') {
    const list = events.filter(e => e.type === type)
    const current  = list.filter(e => e.startDate && e.endDate && e.startDate <= today && e.endDate >= today)
    const upcoming = list.filter(e => e.startDate && e.startDate > today)
    const archive  = list.filter(e => e.endDate && e.endDate < today)
    return <>
      {current.length  > 0 && <optgroup label="Current">  {current.map(e =>  <option key={e._id} value={e._id}>{e.title}</option>)}</optgroup>}
      {upcoming.length > 0 && <optgroup label="Upcoming"> {upcoming.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}</optgroup>}
      {archive.length  > 0 && <optgroup label="Archive">  {archive.map(e =>  <option key={e._id} value={e._id}>{e.title}</option>)}</optgroup>}
    </>
  }

  const selectedLinkedCount = [...selected].filter(id => {
    const a = artworks.find(x => x._id === id)
    return a && alreadyLinked(a)
  }).length

  // Derive whether Apply is ready
  const canApply = selected.size > 0 && !saving && (() => {
    if (action === 'assign') return !!targetId
    if (action === 'availableInShop') return actionValue === 'true' || actionValue === 'false'
    return !!actionValue
  })()

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'system-ui, sans-serif', maxWidth: 1200 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Bulk edit artworks</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        Choose an action, select works, then apply in one click.
      </p>

      {/* Row 1: search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search by title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...sel, flex: '1 1 180px', minWidth: 0 }}
        />
        <select value={filterExhibition} onChange={e => setFilterExhibition(e.target.value)}
          style={{ ...sel, flex: '1 1 160px', minWidth: 0 }}>
          <option value="">All exhibitions</option>
          {groupedEventOptions('exhibition')}
        </select>
        <select value={filterArtFair} onChange={e => setFilterArtFair(e.target.value)}
          style={{ ...sel, flex: '1 1 160px', minWidth: 0 }}>
          <option value="">All art fairs</option>
          {groupedEventOptions('artFair')}
        </select>
      </div>

      {/* Step 1: Action tabs */}
      <div style={{ marginBottom: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Step 1 — Choose action
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {(Object.keys(ACTION_LABELS) as Action[]).map(a => {
            const isActive = action === a
            return (
              <button key={a}
                onClick={() => { setAction(a); setActionValue(''); setTargetId('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  border: isActive ? '2px solid #111' : '2px solid #e5e7eb',
                  background: isActive ? '#111' : '#fff',
                  color: isActive ? '#fff' : '#374151',
                  transition: 'all .15s',
                }}>
                <span>{ACTION_ICONS[a]}</span>
                {ACTION_LABELS[a]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2: Value picker + Apply */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap' }}>
          Step 2 —
        </p>

        {action === 'assign' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)}
            style={{ ...sel, flex: '1 1 240px', minWidth: 0 }}>
            <option value="">Choose exhibition or art fair…</option>
            <optgroup label="── Exhibitions ──" disabled />
            {groupedEventOptions('exhibition')}
            <optgroup label="── Art Fairs ──" disabled />
            {groupedEventOptions('artFair')}
          </select>
        )}

        {action === 'vatRate' && (
          <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...sel, minWidth: 140 }}>
            <option value="">Choose VAT rate…</option>
            <option value="9">9%</option>
            <option value="21">21%</option>
            <option value="0">0%</option>
          </select>
        )}

        {action === 'status' && (
          <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...sel, minWidth: 180 }}>
            <option value="">Choose status…</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
            <option value="on-loan">On loan</option>
            <option value="not-for-sale">Not for sale</option>
          </select>
        )}

        {action === 'availableInShop' && (
          <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...sel, minWidth: 180 }}>
            <option value="">Choose…</option>
            <option value="true">✓ Visible in webshop</option>
            <option value="false">✗ Hidden from webshop</option>
          </select>
        )}

        {action === 'location' && (
          locations.length === 0 ? (
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              No locations yet — create them under Collection → Where is my work? first.
            </span>
          ) : (
            <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...sel, minWidth: 200 }}>
              <option value="">Choose location…</option>
              {locations.map(l => (
                <option key={l._id} value={l._id}>{l.name}{l.type ? ` · ${l.type}` : ''}</option>
              ))}
            </select>
          )
        )}

        {action === 'editionType' && (
          <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...sel, minWidth: 160 }}>
            <option value="">Choose edition type…</option>
            <option value="unique">Unique</option>
            <option value="edition">Edition</option>
          </select>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {action === 'assign' && selectedLinkedCount > 0 && (
            <button onClick={handleUnassign} disabled={saving}
              style={{ ...btn('#ef4444'), opacity: saving ? 0.4 : 1, whiteSpace: 'nowrap' }}>
              Unlink {selectedLinkedCount}
            </button>
          )}
          <button onClick={handleApply} disabled={!canApply}
            style={{ ...btn('#111'), opacity: canApply ? 1 : 0.4, whiteSpace: 'nowrap', padding: '9px 20px', fontSize: 14 }}>
            {saving ? 'Saving…' : `Apply to ${selected.size > 0 ? `${selected.size} work(s)` : '…'}`}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ background: '#d1fae5', color: '#065f46', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          {toast}
        </div>
      )}

      {/* Select all + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
        <input type="checkbox"
          checked={filtered.length > 0 && selected.size === filtered.length}
          onChange={toggleAll}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {selected.size > 0 ? `${selected.size} selected` : `Select all (${filtered.length})`}
        </span>
        {(filterExhibition || filterArtFair) && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>— filtered</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
          {(['list', 'medium', 'large'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              title={mode === 'list' ? 'List' : mode === 'medium' ? 'Medium' : 'Large'}
              style={{ padding: '3px 8px', fontSize: 12, border: 'none', cursor: 'pointer', background: viewMode === mode ? '#111' : '#fff', color: viewMode === mode ? '#fff' : '#6b7280' }}>
              {mode === 'list' ? '☰' : mode === 'medium' ? '⊞' : '⬛'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(artwork => {
            const linked = action === 'assign' && alreadyLinked(artwork)
            const isSelected = selected.has(artwork._id)
            return (
              <div key={artwork._id} onClick={() => toggle(artwork._id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: isSelected ? '#f9fafb' : '#fff' }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(artwork._id)}
                  onClick={e => e.stopPropagation()} style={{ width: 15, height: 15, flexShrink: 0 }} />
                <div style={{ width: 40, height: 40, flexShrink: 0, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  {artwork.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${artwork.imageUrl}?w=80&h=80&fit=crop&auto=format`} alt={artwork.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d1d5db', fontSize: 16 }}>🖼</span>
                  }
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artwork.title ?? '—'}</span>
                <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{artwork.year ?? ''}</span>
                {/* Current value hint */}
                <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, color: '#9ca3af' }}>
                  {action === 'vatRate' && artwork.vatRate ? `${artwork.vatRate}%` : ''}
                  {action === 'status' && artwork.status ? artwork.status : ''}
                  {action === 'availableInShop' ? (artwork.availableInShop ? '✓ in shop' : '✗ hidden') : ''}
                  {action === 'editionType' && artwork.editionType ? artwork.editionType : ''}
                </span>
                {linked && (
                  <span style={{ flexShrink: 0, background: '#065f46', color: '#d1fae5', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>✓ Linked</span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${viewMode === 'large' ? 200 : 130}px, 1fr))`, gap: viewMode === 'large' ? 16 : 10 }}>
          {filtered.map(artwork => {
            const linked = action === 'assign' && alreadyLinked(artwork)
            const isSelected = selected.has(artwork._id)
            return (
              <div key={artwork._id} onClick={() => toggle(artwork._id)}
                style={{ border: `2px solid ${isSelected ? '#111' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: isSelected ? '#f9fafb' : '#fff', position: 'relative' }}>
                {linked && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: '#065f46', color: '#d1fae5', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 6px', zIndex: 2 }}>✓ Linked</div>
                )}
                {/* Current value badge */}
                {action !== 'assign' && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, borderRadius: 3, padding: '2px 5px', zIndex: 2 }}>
                    {action === 'vatRate' && artwork.vatRate ? `${artwork.vatRate}%` : ''}
                    {action === 'status' ? (artwork.status ?? '—') : ''}
                    {action === 'availableInShop' ? (artwork.availableInShop ? '✓ shop' : '✗') : ''}
                    {action === 'editionType' ? (artwork.editionType ?? '—') : ''}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(artwork._id)}
                    onClick={e => e.stopPropagation()} style={{ width: 16, height: 16 }} />
                </div>
                <div style={{ aspectRatio: '1', background: '#f3f4f6', overflow: 'hidden' }}>
                  {artwork.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${artwork.imageUrl}?w=300&h=300&fit=crop&auto=format`} alt={artwork.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#d1d5db', fontSize: 28 }}>🖼</span></div>
                  }
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artwork.title ?? '—'}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{artwork.year ?? ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

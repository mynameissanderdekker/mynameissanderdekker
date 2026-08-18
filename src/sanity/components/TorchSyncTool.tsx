'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useClient } from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArtworkRow {
  _id: string
  title: string
  year?: number
  category?: string
  status?: string
  editionType?: string
  torchId?: string
}

type SyncState = 'idle' | 'sending' | 'ok' | 'error'

// ── Icon ──────────────────────────────────────────────────────────────────────

export const TorchSyncIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2C8 6 6 10 8 14c1 2 3 3 4 4-1-2-1-4 0-5 1 2 3 3 4 2-2-2-3-5-2-8 1 2 3 4 5 4-2-2-3-5-3-9z"/>
    <path d="M8 20h8"/>
  </svg>
)

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  available:    '#2e7d32',
  sold_out:     '#c62828',
  on_loan:      '#e65100',
  not_for_sale: '#555',
  enquire:      '#1565c0',
}

function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 9px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 500,
      background: color ? `${color}18` : '#f0f0f0',
      color: color ?? '#555',
      border: `1px solid ${color ? `${color}44` : '#ddd'}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TorchSyncTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [artworks, setArtworks]   = useState<ArtworkRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [filter, setFilter]       = useState<'all' | 'unsynced' | 'synced'>('all')
  const [search, setSearch]       = useState('')
  const [authed, setAuthed]       = useState<boolean | null>(null) // null = checking
  const [password, setPassword]   = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // ── Auth check on mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/sync-to-torch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artworkIds: [] }) })
      .then(r => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthed(true)
        setPassword('')
      } else {
        setLoginError('Verkeerd wachtwoord')
      }
    } catch {
      setLoginError('Inloggen mislukt')
    }
    setLoggingIn(false)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await client.fetch<ArtworkRow[]>(
        `*[_type == "artwork" && !(_id in path("drafts.**"))] | order(year desc, title asc) {
          _id, title, year, category, status, editionType, torchId
        }`
      )
      setArtworks(rows)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => { load() }, [load])

  // ── Filtering ──────────────────────────────────────────────────────────────

  const visible = artworks.filter(a => {
    if (filter === 'unsynced' && a.torchId) return false
    if (filter === 'synced'   && !a.torchId) return false
    if (search && !a.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Selection helpers ──────────────────────────────────────────────────────

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === visible.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visible.map(a => a._id)))
    }
  }

  function selectUnsynced() {
    setSelected(new Set(visible.filter(a => !a.torchId).map(a => a._id)))
  }

  // ── Sync — one batch POST → one artistSubmission in Torch ────────────────

  async function syncSelected() {
    if (selected.size === 0 || isSyncing) return
    setIsSyncing(true)

    const ids = Array.from(selected)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanityToken = (client as any).config?.()?.token ?? ''

    // Mark all as sending
    const sending: Record<string, SyncState> = {}
    ids.forEach(id => { sending[id] = 'sending' })
    setSyncState(prev => ({ ...prev, ...sending }))

    try {
      const res = await fetch('/api/sync-to-torch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sanity-token': sanityToken,
        },
        body: JSON.stringify({ artworkIds: ids }),
      })

      if (res.status === 401) {
        setAuthed(false) // show login form
        setIsSyncing(false)
        setSelected(new Set())
        return
      }

      const data = await res.json()

      if (data.success) {
        // Mark all as ok and update torchId in local state
        const ok: Record<string, SyncState> = {}
        ids.forEach(id => { ok[id] = 'ok' })
        setSyncState(prev => ({ ...prev, ...ok }))

        // Update torchId for each artwork from the response mapping
        if (data.artworks) {
          setArtworks(prev => prev.map(a => {
            const match = (data.artworks as Array<{ mnsdkId: string; workKey: string }>)
              .find(w => w.mnsdkId === a._id)
            if (match) return { ...a, torchId: `sub:${data.submissionId}:${match.workKey}` }
            return a
          }))
        }
      } else {
        const err: Record<string, SyncState> = {}
        ids.forEach(id => { err[id] = 'error' })
        setSyncState(prev => ({ ...prev, ...err }))
      }
    } catch {
      const err: Record<string, SyncState> = {}
      ids.forEach(id => { err[id] = 'error' })
      setSyncState(prev => ({ ...prev, ...err }))
    }

    setIsSyncing(false)
    setSelected(new Set())
  }

  // ── Counts ────────────────────────────────────────────────────────────────

  const syncedCount   = artworks.filter(a => a.torchId).length
  const unsyncedCount = artworks.length - syncedCount

  // ── Render ────────────────────────────────────────────────────────────────

  // Auth check loading
  if (authed === null) {
    return <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#888' }}>Checking auth…</div>
  }

  // Not logged in — show password form
  if (!authed) {
    return (
      <div style={{ padding: '40px', maxWidth: 360, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Torch Gallery Sync</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Log in met je admin wachtwoord om verder te gaan.</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin wachtwoord"
            autoFocus
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 6, marginBottom: 10, boxSizing: 'border-box' }}
          />
          {loginError && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{loginError}</p>}
          <button type="submit" disabled={loggingIn} style={{ width: '100%', padding: '10px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
            {loggingIn ? 'Inloggen…' : 'Inloggen'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          Torch Gallery Sync
        </h1>
        {!loading && (
          <p style={{ fontSize: 13, color: '#888', margin: '6px 0 0' }}>
            {syncedCount} synced · {unsyncedCount} not yet in Torch · {artworks.length} total
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6,
            fontSize: 13, outline: 'none', minWidth: 200,
          }}
        />

        {/* Filter tabs */}
        {(['all', 'unsynced', 'synced'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              border: filter === f ? '1.5px solid #111' : '1px solid #ddd',
              background: filter === f ? '#111' : '#fff',
              color: filter === f ? '#fff' : '#555',
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === 'all' ? 'All' : f === 'unsynced' ? 'Not in Torch' : 'In Torch'}
          </button>
        ))}

        {/* Quick select */}
        <button
          onClick={selectUnsynced}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            border: '1px solid #ddd', background: '#fff', color: '#555', marginLeft: 'auto',
          }}
        >
          Select unsynced
        </button>

        {/* Send button */}
        <button
          onClick={syncSelected}
          disabled={selected.size === 0 || isSyncing}
          style={{
            padding: '8px 20px', borderRadius: 6, fontSize: 13, cursor: selected.size === 0 || isSyncing ? 'default' : 'pointer',
            border: 'none', background: selected.size > 0 && !isSyncing ? '#111' : '#ccc',
            color: '#fff', fontWeight: 600,
          }}
        >
          {isSyncing ? 'Sending…' : `→ Send ${selected.size > 0 ? `${selected.size} ` : ''}to Torch`}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e5e5', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px 8px 0', width: 36 }}>
                <input
                  type="checkbox"
                  checked={selected.size === visible.length && visible.length > 0}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < visible.length }}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '8px 12px 8px 0', color: '#555', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '8px 12px', color: '#555', fontWeight: 600 }}>Year</th>
              <th style={{ padding: '8px 12px', color: '#555', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '8px 12px', color: '#555', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '8px 12px', color: '#555', fontWeight: 600 }}>Edition</th>
              <th style={{ padding: '8px 0', color: '#555', fontWeight: 600, textAlign: 'right' }}>Torch</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(artwork => {
              const state = syncState[artwork._id]
              const rowSynced = !!artwork.torchId
              return (
                <tr
                  key={artwork._id}
                  onClick={() => toggleOne(artwork._id)}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    background: selected.has(artwork._id) ? '#f5f5f5' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '9px 12px 9px 0' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(artwork._id)}
                      onChange={() => toggleOne(artwork._id)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '9px 12px 9px 0', fontWeight: 500, color: '#111' }}>
                    {artwork.title ?? '—'}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#555' }}>{artwork.year ?? '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    {artwork.category ? <Pill label={artwork.category} /> : <span style={{ color: '#bbb' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    {artwork.status
                      ? <Pill label={artwork.status.replace('_', ' ')} color={STATUS_COLOR[artwork.status]} />
                      : <span style={{ color: '#bbb' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#888' }}>
                    {artwork.editionType === 'edition' ? 'Edition' : ''}
                  </td>
                  <td style={{ padding: '9px 0', textAlign: 'right' }}>
                    {state === 'sending' && <span style={{ color: '#888', fontSize: 12 }}>Sending…</span>}
                    {state === 'ok'      && <span style={{ color: '#2e7d32', fontSize: 16 }}>✓</span>}
                    {state === 'error'   && <span style={{ color: '#c62828', fontSize: 12 }}>Error</span>}
                    {!state && rowSynced && <span style={{ color: '#2e7d32', fontSize: 12 }}>In Torch</span>}
                    {!state && !rowSynced && <span style={{ color: '#bbb', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '20px 0', color: '#aaa', textAlign: 'center' }}>
                  No artworks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useClient } from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  title: string
  quantity: number
  price: number
}

interface StatusEvent {
  status: string
  changedAt: string
  note?: string
}

interface Order {
  _id: string
  orderNumber: string
  createdAt: string
  status: string
  customerName: string
  customerEmail?: string
  items: OrderItem[]
  totalAmount: number
  statusHistory?: StatusEvent[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Gallery (manual) sales use the SD-YYMM-xxxx format (two hyphens).
 * Webshop orders use SD-{timestamp} (one hyphen, followed by ≥10 digits).
 */
function getSource(orderNumber: string): 'gallery' | 'webshop' {
  // SD-YYMM-xxxx → second hyphen exists and position 3-6 are 4 digits
  return /^SD-\d{4}-/.test(orderNumber) ? 'gallery' : 'webshop'
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function artworkList(items: OrderItem[]) {
  return items.map(i => i.title).join(', ')
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  wrap: {
    padding: '28px 32px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#111',
    maxWidth: 1200,
  } as React.CSSProperties,

  heading: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 4,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  sub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  } as React.CSSProperties,

  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 24,
  } as React.CSSProperties,

  statCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '14px 18px',
  } as React.CSSProperties,

  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 4,
  } as React.CSSProperties,

  statValue: {
    fontSize: 22,
    fontWeight: 600,
    color: '#111',
  } as React.CSSProperties,

  filters: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
    alignItems: 'center',
  } as React.CSSProperties,

  select: {
    padding: '6px 10px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    color: '#374151',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,

  search: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    outline: 'none',
    width: 220,
  } as React.CSSProperties,

  filterBtn: (active: boolean) => ({
    padding: '5px 12px',
    fontSize: 12,
    border: `1px solid ${active ? '#101112' : '#d1d5db'}`,
    borderRadius: 20,
    background: active ? '#101112' : '#fff',
    color: active ? '#fff' : '#374151',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    fontWeight: active ? 500 : 400,
  } as React.CSSProperties),

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  } as React.CSSProperties,

  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: '#9ca3af',
    fontWeight: 500,
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  } as React.CSSProperties,

  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:        { bg: '#dbeafe', color: '#1d4ed8' },
  processing: { bg: '#fef3c7', color: '#92400e' },
  shipped:    { bg: '#ede9fe', color: '#6d28d9' },
  delivered:  { bg: '#d1fae5', color: '#065f46' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: c.bg,
      color: c.color,
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 10,
      fontWeight: 500,
      letterSpacing: '0.03em',
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function SourceBadge({ source }: { source: 'gallery' | 'webshop' }) {
  const isGallery = source === 'gallery'
  return (
    <span style={{
      background: isGallery ? '#f3e8ff' : '#dbeafe',
      color:      isGallery ? '#7c3aed'  : '#1d4ed8',
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 10,
      fontWeight: 500,
      letterSpacing: '0.03em',
    }}>
      {isGallery ? 'Gallery' : 'Webshop'}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SalesOverviewTool() {
  const client = useClient({ apiVersion: '2024-01-01' })

  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [hoverId, setHoverId]   = useState<string | null>(null)

  // Filters
  const [source, setSource]     = useState<'all' | 'gallery' | 'webshop'>('all')
  const [status, setStatus]     = useState('all')
  const [year, setYear]         = useState('all')
  const [month, setMonth]       = useState('all')
  const [query, setQuery]       = useState('')

  // Load all orders
  useEffect(() => {
    const QUERY = `
      *[_type == "order" && !(_id in path("drafts.**"))] | order(createdAt desc) {
        _id, orderNumber, createdAt, status,
        customerName, customerEmail,
        items, totalAmount,
        statusHistory
      }
    `
    client.fetch<Order[]>(QUERY)
      .then(data => { setOrders(data ?? []); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [client])

  // Year options
  const years = useMemo(() => {
    const ys = [...new Set(orders.map(o => new Date(o.createdAt).getFullYear()))].sort((a, b) => b - a)
    return ys
  }, [orders])

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const src = getSource(o.orderNumber)
      if (source !== 'all' && src !== source) return false
      if (status !== 'all' && o.status !== status) return false
      const d = new Date(o.createdAt)
      if (year !== 'all' && d.getFullYear() !== Number(year)) return false
      if (month !== 'all' && d.getMonth() + 1 !== Number(month)) return false
      if (query) {
        const q = query.toLowerCase()
        const artworks = artworkList(o.items ?? []).toLowerCase()
        if (
          !o.customerName?.toLowerCase().includes(q) &&
          !o.customerEmail?.toLowerCase().includes(q) &&
          !o.orderNumber?.toLowerCase().includes(q) &&
          !artworks.includes(q)
        ) return false
      }
      return true
    })
  }, [orders, source, status, year, month, query])

  // Stats
  const totalRevenue = filtered.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const avgOrder     = filtered.length ? totalRevenue / filtered.length : 0

  if (loading) {
    return (
      <div style={{ ...s.wrap, color: '#9ca3af' }}>
        Loading orders…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...s.wrap, color: '#ef4444' }}>
        Error: {error}
      </div>
    )
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled']

  return (
    <div style={s.wrap}>
      <div style={s.heading}>Sales Overview</div>
      <div style={s.sub}>All orders — gallery sales and webshop combined</div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Orders</div>
          <div style={s.statValue}>{filtered.length}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Revenue (incl. VAT)</div>
          <div style={s.statValue}>{fmt(totalRevenue)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Avg order value</div>
          <div style={s.statValue}>{filtered.length ? fmt(avgOrder) : '—'}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        {/* Source filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'gallery', 'webshop'] as const).map(v => (
            <button key={v} style={s.filterBtn(source === v)} onClick={() => setSource(v)}>
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

        {/* Status filter */}
        <select style={s.select} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(st => (
            <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
          ))}
        </select>

        {/* Year */}
        <select style={s.select} value={year} onChange={e => { setYear(e.target.value); setMonth('all') }}>
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Month */}
        <select style={s.select} value={month} onChange={e => setMonth(e.target.value)} disabled={year === 'all'}>
          <option value="all">All months</option>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>

        {/* Search */}
        <input
          style={s.search}
          placeholder="Search name, email, artwork, order #…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 0', color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>
          No orders found
        </div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Date</th>
              <th style={s.th}>Order #</th>
              <th style={s.th}>Source</th>
              <th style={s.th}>Buyer</th>
              <th style={s.th}>Artworks</th>
              <th style={s.th}>Status</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Total</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const src = getSource(order.orderNumber)
              const isHovered = hoverId === order._id
              return (
                <tr
                  key={order._id}
                  onMouseEnter={() => setHoverId(order._id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ background: isHovered ? '#f9fafb' : 'transparent', transition: 'background 0.1s' }}
                >
                  <td style={{ ...s.td, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {fmtDate(order.createdAt)}
                  </td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
                    {order.orderNumber}
                  </td>
                  <td style={s.td}>
                    <SourceBadge source={src} />
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                    {order.customerEmail && (
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{order.customerEmail}</div>
                    )}
                  </td>
                  <td style={{ ...s.td, color: '#374151', maxWidth: 240 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {artworkList(order.items ?? [])}
                    </div>
                  </td>
                  <td style={s.td}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {fmt(order.totalAmount ?? 0)}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <a
                      href={`/admin/invoices/${order.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Invoice ↗
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
        {filtered.length} order{filtered.length !== 1 ? 's' : ''} shown
        {filtered.length !== orders.length ? ` (${orders.length} total)` : ''}
      </div>
    </div>
  )
}

'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useListClient } from './useListClient'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  title: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  createdAt: string
  status: string
  channel?: string
  stripeSessionId?: string
  customerName: string
  customerEmail?: string
  items: OrderItem[]
  totalAmount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Waar de verkoop vandaan komt. Sinds `channel` op de order staat is dat een
 * feit; oudere orders hebben het veld niet en worden herkend aan een
 * Stripe-sessie, anders is het een handmatige verkoop.
 */
function getSource(o: { channel?: string; stripeSessionId?: string }): string {
  return o.channel ?? (o.stripeSessionId ? 'webshop' : 'direct')
}

const CHANNEL_LABEL: Record<string, string> = {
  direct: 'Studio / direct',
  gallery: 'Via a gallery',
  artfair: 'Art Fair',
  webshop: 'Webshop',
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
  paid:       { bg: '#d1fae5', color: '#065f46' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      fontWeight: 500, letterSpacing: '0.03em',
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const CHANNEL_COLORS: Record<string, [string, string]> = {
  direct:  ['#f3e8ff', '#7c3aed'],
  gallery: ['#fef3c7', '#92400e'],
  artfair: ['#dcfce7', '#166534'],
  webshop: ['#dbeafe', '#1d4ed8'],
}

function SourceBadge({ source }: { source: string }) {
  const [bg, fg] = CHANNEL_COLORS[source] ?? ['#f3f4f6', '#4b5563']
  return (
    <span style={{
      background: bg, color: fg,
      fontSize: 11, padding: '2px 8px', borderRadius: 10,
      fontWeight: 500, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {CHANNEL_LABEL[source] ?? source}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function SalesTab() {
  const client = useListClient()

  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const [source, setSource] = useState<string>('all')
  const [status, setStatus] = useState('all')
  const [year, setYear]     = useState('all')
  const [month, setMonth]   = useState('all')
  const [query, setQuery]   = useState('')

  useEffect(() => {
    client.fetch<Order[]>(`
      *[_type == "order" && !(_id in path("drafts.**"))] | order(createdAt desc) {
        _id, orderNumber, createdAt, status, channel, stripeSessionId,
        "customerName": coalesce(contact->firstName + " " + contact->lastName, customerName),
        "customerEmail": coalesce(contact->email, customerEmail),
        items, totalAmount
      }
    `).then(data => { setOrders(data ?? []); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [client])

  const years = useMemo(() => {
    return [...new Set(orders.map(o => new Date(o.createdAt).getFullYear()))].sort((a, b) => b - a)
  }, [orders])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (source !== 'all' && getSource(o) !== source) return false
      if (status !== 'all' && o.status !== status) return false
      const d = new Date(o.createdAt)
      if (year !== 'all' && d.getFullYear() !== Number(year)) return false
      if (month !== 'all' && d.getMonth() + 1 !== Number(month)) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !o.customerName?.toLowerCase().includes(q) &&
          !o.customerEmail?.toLowerCase().includes(q) &&
          !o.orderNumber?.toLowerCase().includes(q) &&
          !artworkList(o.items ?? []).toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [orders, source, status, year, month, query])

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const avgOrder     = filtered.length ? totalRevenue / filtered.length : 0

  if (loading) return <div style={{ ...s.wrap, color: '#9ca3af' }}>Loading orders…</div>
  if (error)   return <div style={{ ...s.wrap, color: '#ef4444' }}>Error: {error}</div>

  const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const STATUSES = ['awaiting-payment','paid','cancelled','refunded']

  return (
    <div style={s.wrap}>
      <div style={s.heading}>Sales Overview</div>
      <div style={s.sub}>Gallery sales and webshop orders combined</div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Orders</div>
          <div style={s.statValue}>{filtered.length}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Revenue (incl. BTW)</div>
          <div style={s.statValue}>{fmt(totalRevenue)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Avg order value</div>
          <div style={s.statValue}>{filtered.length ? fmt(avgOrder) : '—'}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'direct', 'gallery', 'artfair', 'webshop'].map(v => (
            <button key={v} style={s.filterBtn(source === v)} onClick={() => setSource(v)}>
              {v === 'all' ? 'All' : CHANNEL_LABEL[v] ?? v}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

        <select style={s.select} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(st => (
            <option key={st} value={st}>{st === 'awaiting-payment' ? 'Awaiting payment' : st.charAt(0).toUpperCase() + st.slice(1)}</option>
          ))}
        </select>

        <select style={s.select} value={year} onChange={e => { setYear(e.target.value); setMonth('all') }}>
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select style={s.select} value={month} onChange={e => setMonth(e.target.value)} disabled={year === 'all'}>
          <option value="all">All months</option>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>

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
              const src = getSource(order)
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
        {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== orders.length ? ` (${orders.length} total)` : ''}
      </div>
    </div>
  )
}

// ── BTW / Tax ─────────────────────────────────────────────────────────────────

interface VatRow {
  date: string
  description: string
  net: number
  rate: string
  vat: number
  gross: number
  source: string
}

interface VatBucket { rate: string; netTotal: number; vatTotal: number; grossTotal: number; count: number }

/**
 * De aangifte leest uitsluitend `order`.
 *
 * `purchases[]` op het contact beschrijft dezelfde verkoop nog een keer — de
 * verkooptool schrijft beide weg — dus meetellen zou elke handmatige verkoop
 * verdubbelen. Bovendien heeft een purchase-regel geen BTW-tarief en bij ruim
 * de helft ook geen datum: het is verkoopgeschiedenis voor het CRM, geen
 * grootboek. Geannuleerd en terugbetaald tellen niet mee.
 */
function VatTab() {
  const client = useListClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<VatRow[]>([])
  const [buckets, setBuckets] = useState<VatBucket[]>([])

  useEffect(() => {
    setLoading(true)
    const y = parseInt(year)
    client.fetch<Array<{
      orderNumber?: string; customerName?: string; createdAt?: string; _createdAt?: string
      channel?: string; stripeSessionId?: string
      items?: Array<{ title?: string; quantity?: number; priceExcl?: number; price?: number; vatRate?: number }>
    }>>(
      `*[_type == "order" && status in ["awaiting-payment", "paid"]
         && !(_id in path("drafts.**"))
         && (createdAt >= $from && createdAt < $to)] | order(createdAt asc) {
        orderNumber, createdAt, _createdAt, channel, stripeSessionId,
        "customerName": coalesce(contact->firstName + " " + contact->lastName, customerName),
        items[]{ title, quantity, priceExcl, price, vatRate }
      }`,
      { from: `${y}-01-01`, to: `${y + 1}-01-01` },
    ).then(orders => {
      const all: VatRow[] = []
      for (const o of orders) {
        const raw = o.createdAt || o._createdAt
        const date = raw ? new Date(raw).toLocaleDateString('nl-NL') : '—'
        for (const item of o.items ?? []) {
          const rate = item.vatRate ?? 9
          // Staat er alleen een brutoprijs, dan rekenen we terug — beter een
          // benadering dan de regel laten vallen.
          const net = item.priceExcl != null
            ? item.priceExcl * (item.quantity ?? 1)
            : ((item.price ?? 0) / (1 + rate / 100)) * (item.quantity ?? 1)
          const vat = net * (rate / 100)
          all.push({
            date,
            description: item.title || `Order ${o.orderNumber ?? ''}`.trim(),
            net, rate: String(rate), vat, gross: net + vat,
            source: `${CHANNEL_LABEL[getSource(o)] ?? '—'} · ${o.customerName || o.orderNumber || '—'}`,
          })
        }
      }
      const map: Record<string, VatBucket> = {}
      for (const r of all) {
        map[r.rate] ??= { rate: r.rate, netTotal: 0, vatTotal: 0, grossTotal: 0, count: 0 }
        map[r.rate].netTotal += r.net
        map[r.rate].vatTotal += r.vat
        map[r.rate].grossTotal += r.gross
        map[r.rate].count++
      }
      setRows(all)
      setBuckets(Object.values(map).sort((a, b) => parseInt(a.rate) - parseInt(b.rate)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [client, year])

  const totalNet = buckets.reduce((t, b) => t + b.netTotal, 0)
  const totalVat = buckets.reduce((t, b) => t + b.vatTotal, 0)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Paid and awaiting payment. Cancelled and refunded are excluded.
        </span>
      </div>

      {loading ? <div style={{ color: '#9ca3af' }}>Loading…</div> : (
        <>
          <div style={s.stats}>
            <div style={s.statCard}>
              <div style={s.statLabel}>Net (excl. BTW)</div>
              <div style={s.statValue}>{fmt(totalNet)}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>BTW to declare</div>
              <div style={s.statValue}>{fmt(totalVat)}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>Gross</div>
              <div style={s.statValue}>{fmt(totalNet + totalVat)}</div>
            </div>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Rate</th>
                <th style={s.th}>Lines</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Net</th>
                <th style={{ ...s.th, textAlign: 'right' }}>BTW</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Gross</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map(b => (
                <tr key={b.rate}>
                  <td style={s.td}>{b.rate}%</td>
                  <td style={{ ...s.td, color: '#6b7280' }}>{b.count}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{fmt(b.netTotal)}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{fmt(b.vatTotal)}</td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 500 }}>{fmt(b.grossTotal)}</td>
                </tr>
              ))}
              {buckets.length === 0 && (
                <tr><td style={{ ...s.td, color: '#9ca3af' }} colSpan={5}>No orders in {year}.</td></tr>
              )}
            </tbody>
          </table>

          {rows.length > 0 && (
            <>
              <div style={{ ...s.statLabel, margin: '28px 0 8px' }}>Per line</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Description</th>
                    <th style={s.th}>Source</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Net</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Rate</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>BTW</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...s.td, whiteSpace: 'nowrap', color: '#6b7280' }}>{r.date}</td>
                      <td style={s.td}>{r.description}</td>
                      <td style={{ ...s.td, color: '#6b7280', fontSize: 12 }}>{r.source}</td>
                      <td style={{ ...s.td, textAlign: 'right' }}>{fmt(r.net)}</td>
                      <td style={{ ...s.td, textAlign: 'right', color: '#6b7280' }}>{r.rate}%</td>
                      <td style={{ ...s.td, textAlign: 'right' }}>{fmt(r.vat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function Bars({ data, empty }: { data: [string, number][]; empty: string }) {
  const max = Math.max(...data.map(d => d[1]), 1)
  if (data.length === 0) return <div style={{ color: '#9ca3af', fontSize: 13 }}>{empty}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 150, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 3, height: 18, position: 'relative' }}>
            <div style={{ width: `${(value / max) * 100}%`, background: '#111', height: '100%', borderRadius: 3 }} />
          </div>
          <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</div>
        </div>
      ))}
    </div>
  )
}

/**
 * Omzet uitgesplitst, per regel geteld — niet per order. Een order met vier
 * werken erin zou anders als één verkoop tellen.
 *
 * Leest alleen orders, om dezelfde reden als de BTW-tab. De 660 regels in
 * `purchases[]` zijn oudere verkoopgeschiedenis zonder BTW-tarief en vaak
 * zonder datum; die staan per contact onder History.
 */
function AnalyticsTab() {
  const client = useListClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [loading, setLoading] = useState(true)
  const [lines, setLines] = useState<Array<{ amount: number; channel: string; buyer: string; category?: string; month: number }>>([])

  useEffect(() => {
    setLoading(true)
    const y = parseInt(year)
    client.fetch<Array<{
      createdAt?: string; channel?: string; stripeSessionId?: string; customerName?: string
      items?: Array<{ priceExcl?: number; price?: number; quantity?: number; category?: string }>
    }>>(
      `*[_type == "order" && status in ["awaiting-payment", "paid"]
         && !(_id in path("drafts.**"))
         && createdAt >= $from && createdAt < $to] {
        createdAt, channel, stripeSessionId,
        "customerName": coalesce(contact->firstName + " " + contact->lastName, customerName),
        "items": items[]{ priceExcl, price, quantity, "category": item->category }
      }`,
      { from: `${y}-01-01`, to: `${y + 1}-01-01` },
    ).then(orders => {
      setLines(orders.flatMap(o => (o.items ?? []).map(it => ({
        amount: (it.priceExcl ?? it.price ?? 0) * (it.quantity ?? 1),
        channel: getSource(o),
        buyer: o.customerName || '—',
        category: it.category,
        month: o.createdAt ? new Date(o.createdAt).getMonth() : 0,
      }))))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [client, year])

  const sumBy = useCallback((key: (l: typeof lines[number]) => string | undefined) => {
    const map: Record<string, number> = {}
    for (const l of lines) {
      const k = key(l)
      if (k) map[k] = (map[k] ?? 0) + l.amount
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [lines])

  const byChannel   = useMemo(() => sumBy(l => CHANNEL_LABEL[l.channel] ?? l.channel), [sumBy])
  const byCategory  = useMemo(() => sumBy(l => l.category), [sumBy])
  const byCollector = useMemo(() => sumBy(l => l.buyer).slice(0, 10), [sumBy])
  const byMonth = useMemo(() => {
    const arr = Array(12).fill(0)
    for (const l of lines) arr[l.month] += l.amount
    return arr
  }, [lines])

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const maxMonth = Math.max(...byMonth, 1)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const total = lines.reduce((t, l) => t + l.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Amounts excl. BTW, counted per line.
        </span>
      </div>

      {loading ? <div style={{ color: '#9ca3af' }}>Loading…</div> : (
        <>
          <div style={s.stats}>
            <div style={s.statCard}>
              <div style={s.statLabel}>Revenue {year}</div>
              <div style={s.statValue}>{fmt(total)}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>Works sold</div>
              <div style={s.statValue}>{lines.length}</div>
            </div>
          </div>

          <div style={{ ...s.statLabel, margin: '28px 0 12px' }}>Per month</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {byMonth.map((v, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }} title={fmt(v)}>
                <div style={{ height: `${(v / maxMonth) * 100}px`, background: v ? '#111' : '#e5e7eb', borderRadius: 2, minHeight: 2 }} />
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{MONTHS[i]}</div>
              </div>
            ))}
          </div>

          <div style={{ ...s.statLabel, margin: '32px 0 12px' }}>Per channel</div>
          <Bars data={byChannel} empty={`No sales in ${year}.`} />

          <div style={{ ...s.statLabel, margin: '32px 0 12px' }}>Per category</div>
          <Bars data={byCategory} empty="No categories on the sold items." />

          <div style={{ ...s.statLabel, margin: '32px 0 12px' }}>Top collectors</div>
          <Bars data={byCollector} empty={`No sales in ${year}.`} />
        </>
      )}
    </div>
  )
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

export function SalesOverviewTool() {
  const [tab, setTab] = useState<'sales' | 'analytics' | 'btw'>('sales')

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, padding: '20px 32px 0', borderBottom: '1px solid #e5e7eb' }}>
        {([['sales', 'Sales'], ['analytics', 'Analytics'], ['btw', 'BTW / Tax']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 14px', fontSize: 13, fontFamily: 'inherit',
              color: tab === key ? '#111' : '#6b7280',
              fontWeight: tab === key ? 600 : 400,
              borderBottom: tab === key ? '2px solid #111' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'sales' && <SalesTab />}
      {(tab === 'analytics' || tab === 'btw') && (
        <div style={s.wrap}>{tab === 'btw' ? <VatTab /> : <AnalyticsTab />}</div>
      )}
    </div>
  )
}

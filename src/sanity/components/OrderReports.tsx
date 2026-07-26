'use client'
import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

interface OrderSummary {
  _id: string
  orderNumber: string
  customerName?: string
  status: string
  totalAmount?: number
  createdAt?: string
}

interface Stats {
  total: number
  revenue: number
  byStatus: Record<string, number>
  recentOrders: OrderSummary[]
}

const STATUS_COLORS: Record<string, string> = {
  new:        '#e03131',
  processing: '#f08c00',
  shipped:    '#2f9e44',
  delivered:  '#2f9e44',
  cancelled:  '#868e96',
  refunded:   '#868e96',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New', processing: 'Processing', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}

export function OrderReports(_props: Record<string, unknown>) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    setLoading(true)
    const since = period === 'all' ? null : new Date(Date.now() - { '7d': 7, '30d': 30, '90d': 90 }[period] * 86400000).toISOString()
    const filter = since
      ? `_type == "order" && createdAt > "${since}"`
      : `_type == "order"`

    client.fetch<OrderSummary[]>(
      `*[${filter}]{ _id, orderNumber, customerName, status, totalAmount, createdAt } | order(createdAt desc)`
    ).then(orders => {
      const byStatus: Record<string, number> = {}
      let revenue = 0
      for (const o of orders) {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1
        if (o.status !== 'cancelled' && o.status !== 'refunded') {
          revenue += o.totalAmount || 0
        }
      }
      setStats({ total: orders.length, revenue, byStatus, recentOrders: orders.slice(0, 10) })
      setLoading(false)
    })
  }, [client, period])

  const card: React.CSSProperties = {
    background: 'var(--card-bg-color, #fff)',
    border: '1px solid var(--card-border-color, #e0e0e0)',
    borderRadius: 6, padding: '20px 24px',
  }

  const periodBtn = (p: typeof period, label: string) => (
    <button
      key={p}
      onClick={() => setPeriod(p)}
      style={{
        padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
        border: '1px solid var(--card-border-color, #ddd)',
        background: period === p ? 'var(--card-fg-color, #111)' : 'transparent',
        color: period === p ? 'var(--card-bg-color, #fff)' : 'var(--card-muted-fg-color, #666)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font-family-sans, sans-serif)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--card-fg-color, #111)' }}>
          Order Reports
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {periodBtn('7d', 'Last 7 days')}
          {periodBtn('30d', 'Last 30 days')}
          {periodBtn('90d', 'Last 90 days')}
          {periodBtn('all', 'All time')}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--card-muted-fg-color, #888)', fontSize: 14 }}>Loading…</p>
      ) : !stats ? null : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={card}>
              <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)' }}>Total orders</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{stats.total}</p>
            </div>
            <div style={card}>
              <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)' }}>Revenue</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>€{stats.revenue.toFixed(2)}</p>
            </div>
            <div style={card}>
              <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)' }}>New orders</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#e03131' }}>{stats.byStatus['new'] || 0}</p>
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ ...card, marginBottom: 24 }}>
            <p style={{ margin: '0 0 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)' }}>By status</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: `${STATUS_COLORS[status] || '#868e96'}18` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] || '#868e96', display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{STATUS_LABELS[status] || status}</span>
                  <span style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #888)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders table */}
          <div style={card}>
            <p style={{ margin: '0 0 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)' }}>Recent orders</p>
            {stats.recentOrders.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--card-muted-fg-color, #888)', margin: 0 }}>No orders in this period.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border-color, #e0e0e0)' }}>
                    {['Order', 'Customer', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 0 8px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--card-muted-fg-color, #888)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(o => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--card-border-color, #eee)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 500 }}>{o.orderNumber}</td>
                      <td style={{ padding: '10px 0', color: 'var(--card-muted-fg-color, #666)' }}>{o.customerName || '—'}</td>
                      <td style={{ padding: '10px 0', color: 'var(--card-muted-fg-color, #666)' }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 0' }}>{o.totalAmount != null ? `€${o.totalAmount.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px 0' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 10, background: `${STATUS_COLORS[o.status] || '#868e96'}18`, fontSize: 12 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[o.status] || '#868e96', display: 'inline-block' }} />
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

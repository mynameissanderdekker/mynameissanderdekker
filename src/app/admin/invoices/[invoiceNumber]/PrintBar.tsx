'use client'

interface Props {
  orderNumber: string
}

export function PrintBar({ orderNumber }: Props) {
  return (
    <div className="no-print" style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: '#fff', borderBottom: '1px solid #e0e0e0',
      padding: '10px 32px', display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <a href="/admin" style={{ fontSize: 12, color: '#aaa', textDecoration: 'none', letterSpacing: '0.05em' }}>← Admin</a>
      <span style={{ color: '#e0e0e0' }}>|</span>
      <span style={{ fontSize: 13, color: '#555' }}>{orderNumber}</span>
      <button
        onClick={() => window.print()}
        style={{
          marginLeft: 'auto', padding: '6px 18px', fontSize: 12,
          border: '1px solid #111', borderRadius: 3, background: '#111',
          color: '#fff', cursor: 'pointer', letterSpacing: '0.06em',
        }}
      >
        Print / Save PDF
      </button>
    </div>
  )
}

'use client'

interface Props {
  invoiceNumber: string
  lang: 'en' | 'nl'
}

export function InvoiceToolbar({ invoiceNumber, lang }: Props) {
  return (
    <div
      className="no-print"
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#111', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <a href="/admin" style={{ color: '#9ca3af', fontSize: 12, textDecoration: 'none' }}>← Admin</a>
      <span style={{ color: '#374151' }}>|</span>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Invoice {invoiceNumber}</span>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['en', 'nl'] as const).map((l) => (
          <a
            key={l}
            href={`?lang=${l}`}
            style={{
              color: l === lang ? '#fff' : '#6b7280',
              fontSize: 12, textDecoration: 'none',
              padding: '5px 12px',
              border: `1px solid ${l === lang ? '#fff' : '#374151'}`,
              borderRadius: 4,
              fontWeight: l === lang ? 700 : 400,
            }}
          >
            {l.toUpperCase()}
          </a>
        ))}
        <button
          onClick={() => window.print()}
          style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            background: '#374151', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  )
}

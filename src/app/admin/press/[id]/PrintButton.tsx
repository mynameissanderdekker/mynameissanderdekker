'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: '#111', color: '#fff', border: 'none',
        padding: '8px 20px', borderRadius: '4px', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600,
      }}
    >
      Print / Save as PDF
    </button>
  )
}

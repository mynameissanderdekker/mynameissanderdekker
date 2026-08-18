'use client'
import React from 'react'
import type { FieldProps } from 'sanity'
import { useFormValue } from 'sanity'

function ArtworkCoAInner({ artworkId }: { artworkId?: string }) {
  if (!artworkId) {
    return (
      <div style={{ fontSize: 13, color: '#9ca3af', padding: '8px 0' }}>
        Save the artwork first to generate a certificate.
      </div>
    )
  }

  const cleanId = artworkId.replace(/^drafts\./, '')
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${base}/admin/artwork/${cleanId}/coa`

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', fontSize: 12, letterSpacing: '0.08em',
    textTransform: 'uppercase', border: '1px solid #ddd',
    background: 'white', color: '#222', cursor: 'pointer',
    textDecoration: 'none', fontFamily: 'inherit', borderRadius: 3,
  }

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#888', letterSpacing: '0.04em' }}>
        Opens a print-ready A4 page — use ⌘P / Ctrl+P to print or save as PDF.
      </p>
      <a href={url} target="_blank" rel="noreferrer" style={btn}>
        📜 Certificate of Authenticity
      </a>
    </div>
  )
}

export function ArtworkCoA(props: FieldProps) {
  const artworkId = useFormValue(['_id']) as string | undefined
  return <ArtworkCoAInner artworkId={artworkId} />
}

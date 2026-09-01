'use client'
import { useFormValue } from 'sanity'
import { useState } from 'react'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://mynameissanderdekker.com'

export function ShareProposalLink() {
  const id = useFormValue(['_id']) as string | undefined
  const [copied, setCopied] = useState(false)

  const cleanId = id?.replace(/^drafts\./, '')

  if (!cleanId) {
    return (
      <div style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#9ca3af' }}>
        Sla eerst op om de deellink te genereren.
      </div>
    )
  }

  const url = `${SITE}/proposal/${cleanId}`

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb',
      }}>
        <span style={{ flex: 1, fontSize: 13, color: '#374151', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {url}
        </span>
        <button
          onClick={copy}
          style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 6, border: 'none',
            background: copied ? '#059669' : '#111', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✓ Gekopieerd' : 'Kopieer'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb',
            background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'inherit',
          }}
        >
          Bekijk ↗
        </a>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Deel deze link met de klant. Geen account vereist.</p>
    </div>
  )
}

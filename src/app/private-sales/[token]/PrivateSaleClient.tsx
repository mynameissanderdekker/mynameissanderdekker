'use client'

import { useState, useRef } from 'react'

interface ArtworkItem {
  artwork: {
    _id: string
    title?: string
    year?: number
    medium?: string
    dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number }
    priceExclVAT?: number
    vatRate?: number
  }
  priceOverride?: number
  note?: string
  imageUrl?: string | null
}

interface Sale {
  title: string
  recipientName: string
  introText?: string
  footerText?: string
  artworks: ArtworkItem[]
}

interface Props {
  sale: Sale
  requiresPassword: boolean
  correctPassword: string | null
}

export default function PrivateSaleClient({ sale, requiresPassword, correctPassword }: Props) {
  const [unlocked, setUnlocked] = useState(!requiresPassword)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwInput === correctPassword) {
      setUnlocked(true)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  function handlePrint() {
    window.print()
  }

  // ── Password gate ────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 360, width: '100%', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#888', marginBottom: 32 }}>Private Selection</p>
          <p style={{ fontSize: 15, color: '#333', marginBottom: 24 }}>This selection is password protected.</p>
          <form onSubmit={handlePassword}>
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: pwError ? '1px solid #e03131' : '1px solid #ddd',
                borderRadius: 4, outline: 'none', boxSizing: 'border-box',
                marginBottom: 8,
              }}
            />
            {pwError && <p style={{ fontSize: 12, color: '#e03131', margin: '0 0 12px' }}>Incorrect password</p>}
            <button
              type="submit"
              style={{ width: '100%', padding: '10px', fontSize: 13, background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}
            >
              View selection
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page { padding: 40px !important; }
          .artwork-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
          .artwork-card { break-inside: avoid; }
          .artwork-image { height: 260px !important; }
        }
        @media screen {
          .print-page { padding: 48px 40px; }
        }
      `}</style>

      <div ref={printRef} className="print-page" style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'Georgia, serif', minHeight: '100vh', background: '#fafaf9' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, borderBottom: '1px solid #e0e0e0', paddingBottom: 32 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#888' }}>Private Selection</p>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 400, color: '#111' }}>Sander Dekker</h1>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Prepared for {sale.recipientName}</p>
          </div>
          <button
            onClick={handlePrint}
            className="no-print"
            style={{
              padding: '8px 20px', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
              background: 'transparent', border: '1px solid #333', borderRadius: 3,
              cursor: 'pointer', color: '#333',
            }}
          >
            Export PDF
          </button>
        </div>

        {/* Intro text */}
        {sale.introText && (
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', maxWidth: 640, marginBottom: 48, fontStyle: 'italic' }}>
            {sale.introText}
          </p>
        )}

        {/* Artworks grid */}
        <div
          className="artwork-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 40, marginBottom: 64 }}
        >
          {sale.artworks.map((item, i) => {
            const { artwork, priceOverride, note, imageUrl } = item
            const priceExcl = priceOverride ?? artwork.priceExclVAT
            const vatRate = artwork.vatRate ?? 9
            const priceIncl = priceExcl != null ? priceExcl * (1 + vatRate / 100) : null

            const dims = artwork.dimensions
            const dimStr = dims
              ? [dims.widthCm, dims.heightCm, dims.depthCm].filter(Boolean).join(' × ') + ' cm'
              : null

            return (
              <div key={artwork._id ?? i} className="artwork-card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Image */}
                <div
                  className="artwork-image"
                  style={{ width: '100%', height: 320, background: '#efefed', overflow: 'hidden', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={artwork.title ?? ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#aaa', letterSpacing: 1 }}>No image</span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 400, color: '#111' }}>
                    {artwork.title ?? 'Untitled'}{artwork.year ? `, ${artwork.year}` : ''}
                  </p>
                  {artwork.medium && (
                    <p style={{ margin: '0 0 2px', fontSize: 12, color: '#666', fontStyle: 'italic' }}>{artwork.medium}</p>
                  )}
                  {dimStr && (
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>{dimStr}</p>
                  )}
                  {priceExcl != null && (
                    <p style={{ margin: '0 0 4px', fontSize: 14, color: '#111' }}>
                      €{priceExcl.toLocaleString('nl-NL', { minimumFractionDigits: 0 })} excl. VAT
                      {priceIncl != null && (
                        <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>
                          (€{Math.round(priceIncl).toLocaleString('nl-NL')} incl.)
                        </span>
                      )}
                    </p>
                  )}
                  {note && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#777', fontStyle: 'italic', lineHeight: 1.5 }}>{note}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {sale.footerText && (
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 32 }}>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{sale.footerText}</p>
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: 11, color: '#bbb', letterSpacing: 1, margin: 0 }}>
            SANDER DEKKER · hello@mynameissanderdekker.com · mynameissanderdekker.com
          </p>
        </div>

      </div>
    </>
  )
}

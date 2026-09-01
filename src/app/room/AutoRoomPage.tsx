'use client'

import { useEffect, useState } from 'react'
import EnquirePanel from '@/components/EnquirePanel'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArtworkData {
  _id: string
  title: string
  year: number
  medium?: string
  status: string
  priceIncVat?: number
  priceExclVAT?: number
  vatRate?: string
  editionType?: string
  editionTotal?: number
  editionAP?: number
  widthCm?: number
  heightCm?: number
  depthCm?: number
  slug?: string
  image?: string
}

interface RoomArtwork {
  _key: string
  contextNote?: string
  artwork: ArtworkData
}

interface Room {
  title: string
  gallery?: string
  fair?: string
  location?: string
  startDate?: string
  endDate?: string
  showPrices: boolean
  artworks: RoomArtwork[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDimensions(a: ArtworkData) {
  const parts = [a.widthCm, a.heightCm, a.depthCm].filter((v) => v != null)
  return parts.length ? `${parts.join(' × ')} cm` : null
}

function formatPrice(priceExcl: number, vatRate?: string) {
  const rate = vatRate === '21' ? 21 : vatRate === '0' ? 0 : 9
  const incl = priceExcl * (1 + rate / 100)
  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  return { excl: fmt(priceExcl), incl: fmt(incl), rate }
}

function fmtDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AutoRoomPage({ apiPath }: { apiPath: string }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeArtwork, setActiveArtwork] = useState<ArtworkData | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((data) => { setRoom(data); setLoading(false) })
      .catch(() => { setError('Er ging iets mis'); setLoading(false) })
  }, [apiPath])

  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── States ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="room-page room-page--loading"><div className="room-loading-indicator" /></div>
  if (error) return <div className="room-page"><div className="room-error"><p>{error}</p></div></div>
  if (!room) return null

  const venue = room.gallery ?? room.fair
  const dateRange = [fmtDate(room.startDate), fmtDate(room.endDate)].filter(Boolean).join(' – ')

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />

      <div className="room-page">
        {/* Header */}
        <header className="room-header">
          <h1 className="room-title">{room.title}</h1>
          {(venue || room.location) && (
            <p className="room-description">
              {[venue, room.location].filter(Boolean).join(' · ')}
            </p>
          )}
          {dateRange && <p className="room-description" style={{ opacity: 0.6, fontSize: 13 }}>{dateRange}</p>}
        </header>

        {/* Actions */}
        <div className="room-actions no-print flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-[12px] tracking-[0.15em] uppercase text-gray-500 hover:border-black hover:text-black transition-colors duration-150"
          >
            Deel ↗
          </button>
        </div>

        {/* Share modal */}
        {showShare && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowShare(false)}
          >
            <div
              className="bg-white p-8 max-w-xs w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">Deel prijslijst</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
                alt="QR code"
                width={160}
                height={160}
                className="mx-auto mb-4"
              />
              <p className="text-xs text-gray-500 break-all mb-4">{shareUrl}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={copyLink}
                  className="border border-gray-300 px-4 py-2 text-[11px] tracking-[0.15em] uppercase hover:border-black transition-colors"
                >
                  {copied ? 'Gekopieerd ✓' : 'Kopieer link'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-gray-300 px-4 py-2 text-[11px] tracking-[0.15em] uppercase hover:border-black transition-colors"
                >
                  WhatsApp
                </a>
              </div>
              <button
                onClick={() => setShowShare(false)}
                className="mt-6 text-xs text-gray-400 underline"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}

        {/* Artworks */}
        <div className="room-artworks">
          {room.artworks.map(({ _key, artwork, contextNote }) => {
            const dims = formatDimensions(artwork)
            const priceExcl = artwork.priceExclVAT
            const price = priceExcl != null ? formatPrice(priceExcl, artwork.vatRate) : null

            return (
              <article key={_key} className="room-artwork">
                <div className="room-artwork-image-wrap">
                  {artwork.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${artwork.image}?w=800&auto=format`}
                      alt={artwork.title}
                      className="room-artwork-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="room-artwork-image-placeholder" />
                  )}
                </div>

                <div className="room-artwork-info">
                  <h2 className="room-artwork-title">{artwork.title}</h2>
                  <p className="room-artwork-year">{artwork.year}</p>

                  {artwork.medium && <p className="room-artwork-meta">{artwork.medium}</p>}
                  {dims && <p className="room-artwork-meta">{dims}</p>}
                  {artwork.editionTotal != null && (
                    <p className="room-artwork-meta">
                      Editie van {artwork.editionTotal}
                      {artwork.editionAP ? ` + ${artwork.editionAP} AP` : ''}
                    </p>
                  )}

                  {room.showPrices && price && (
                    <div className="room-artwork-price">
                      <p className="room-artwork-price-incl">{price.incl} incl. {price.rate}% BTW</p>
                      <p className="room-artwork-price-excl">{price.excl} excl. BTW</p>
                    </div>
                  )}

                  {contextNote && <p className="room-artwork-note">{contextNote}</p>}

                  <div className="room-artwork-status">
                    {artwork.status === 'available' && (
                      <span className="room-status-badge room-status-badge--available">Beschikbaar</span>
                    )}
                    {artwork.status === 'sold' && (
                      <span className="room-status-badge room-status-badge--sold">Verkocht</span>
                    )}
                    {artwork.status === 'reserved' && (
                      <span className="room-status-badge room-status-badge--reserved">Gereserveerd</span>
                    )}
                  </div>

                  {artwork.status === 'available' && (
                    <button
                      className="room-enquire-btn no-print"
                      onClick={() => setActiveArtwork(artwork)}
                    >
                      Interesse
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <footer className="room-footer no-print">
          <p>
            Vragen?{' '}
            <a href="mailto:hello@mynameissanderdekker.com">hello@mynameissanderdekker.com</a>
          </p>
        </footer>
      </div>

      <EnquirePanel
        artwork={activeArtwork}
        viewingRoomSlug=""
        onClose={() => setActiveArtwork(null)}
      />
    </>
  )
}

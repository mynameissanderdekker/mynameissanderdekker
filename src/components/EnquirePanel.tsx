'use client'

import { useEffect, useRef, useState } from 'react'

interface Artwork {
  _id: string
  title: string
  year: number
  image?: string
  slug?: string
}

interface EnquirePanelProps {
  artwork: Artwork | null
  viewingRoomSlug?: string
  onClose: () => void
}

export default function EnquirePanel({ artwork, viewingRoomSlug, onClose }: EnquirePanelProps) {
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // Animate in
  useEffect(() => {
    if (artwork) {
      requestAnimationFrame(() => setVisible(true))
      // Pre-fill message
      setMessage(artwork.title ? `Ik heb interesse in "${artwork.title}" (${artwork.year}).` : '')
      setStatus('idle')
      setErrorMsg('')
    } else {
      setVisible(false)
    }
  }, [artwork])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  })

  // Lock body scroll
  useEffect(() => {
    if (artwork) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [artwork])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !message) return

    setStatus('loading')
    try {
      const res = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          newsletter,
          artworkTitle: artwork?.title,
          artworkSlug: artwork?.slug,
          viewingRoomSlug,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error ?? 'Er ging iets mis.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Er ging iets mis. Probeer het later opnieuw.')
    }
  }

  if (!artwork) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="enquire-backdrop"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="enquire-panel"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Interesse in ${artwork.title}`}
      >
        {/* Header */}
        <div className="enquire-panel-header">
          <button className="enquire-close" onClick={handleClose} aria-label="Sluiten">
            ×
          </button>
        </div>

        {/* Artwork preview */}
        <div className="enquire-artwork-preview">
          {artwork.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${artwork.image}?w=200&auto=format`}
              alt={artwork.title}
              className="enquire-artwork-img"
            />
          )}
          <div className="enquire-artwork-info">
            <p className="enquire-artwork-title">{artwork.title}</p>
            <p className="enquire-artwork-year">{artwork.year}</p>
          </div>
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div className="enquire-success">
            <p>Bedankt voor je interesse.<br />Ik neem zo spoedig mogelijk contact op.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="enquire-form">
            <label className="enquire-label">
              Naam *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={status === 'loading'}
                className="enquire-input"
                autoComplete="name"
              />
            </label>

            <label className="enquire-label">
              E-mail *
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="enquire-input"
                autoComplete="email"
              />
            </label>

            <label className="enquire-label">
              Telefoon
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={status === 'loading'}
                className="enquire-input"
                autoComplete="tel"
              />
            </label>

            <label className="enquire-label">
              Bericht *
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                disabled={status === 'loading'}
                className="enquire-textarea"
              />
            </label>

            <label className="enquire-checkbox-label">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                disabled={status === 'loading'}
              />
              Houd mij op de hoogte via de nieuwsbrief
            </label>

            {status === 'error' && (
              <p className="enquire-error">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !name || !email || !message}
              className="enquire-submit"
            >
              {status === 'loading' ? 'Versturen…' : 'Verstuur bericht'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

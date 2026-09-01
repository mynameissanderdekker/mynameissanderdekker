'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { fmtProposalPrice } from './priceLabel'

interface ProposalItem {
  showPrice?: boolean
  priceOverride?: number
  note?: string
  artwork?: {
    _id: string
    title?: string
    year?: number
    priceIncVat?: number
    vatRate?: string
    imageUrl?: string
    allImages?: string[]
    widthCm?: number
    heightCm?: number
    depthCm?: number
    medium?: string
    editionType?: string
    editionTotal?: number
    editionAP?: number
  }
}

interface Proposal {
  _id: string
  _createdAt?: string
  title?: string
  status?: string
  expiryDate?: string
  message?: string
  language?: string
  clientLocation?: string
  contact?: {
    firstName?: string; lastName?: string; company?: string; vatNumber?: string
    email?: string; phone?: string; street?: string; postalCode?: string; city?: string; country?: string
  }
  items?: ProposalItem[]
}

interface SiteSettings {
  siteName?: string
  email?: string
  logoUrl?: string
}

function fmtDims(item: ProposalItem['artwork']) {
  if (!item) return null
  const parts = [item.widthCm, item.heightCm].filter(Boolean)
  if (!parts.length) return null
  const base = parts.join(' × ') + ' cm'
  return item.depthCm ? `${base} × ${item.depthCm} cm` : base
}

// Zelfde functie als in de gallery-template. `priceOverride` betekende hier
// inclusief BTW en daar exclusief — twee betekenissen voor hetzelfde veld
// tussen twee templates die één product moeten worden. Exclusief wint: dat is
// wat de verkoop, de factuurregel en de prijslijst al gebruiken.
const fmtPrice = (item: ProposalItem, clientLocation = 'nl') =>
  fmtProposalPrice(item, clientLocation)

const T: Record<string, Record<string, string>> = {
  en: {
    from: 'From', for: 'For', proposal: 'Proposal',
    validUntil: 'Valid until',
    expired: 'This proposal has expired.',
    accepted: 'This proposal has been accepted.',
    declined: 'This proposal has been declined.',
    interest: 'Interested in a work?',
    interestBody: 'Reply to this email or contact us directly.',
    priceOnRequest: 'Price on request',
    edition: 'Edition', medium: 'Medium', dimensions: 'Dimensions', note: 'Note',
    inquireSubject: 'Enquiry',
    respond: 'Send a response',
    respondSubject: 'Response to proposal:',
  },
  nl: {
    from: 'Van', for: 'Voor', proposal: 'Voorstel',
    validUntil: 'Geldig tot',
    expired: 'Dit voorstel is verlopen.',
    accepted: 'Dit voorstel is geaccepteerd.',
    declined: 'Dit voorstel is afgewezen.',
    interest: 'Interesse in een werk?',
    interestBody: 'Stuur een reactie op deze e-mail of neem direct contact op.',
    priceOnRequest: 'Prijs op aanvraag',
    edition: 'Oplage', medium: 'Materiaal', dimensions: 'Afmetingen', note: 'Noot',
    inquireSubject: 'Informatie aanvraag',
    respond: 'Stuur een reactie',
    respondSubject: 'Reactie op voorstel:',
  },
}

export default function ProposalPage({ proposal, settings }: { proposal: Proposal; settings?: SiteSettings }) {
  const lang = proposal.language ?? 'nl'
  const t = T[lang] ?? T.nl
  const items = (proposal.items ?? []).filter(i => i.artwork)
  const siteEmail = settings?.email
  const siteName = settings?.siteName ?? 'Sander Dekker'

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [thumbIdx, setThumbIdx] = useState(0)

  const openLightbox = (i: number) => { setLightboxIndex(i); setThumbIdx(0) }
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prevItem = useCallback(() => { setLightboxIndex(i => (i != null && i > 0 ? i - 1 : i)); setThumbIdx(0) }, [])
  const nextItem = useCallback(() => { setLightboxIndex(i => (i != null && i < items.length - 1 ? i + 1 : i)); setThumbIdx(0) }, [items.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevItem()
      if (e.key === 'ArrowRight') nextItem()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeLightbox, prevItem, nextItem])

  useEffect(() => {
    document.body.style.overflow = lightboxIndex != null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const clientName = proposal.contact?.company
    || `${proposal.contact?.firstName ?? ''} ${proposal.contact?.lastName ?? ''}`.trim()

  const isExpired = proposal.status === 'expired'
    || (proposal.expiryDate != null && new Date(proposal.expiryDate) < new Date())
  const isAccepted = proposal.status === 'accepted'
  const isDeclined = proposal.status === 'declined'
  const statusBanner = isExpired ? t.expired : isAccepted ? t.accepted : isDeclined ? t.declined : null

  const activeItem = lightboxIndex != null ? items[lightboxIndex] : null
  const activeAw = activeItem?.artwork
  const activeImages = (activeAw?.allImages ?? []).filter(Boolean) as string[]
  if (activeAw?.imageUrl && activeImages.length === 0) activeImages.push(activeAw.imageUrl)
  const activePrice = activeItem ? fmtPrice(activeItem, proposal.clientLocation) : null
  const activeDims = fmtDims(activeAw)

  const dateStr = proposal.expiryDate
    ? new Date(proposal.expiryDate).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px 36px' }}>
          {settings?.logoUrl
            ? <img src={settings.logoUrl} alt={siteName} style={{ height: 36, display: 'block', marginBottom: 36 }} />
            : <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 36 }}>{siteName}</p>
          }

          <div style={{ display: 'flex', gap: 0 }}>
            {/* FROM */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>{t.from}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{siteName}</p>
              {siteEmail && <p style={{ fontSize: 13, color: '#6b7280' }}>{siteEmail}</p>}
            </div>

            {/* FOR */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>{t.for}</p>
              {proposal.contact?.company && <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{proposal.contact.company}</p>}
              {clientName && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{clientName}</p>}
              {proposal.contact?.street && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{proposal.contact.street}</p>}
              {(proposal.contact?.postalCode || proposal.contact?.city) && (
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{[proposal.contact.postalCode, proposal.contact.city].filter(Boolean).join(' ')}</p>
              )}
              {proposal.contact?.country && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{proposal.contact.country}</p>}
              {proposal.contact?.email && <p style={{ fontSize: 13, color: '#6b7280' }}>{proposal.contact.email}</p>}
            </div>

            {/* Proposal info */}
            <div style={{ flex: 1, textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.proposal}</p>
              {proposal._createdAt && (
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  {new Date(proposal._createdAt).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {dateStr && !isExpired && (
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{t.validUntil} {dateStr}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status banner */}
      {statusBanner && (
        <div style={{ background: isAccepted ? '#f0fdf4' : isDeclined ? '#fef2f2' : '#fffbeb', padding: '10px 32px', textAlign: 'center', fontSize: 13, color: isAccepted ? '#166534' : isDeclined ? '#991b1b' : '#92400e' }}>
          {statusBanner}
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 96px' }}>
        <div style={{ marginBottom: 52 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: '#111', marginBottom: 16, letterSpacing: '-0.01em' }}>{proposal.title}</h1>
          {proposal.message && (
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 560, whiteSpace: 'pre-line' }}>{proposal.message}</p>
          )}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
          {items.map((item, i) => {
            const aw = item.artwork!
            const price = fmtPrice(item, proposal.clientLocation)
            const dims = fmtDims(aw)
            return (
              <div key={aw._id} onClick={() => openLightbox(i)} style={{ cursor: 'pointer' }}>
                <div style={{ background: '#f9fafb', marginBottom: 12, aspectRatio: '3/4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {aw.imageUrl
                    ? <img src={`${aw.imageUrl}?w=700&auto=format`} alt={aw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                    : <span style={{ fontSize: 13, color: '#d1d5db', letterSpacing: '0.08em' }}>NO IMAGE</span>
                  }
                </div>
                <p style={{ fontSize: 16, fontStyle: 'italic', color: '#374151', marginBottom: 4 }}>{aw.title}{aw.year ? `, ${aw.year}` : ''}</p>
                {dims && <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>{dims}</p>}
                {item.showPrice !== false && (
                  <p style={{ fontSize: 13, color: price ? '#111' : '#9ca3af' }}>{price ?? t.priceOnRequest}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        {!isExpired && !isDeclined && siteEmail && (
          <div style={{ marginTop: 80, paddingTop: 48, borderTop: '1px solid #e5e7eb', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>{t.interest}</p>
            <a
              href={`mailto:${siteEmail}?subject=${encodeURIComponent([t.respondSubject, proposal.title].filter(Boolean).join(' '))}`}
              style={{ display: 'inline-block', padding: '12px 28px', background: '#111', color: '#fff', textDecoration: 'none', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}
            >
              {t.respond}
            </a>
            <a href={`mailto:${siteEmail}`} style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>{siteEmail}</a>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {activeAw && lightboxIndex != null && (
        <div onClick={closeLightbox} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 2, maxWidth: 1000, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={prevItem} disabled={lightboxIndex === 0} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '4px 12px', cursor: lightboxIndex === 0 ? 'default' : 'pointer', color: lightboxIndex === 0 ? '#d1d5db' : '#111', fontSize: 13 }}>←</button>
                <span style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center' }}>{lightboxIndex + 1} / {items.length}</span>
                <button onClick={nextItem} disabled={lightboxIndex === items.length - 1} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '4px 12px', cursor: lightboxIndex === items.length - 1 ? 'default' : 'pointer', color: lightboxIndex === items.length - 1 ? '#d1d5db' : '#111', fontSize: 13 }}>→</button>
              </div>
              <button onClick={closeLightbox} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: '0 0 55%', background: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
                  {activeImages.length > 0
                    ? <img src={`${activeImages[thumbIdx]}?w=1200&auto=format`} alt={activeAw.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    : <span style={{ fontSize: 13, color: '#d1d5db' }}>NO IMAGE</span>
                  }
                </div>
                {activeImages.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px', flexShrink: 0, overflowX: 'auto' }}>
                    {activeImages.map((url, idx) => (
                      <button key={idx} onClick={() => setThumbIdx(idx)} style={{ width: 56, height: 56, border: `1.5px solid ${idx === thumbIdx ? '#111' : '#e5e7eb'}`, padding: 0, cursor: 'pointer', background: 'none', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={`${url}?w=160&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: idx === thumbIdx ? 1 : 0.55 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, padding: '28px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 15, color: '#6b7280', fontStyle: 'italic', marginBottom: 20 }}>
                  {activeAw.title}{activeAw.year ? `, ${activeAw.year}` : ''}
                </p>

                <dl style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {activeAw.medium && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <dt style={{ color: '#9ca3af', minWidth: 88 }}>{t.medium}</dt>
                      <dd style={{ color: '#374151' }}>{activeAw.medium}</dd>
                    </div>
                  )}
                  {activeDims && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <dt style={{ color: '#9ca3af', minWidth: 88 }}>{t.dimensions}</dt>
                      <dd style={{ color: '#374151' }}>{activeDims}</dd>
                    </div>
                  )}
                  {activeAw.editionType === 'edition' && activeAw.editionTotal && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <dt style={{ color: '#9ca3af', minWidth: 88 }}>{t.edition}</dt>
                      <dd style={{ color: '#374151' }}>{activeAw.editionTotal}{activeAw.editionAP ? ` + ${activeAw.editionAP} AP` : ''}</dd>
                    </div>
                  )}
                  {activeItem?.note && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <dt style={{ color: '#9ca3af', minWidth: 88 }}>{t.note}</dt>
                      <dd style={{ color: '#374151', fontStyle: 'italic' }}>{activeItem.note}</dd>
                    </div>
                  )}
                </dl>

                <div style={{ flex: 1 }} />

                {activeItem?.showPrice !== false && (
                  <p style={{ fontSize: 18, fontWeight: 600, color: activePrice ? '#111' : '#9ca3af', marginTop: 24 }}>
                    {activePrice ?? t.priceOnRequest}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

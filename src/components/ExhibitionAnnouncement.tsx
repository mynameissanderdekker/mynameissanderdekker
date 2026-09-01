'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Aankondiging van een lopende expositie, één keer per bezoeker.
 *
 * Waarom geen slider zoals in de gallery-template: een carrousel wordt
 * weggeklikt zonder gelezen te worden, en deze homepage is bovendien vast
 * vormgegeven. Een aankondiging die één keer verschijnt en zich laat wegklikken
 * is directer, en eerlijker — je gebruikt hem alleen als je echt iets te melden
 * hebt.
 *
 * Verdwijnt vanzelf: de server stuurt alleen exposities met showOnHomepage die
 * nog niet voorbij zijn.
 */

export interface AnnouncedExhibition {
  _id: string
  _type?: 'exhibition' | 'artFair'
  title: string
  slug?: string
  hasPage?: boolean
  startDate?: string
  endDate?: string
  venueName?: string
  imageUrl?: string
}

const seenKey = (id: string) => `mnsdk-announced-${id}`

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

export default function ExhibitionAnnouncement({ exhibition }: { exhibition: AnnouncedExhibition | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!exhibition) return
    let seen = false
    // Weggeklikt blijft weggeklikt. In een privévenster of na het wissen van
    // gegevens komt hij terug — dat is beter dan hem helemaal niet tonen.
    try {
      seen = window.localStorage.getItem(seenKey(exhibition._id)) === '1'
    } catch {
      seen = false
    }
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 900)
      return () => clearTimeout(t)
    }
  }, [exhibition])

  if (!exhibition || !open) return null

  function dismiss() {
    setOpen(false)
    try {
      window.localStorage.setItem(seenKey(exhibition!._id), '1')
    } catch {
      /* privémodus — dan onthouden we het niet, en dat mag */
    }
  }

  const dates = [fmt(exhibition.startDate), fmt(exhibition.endDate)].filter(Boolean).join(' – ')
  // Een beurs woont op een andere route dan een expositie.
  const base = exhibition._type === 'artFair' ? '/art-fairs' : '/exhibitions'
  const href = exhibition.hasPage && exhibition.slug ? `${base}/${exhibition.slug}` : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Exhibition: ${exhibition.title}`}
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', maxWidth: 420, width: '100%',
          borderRadius: 4, overflow: 'hidden', position: 'relative',
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,.9)', cursor: 'pointer',
            fontSize: 17, lineHeight: 1, fontFamily: 'inherit',
          }}
        >
          ×
        </button>

        {exhibition.imageUrl && (
          <img
            src={`${exhibition.imageUrl}?w=840&h=560&fit=crop&auto=format`}
            alt=""
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}

        <div style={{ padding: '20px 22px 24px' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#9ca3af' }}>
            {exhibition._type === 'artFair' ? 'At the fair' : 'Now on view'}
          </p>
          <h2 style={{ margin: '8px 0 6px', fontSize: 21, fontWeight: 500, lineHeight: 1.25 }}>
            {exhibition.title}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            {[exhibition.venueName, dates].filter(Boolean).join(' · ')}
          </p>

          {href && (
            <Link
              href={href}
              onClick={dismiss}
              style={{
                display: 'inline-block', marginTop: 16, padding: '10px 18px',
                background: '#111', color: '#fff', textDecoration: 'none',
                fontSize: 14, borderRadius: 2,
              }}
            >
              More information
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

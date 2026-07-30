'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface ArtworkCard {
  _id: string
  title: string
  year?: number
  slug: { current: string }
  mainImage?: { url?: string }
  priceExclVAT?: number
  vatRate?: number
  status?: string
  category?: string
  featured?: boolean
}

function formatPrice(excl: number, vatRate = 9) {
  const incl = excl * (1 + vatRate / 100)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(incl)
}

function WorkCard({ w, columns }: { w: ArtworkCard; columns: number }) {
  const imgUrl = w.mainImage?.url ? `${w.mainImage.url}?w=600&auto=format&q=80` : null
  const soldOut = w.status === 'sold_out'
  const price = w.priceExclVAT ? formatPrice(w.priceExclVAT, w.vatRate) : null

  const inner = (
    <>
      <div className="works-grid-img-wrap">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={w.title} className="works-grid-img" />
        ) : (
          <div className="works-grid-img" style={{ background: '#f0f0f0' }} />
        )}
        {soldOut && <span className="works-badge works-badge-sold">SOLD OUT</span>}
      </div>
      <h3 className="works-grid-title">{w.title}</h3>
      {price && <p className="works-price">{price}</p>}
    </>
  )

  return soldOut ? (
    <div className="works-grid-item is-sold-out">{inner}</div>
  ) : (
    <Link href={`/works/${w.slug.current}`} className="works-grid-item-link">{inner}</Link>
  )
}

interface Props {
  works: ArtworkCard[]
  columns: number
}

export function WorksAllSection({ works, columns }: Props) {
  const categories = useMemo(() => {
    const cats = works.map(w => w.category).filter(Boolean) as string[]
    return Array.from(new Set(cats)).sort()
  }, [works])

  const [activeCat, setActiveCat] = useState<string>('all')

  const filtered = useMemo(
    () => activeCat === 'all' ? works : works.filter(w => w.category === activeCat),
    [works, activeCat]
  )

  const featured = useMemo(() => filtered.filter(w => w.featured), [filtered])
  const rest = useMemo(() => filtered.filter(w => !w.featured), [filtered])

  const gridStyle = { gridTemplateColumns: `repeat(${columns}, 1fr)` }

  return (
    <>
      {/* Filter bar */}
      <div className="works-filter-bar">
        <button
          className={`works-filter-btn${activeCat === 'all' ? ' is-active' : ''}`}
          onClick={() => setActiveCat('all')}
        >
          Alle
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`works-filter-btn${activeCat === cat ? ' is-active' : ''}`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Highlighted */}
      {featured.length > 0 && (
        <section className="works-section" style={{ marginTop: '1.5rem' }}>
          <h2 className="works-section-title">Uitgelicht</h2>
          <div className="works-grid" style={gridStyle}>
            {featured.map(w => <WorkCard key={w._id} w={w} columns={columns} />)}
          </div>
        </section>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <section className="works-section" style={featured.length > 0 ? { marginTop: '3rem' } : { marginTop: '1.5rem' }}>
          {featured.length > 0 && (
            <h2 className="works-section-title">
              {activeCat === 'all' ? 'Alle werken' : activeCat}
            </h2>
          )}
          <div className="works-grid" style={gridStyle}>
            {rest.map(w => <WorkCard key={w._id} w={w} columns={columns} />)}
          </div>
        </section>
      )}

      {featured.length === 0 && rest.length === 0 && (
        <section className="works-section">
          <p style={{ color: '#999' }}>Geen werken gevonden.</p>
        </section>
      )}
    </>
  )
}

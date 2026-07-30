/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 3600

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const ex = await getExhibition(slug)
  if (!ex) return {}
  const img = ex.images?.[0]?.asset?.url
  return {
    title: ex.title,
    description: ex.description?.slice(0, 160),
    openGraph: {
      title: ex.title,
      description: ex.description?.slice(0, 160),
      ...(img ? { images: [{ url: `${img}?w=1200&auto=format` }] } : {}),
    },
  }
}

async function getExhibition(slug: string) {
  return client.fetch(
    `*[_type == "exhibition" && slug.current == $slug][0]{
      _id, title, slug, gallery, location, startDate, endDate, isSolo, description,
      images[]{ asset->{ _id, url }, hotspot, crop },
      "artworks": [
        ...coalesce(artworkSeries[]->artworks[]->{ _id, title, slug, "mainImage": images[0]{ asset, hotspot, crop }, priceExclVAT, vatRate, status }, []),
        ...coalesce(artworks[]->{ _id, title, slug, "mainImage": images[0]{ asset, hotspot, crop }, priceExclVAT, vatRate, status }, [])
      ]
    }`,
    { slug }
  )
}

function imgUrl(asset: { url?: string; _ref?: string }, width: number) {
  if (asset.url) return `${asset.url}?w=${width}&auto=format&q=85`
  return urlFor({ asset: { _ref: asset._ref } }).width(width).auto('format').quality(85).url()
}

function formatPrice(excl: number, vatRate = 9) {
  const incl = excl * (1 + vatRate / 100)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(incl)
}

export default async function ExhibitionPage({ params }: Props) {
  const { slug } = await params
  const ex = await getExhibition(slug)
  if (!ex) notFound()

  const images = ex.images ?? []
  const artworks = ex.artworks ?? []

  const dateLabel = [ex.startDate, ex.endDate]
    .filter(Boolean)
    .map((d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    .join(' – ')

  return (
    <div className="site-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>

      {/* Back link */}
      <Link href="/works" className="text-xs tracking-widest uppercase text-gray-400 hover:text-black mb-8 inline-block">
        ← Works
      </Link>

      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="section-title" style={{ marginTop: 0, marginBottom: '4px' }}>Exhibition</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 400, margin: 0 }}>{ex.title}</h1>
      </div>

      {/* 2-col: details | description */}
      <div style={{ display: 'grid', gridTemplateColumns: '20% 80%', gap: '48px', alignItems: 'start', marginBottom: '4rem', borderTop: '1px solid #eee', paddingTop: '24px' }}>

        {/* Left: details */}
        <dl style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', margin: 0 }}>
          {ex.gallery && (
            <div>
              <dt style={{ color: '#999' }}>Gallery</dt>
              <dd style={{ margin: 0 }}>{ex.gallery}</dd>
            </div>
          )}
          {ex.location && (
            <div>
              <dt style={{ color: '#999' }}>Location</dt>
              <dd style={{ margin: 0 }}>{ex.location}</dd>
            </div>
          )}
          {dateLabel && (
            <div>
              <dt style={{ color: '#999' }}>Dates</dt>
              <dd style={{ margin: 0 }}>{dateLabel}</dd>
            </div>
          )}
          {ex.isSolo && (
            <div>
              <dt style={{ color: '#999' }}>Type</dt>
              <dd style={{ margin: 0 }}>Solo exhibition</dd>
            </div>
          )}
        </dl>

        {/* Right: description */}
        {ex.description && (
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.7 }}>{ex.description}</p>
        )}
      </div>

      {/* Installation views — artwork-style grid */}
      {images.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <h2 className="section-title">Installation views</h2>
          <div className="works-grid">
            {images.map((img: typeof images[0], i: number) => {
              const url = img?.asset ? imgUrl(img.asset, 800) : null
              return url ? (
                <div key={i} className="works-grid-item">
                  <div className="works-grid-img-wrap">
                    <img src={url} alt={`${ex.title} — installation view ${i + 1}`} className="works-grid-img" />
                  </div>
                  <h3 className="works-grid-title" style={{ fontStyle: 'normal', fontWeight: 400 }}>Installation view</h3>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Artworks */}
      {artworks.length > 0 && (
        <div>
          <h2 className="section-title">Artworks</h2>
          <div className="works-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {artworks.map((a: typeof artworks[0]) => {
              const imgSrc = a.mainImage?.asset ? urlFor(a.mainImage).width(600).fit('max').url() : null
              const soldOut = a.status === 'sold_out'
              const enquire = a.status === 'enquire'
              const price = (!enquire && !soldOut && a.priceExclVAT) ? formatPrice(a.priceExclVAT, a.vatRate) : null
              const inner = (
                <>
                  <div className="works-grid-img-wrap">
                    {imgSrc ? <img src={imgSrc} alt={a.title} className="works-grid-img" /> : <div className="works-grid-img" style={{ background: '#f0f0f0' }} />}
                    {soldOut && <span className="works-badge works-badge-sold">SOLD OUT</span>}
                  </div>
                  <h3 className="works-grid-title">{a.title}</h3>
                  {price && <p className="works-price">{price}</p>}
                </>
              )
              if (soldOut || !a.slug?.current) return <div key={a._id} className="works-grid-item is-sold-out">{inner}</div>
              if (enquire) return (
                <div key={a._id} className="works-grid-item">
                  {inner}
                  <Link href={`/works/${a.slug.current}`} className="btn-artwork-info">ARTWORK INFORMATION</Link>
                </div>
              )
              return <Link key={a._id} href={`/works/${a.slug.current}`} className="works-grid-item-link">{inner}</Link>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  const items = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "exhibition" && defined(slug.current)]{ slug }`
  )
  return items.map(e => ({ slug: e.slug.current }))
}

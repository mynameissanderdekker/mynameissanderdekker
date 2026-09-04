/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import BackLink from '@/components/BackLink'

export const revalidate = 3600

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const ex = await getExhibition(slug)
  if (!ex) return {}
  const img = ex.image?.asset?.url ?? ex.images?.[0]?.asset?.url
  return {
    title: ex.title,
    description: typeof ex.description === 'string' ? ex.description.slice(0, 160) : undefined,
    openGraph: {
      title: ex.title,
      description: typeof ex.description === 'string' ? ex.description.slice(0, 160) : undefined,
      ...(img ? { images: [{ url: `${img}?w=1200&auto=format` }] } : {}),
    },
  }
}

async function getExhibition(slug: string) {
  return client.fetch(
    `*[_type == "exhibition" && slug.current == $slug && hasPage == true][0]{
      _id, title, slug, gallery, location, startDate, endDate, exhibitionType, isSolo, description,
      // "Banner Image" werd hier net zo min uitgelezen als op de beurspagina:
      // een veld dat je kunt invullen en dat nergens verschijnt.
      image{ asset->{ _id, url }, hotspot, crop },
      images[]{ asset->{ _id, url }, hotspot, crop },
      press[]->{ _id, title, publication, date, url, image{ asset->{ _id, url }, hotspot, crop } },
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

/**
 * Eén datum, kort en op één regel.
 *
 * Er stond "17 September 2026 – 20 September 2026" in een kolom van 20% breed,
 * dus dat brak middenin de tweede datum af ("20 [enter] September 2026").
 * Start en eind staan nu onder elkaar met een eigen label — dat leest als een
 * gegeven in plaats van als een afgebroken zin, en past altijd.
 */
function korteDatum(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const pressItems = ex.press ?? []

  const start = korteDatum(ex.startDate)
  const eind = korteDatum(ex.endDate)

  return (
    <div className="site-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>

      {/* Back link */}
      <BackLink />

      {/* Banner, 16:9 — zie de beurspagina voor de afweging. De zaalfoto's
          komen pas ná de opening, vandaar dat dit een eigen veld is. */}
      {ex.image?.asset && (
        <img
          src={`${imgUrl(ex.image.asset, 1600)}&h=900&fit=crop`}
          alt=""
          style={{
            width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
            objectPosition: 'center', display: 'block', marginBottom: '2rem',
          }}
        />
      )}

      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="section-title" style={{ marginTop: 0, marginBottom: '4px' }}>Exhibition</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 400, margin: 0 }}>{ex.title}</h1>
      </div>

      {/* 2-col: details | description */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 200px) minmax(0, 1fr)', gap: '48px', alignItems: 'start', marginBottom: '4rem', borderTop: '1px solid #eee', paddingTop: '24px' }}>

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
          {start && !eind && (
            <div>
              <dt style={{ color: '#999' }}>Date</dt>
              <dd style={{ margin: 0 }}>{start}</dd>
            </div>
          )}
          {start && eind && (
            <>
              <div>
                <dt style={{ color: '#999' }}>Start</dt>
                <dd style={{ margin: 0 }}>{start}</dd>
              </div>
              <div>
                <dt style={{ color: '#999' }}>End</dt>
                <dd style={{ margin: 0 }}>{eind}</dd>
              </div>
            </>
          )}
          {(ex.exhibitionType || ex.isSolo) && (
            <div>
              <dt style={{ color: '#999' }}>Type</dt>
              <dd style={{ margin: 0 }}>
                {ex.exhibitionType === 'solo' || ex.isSolo ? 'Solo exhibition'
                  : ex.exhibitionType === 'duo' ? 'Duo exhibition'
                  : ex.exhibitionType === 'group' ? 'Group exhibition'
                  : ex.exhibitionType === 'permanent' ? 'Permanent installation'
                  : ex.exhibitionType === 'special' ? 'Special project'
                  : ''}
              </dd>
            </div>
          )}
        </dl>

        {/* Right: description */}
        {ex.description && typeof ex.description === 'string' && (
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
              const soldOut = a.status === 'sold'
              const enquire = !a.priceIncVat
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
                  <Link href={`/works/${a.slug.current}`} className="works-grid-img-wrap">
                    {imgSrc ? <img src={imgSrc} alt={a.title} className="works-grid-img" /> : <div className="works-grid-img" style={{ background: '#f0f0f0' }} />}
                  </Link>
                  <h3 className="works-grid-title">{a.title}</h3>
                  {price && <p className="works-price">{price}</p>}
                  <Link href={`/works/${a.slug.current}`} className="btn-artwork-info">ARTWORK INFORMATION</Link>
                </div>
              )
              return <Link key={a._id} href={`/works/${a.slug.current}`} className="works-grid-item-link">{inner}</Link>
            })}
          </div>
        </div>
      )}
      {/* Press */}
      {pressItems.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 className="section-title">Press</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {pressItems.map((item: { _id: string; title?: string; publication?: string; url?: string; image?: { asset?: { url?: string } } }) => {
              const imgUrl2 = item.image?.asset?.url
              return (
                <div key={item._id} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  {imgUrl2 && (
                    <img src={`${imgUrl2}?w=200&auto=format`} alt={item.title ?? ''} style={{ width: 120, flexShrink: 0, objectFit: 'cover' }} />
                  )}
                  <div>
                    {item.publication && <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.publication}</p>}
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500, textDecoration: 'underline' }}>{item.title}</a>
                    ) : (
                      <p style={{ margin: 0, fontWeight: 500 }}>{item.title}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

export async function generateStaticParams() {
  try {
    const items = await client.fetch<{ slug: { current: string } }[]>(
      `*[_type == "exhibition" && defined(slug.current) && hasPage == true]{ slug }`
    )
    return items.map(e => ({ slug: e.slug.current }))
  } catch { return [] }
}

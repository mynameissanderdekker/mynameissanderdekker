/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { PortableText } from '@portabletext/react'
import BackLink from '@/components/BackLink'

export const revalidate = 3600

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const fair = await getArtFair(slug)
  if (!fair) return {}
  const img = fair.image?.asset?.url ?? fair.images?.[0]?.asset?.url
  return {
    title: fair.title,
    description: undefined,
    openGraph: {
      title: fair.title,
      description: undefined,
      ...(img ? { images: [{ url: `${img}?w=1200&auto=format` }] } : {}),
    },
  }
}

async function getArtFair(slug: string) {
  return client.fetch(
    `*[_type == "artFair" && slug.current == $slug][0]{
      _id, title, slug, booth, location, startDate, endDate, description, websiteUrl,
      // "Banner Image" stond wel in het schema maar werd hier niet uitgelezen:
      // je kon hem invullen en er gebeurde niets, op de pagina noch in de
      // aankondiging op de homepage.
      image{ asset->{ _id, url }, hotspot, crop },
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

export default async function ArtFairPage({ params }: Props) {
  const { slug } = await params
  const fair = await getArtFair(slug)
  if (!fair) notFound()

  const images = fair.images ?? []
  const artworks = fair.artworks ?? []

  const start = korteDatum(fair.startDate)
  const eind = korteDatum(fair.endDate)

  return (
    <div className="site-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>

      <BackLink />

      {/* Banner, 16:9 — de gangbare bannerverhouding. Een vaste maxHeight gaf
          per afbeelding een andere hoogte, dus de pagina sprong bij elke beurs
          een stukje; met een vaste verhouding staat de titel altijd op dezelfde
          plek en weet je bij het uploaden waar je op mikt. De standfoto's komen
          pas ná afloop, vandaar dat dit een eigen veld is. */}
      {fair.image?.asset && (
        <img
          src={`${imgUrl(fair.image.asset, 1600)}&h=900&fit=crop`}
          alt=""
          style={{
            width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
            objectPosition: 'center', display: 'block', marginBottom: '2rem',
          }}
        />
      )}

      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="section-title" style={{ marginTop: 0, marginBottom: '4px' }}>Art fair</p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 400, margin: 0 }}>{fair.title}</h1>
      </div>

      {/* 2-col: details | description */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 200px) minmax(0, 1fr)', gap: '48px', alignItems: 'start', marginBottom: '4rem', borderTop: '1px solid #eee', paddingTop: '24px' }}>

        <dl style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', margin: 0 }}>
          {fair.location && (
            <div>
              <dt style={{ color: '#999' }}>Location</dt>
              <dd style={{ margin: 0 }}>{fair.location}</dd>
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
          {fair.booth && (
            <div>
              <dt style={{ color: '#999' }}>Booth</dt>
              <dd style={{ margin: 0 }}>{fair.booth}</dd>
            </div>
          )}
          {fair.websiteUrl && (
            <div style={{ marginTop: '12px' }}>
              <a href={fair.websiteUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', textDecoration: 'underline' }}>
                Visit website
              </a>
            </div>
          )}
        </dl>

        {Array.isArray(fair.description) && fair.description.length > 0 && (
          <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.7 }}>
            <PortableText value={fair.description} />
          </div>
        )}
      </div>

      {/* Booth photos — artwork-style grid */}
      {images.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <h2 className="section-title">Booth photos</h2>
          <div className="works-grid">
            {images.map((img: typeof images[0], i: number) => {
              const url = img?.asset ? imgUrl(img.asset, 800) : null
              return url ? (
                <div key={i} className="works-grid-item">
                  <div className="works-grid-img-wrap">
                    <img src={url} alt={`${fair.name} — ${i + 1}`} className="works-grid-img" />
                  </div>
                  <h3 className="works-grid-title" style={{ fontStyle: 'normal', fontWeight: 400 }}>Booth photo</h3>
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
    </div>
  )
}

export async function generateStaticParams() {
  try {
  const items = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "artFair" && defined(slug.current) && hasPage == true]{ slug }`
  )
  return items.map(f => ({ slug: f.slug.current }))
  } catch { return [] }
}

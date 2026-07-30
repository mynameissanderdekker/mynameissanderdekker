/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { PageBuilder, type PageBlock } from '@/components/PageBuilder'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return {}
  return {
    title: project.title,
    openGraph: { title: project.title },
  }
}

interface LinkedArtwork {
  _id: string
  title: string
  slug?: { current: string }
  mainImage?: { asset?: { _ref?: string }; hotspot?: unknown; crop?: unknown }
  priceExclVAT?: number
  vatRate?: number
  status?: string
}

interface LinkedExhibition {
  _id: string
  _type: 'exhibition' | 'artFair'
  // exhibition fields
  title?: string
  gallery?: string
  isSolo?: boolean
  // artFair fields
  name?: string
  fair?: string
  booth?: string
  websiteUrl?: string
  hasPage?: boolean
  slug?: { current: string }
  location?: string
  startDate?: string
}

// ── Query ──────────────────────────────────────────────────────────────────────

async function getProject(slug: string) {
  return client.fetch(
    `*[_type == "project" && slug.current == $slug && isPage == true][0]{
      _id, title,
      pageBuilder,
      "artworks": [
        ...coalesce(artworkSeries[]->artworks[]->{ _id, title, slug, "mainImage": images[0]{ asset, hotspot, crop }, priceExclVAT, vatRate, status }, []),
        ...coalesce(artworks[]->{ _id, title, slug, "mainImage": images[0]{ asset, hotspot, crop }, priceExclVAT, vatRate, status }, [])
      ],
      exhibitions[]->{ _id, _type, slug, hasPage, title, name, gallery, fair, booth, location, startDate, isSolo, websiteUrl }
    }`,
    { slug }
  )
}

async function getZines() {
  return client.fetch(
    `*[_type == "zine"] | order(order asc) {
      number, title, meta, description, featured, projectSlug,
      coverImage{ asset, hotspot, crop },
      coverImageUrl
    }`
  )
}

function formatPrice(excl: number, vatRate = 9) {
  const incl = excl * (1 + vatRate / 100)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(incl)
}

// ── Linked artworks grid ───────────────────────────────────────────────────────

function ArtworksGrid({ artworks }: { artworks: LinkedArtwork[] }) {
  if (!artworks.length) return null
  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 className="section-title">Artworks</h2>
      <div className="works-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {artworks.map(a => {
          const imgUrl = a.mainImage?.asset
            ? urlFor(a.mainImage).width(600).fit('max').url()
            : null
          const soldOut  = a.status === 'sold_out'
          const enquire  = a.status === 'enquire'
          const price    = (!enquire && !soldOut && a.priceExclVAT)
            ? formatPrice(a.priceExclVAT, a.vatRate)
            : null

          const inner = (
            <>
              <div className="works-grid-img-wrap">
                {imgUrl
                  ? <img src={imgUrl} alt={a.title} className="works-grid-img" />
                  : <div className="works-grid-img" style={{ background: '#f0f0f0' }} />
                }
                {soldOut && <span className="works-badge works-badge-sold">SOLD OUT</span>}
              </div>
              <h3 className="works-grid-title">{a.title}</h3>
              {price && <p className="works-price">{price}</p>}
            </>
          )

          if (soldOut || !a.slug?.current) {
            return <div key={a._id} className="works-grid-item is-sold-out">{inner}</div>
          }
          if (enquire) {
            return (
              <div key={a._id} className="works-grid-item">
                {inner}
                <Link href={`/works/${a.slug.current}`} className="btn-artwork-info">ARTWORK INFORMATION</Link>
              </div>
            )
          }
          return <Link key={a._id} href={`/works/${a.slug.current}`} className="works-grid-item-link">{inner}</Link>
        })}
      </div>
    </div>
  )
}

// ── Linked exhibitions list ────────────────────────────────────────────────────

function ExhibitionsList({ exhibitions }: { exhibitions: LinkedExhibition[] }) {
  if (!exhibitions.length) return null
  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 className="section-title">Exhibitions &amp; Art fairs</h2>
      <ul className="cv-list">
        {exhibitions.map(e => {
          const year = e.startDate ? new Date(e.startDate).getFullYear() : null
          const isArtFair = e._type === 'artFair'
          const label = isArtFair
            ? (e.name ?? e.fair ?? '—')
            : (e.gallery ?? e.title ?? '—')
          const detail = isArtFair
            ? e.booth
            : (e.isSolo ? 'Solo' : undefined)
          const internalUrl = e.hasPage && e.slug?.current
            ? (isArtFair ? `/art-fairs/${e.slug.current}` : `/exhibitions/${e.slug.current}`)
            : null
          const externalUrl = isArtFair ? e.websiteUrl : null
          const url = internalUrl ?? (e.hasPage ? externalUrl : null)
          return (
            <li key={e._id}>
              {year && <>{year} — </>}
              {url
                ? <Link href={url} {...(!internalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ textDecoration: 'underline' }}>{label}</Link>
                : label
              }
              {e.location && `, ${e.location}`}
              {detail && <span style={{ color: '#888', fontSize: '0.85em' }}> ({detail})</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const [project, zines] = await Promise.all([getProject(slug), getZines()])
  if (!project) notFound()

  const artworks: LinkedArtwork[]       = project.artworks    ?? []
  const exhibitions: LinkedExhibition[] = project.exhibitions ?? []
  const pageBlocks: PageBlock[]         = project.pageBuilder ?? []

  return (
    <>
      <PageBuilder blocks={pageBlocks} zines={zines} />
      <ArtworksGrid artworks={artworks} />
      <ExhibitionsList exhibitions={exhibitions} />
    </>
  )
}

export async function generateStaticParams() {
  const projects = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "project" && isPage == true]{ slug }`
  )
  return projects.map(p => ({ slug: p.slug.current }))
}

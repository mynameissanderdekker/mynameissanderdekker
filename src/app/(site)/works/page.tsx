import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { WorksAllSection } from '@/components/WorksAllSection'

const BASE_URL = 'https://www.mynameissanderdekker.com'

export const metadata: Metadata = {
  title: 'Available',
  description: 'Available works and editions by Sander Dekker — photographs and limited-edition zines. Direct from the studio.',
  alternates: {
    canonical: `${BASE_URL}/works`,
  },
  openGraph: {
    title: 'Available — Sander Dekker',
    description: 'Available works and editions by Sander Dekker — photographs and limited-edition zines. Direct from the studio.',
    url: `${BASE_URL}/works`,
    siteName: 'Sander Dekker',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Available — Sander Dekker',
    description: 'Available works and editions by Sander Dekker — photographs and limited-edition zines. Direct from the studio.',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PT = any[]

const ptComponents: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="works-section-link"
      >
        {children}
      </a>
    ),
  },
  types: {
    button: ({ value }) => (
      <div style={{ marginTop: '0.75rem' }}>
        <a
          href={value?.href}
          target={value?.blank ? '_blank' : undefined}
          rel={value?.blank ? 'noopener noreferrer' : undefined}
          className="works-btn"
          style={{ display: 'inline-block' }}
        >
          {value?.label}
        </a>
      </div>
    ),
  },
}

interface ArtworkCard {
  _id: string
  title: string
  year?: number
  slug: { current: string }
  mainImage?: { url?: string }
  priceIncVat?: number
  vatRate?: number | string
  status?: string
  category?: string
  featured?: boolean
  order?: number
  _type?: string
  buyUrl?: string
  medium?: string
  dimensions?: { widthCm?: number; heightCm?: number }
  // variant card (synthetic — not from Sanity directly)
  isVariantCard?: boolean
  variantBadge?: string
  variantNote?: string
}

interface SectionConfig {
  title?: string
  categories?: string[]
  visible: boolean
  columns: number
  max2col?: number
  max3col?: number
  max4col?: number
  description?: PT
  showViewAll?: boolean
}

interface WorksPageConfig {
  sections?: SectionConfig[]
}

async function getWorksData(): Promise<{ config: WorksPageConfig | null; works: ArtworkCard[] }> {
  const [config, artworks, zines] = await Promise.all([
    client.fetch<WorksPageConfig | null>(
      `*[_type == "worksPage"][0]{ sections[]{ title, categories, visible, columns, max2col, max3col, max4col, showViewAll, description } }`,
      {},
      { next: { revalidate: 0 } },
    ),
    client.fetch<ArtworkCard[]>(
      `*[_type == "artwork" && defined(slug.current) && showInWebshop == true] | order(featured desc, order asc, year desc){
        _id, _type, title, year, slug, order,
        "mainImage": { "url": coalesce(images[0].asset->url, coverImageUrl) },
        priceIncVat, vatRate, status, category, featured, buyUrl,
        medium, dimensions
      }`,
      {},
      { next: { revalidate: 0 } },
    ),
    client.fetch<(ArtworkCard & { priceExclVAT?: number; shopVariants?: { badge: string; available?: boolean; status?: string; priceExclVAT?: number; buyUrl?: string; note?: string }[] })[]>(
      `*[_type == "zine" && defined(category)] | order(featured desc, order asc){
        _id, _type, title, category, status, priceIncVat, priceExclVAT, vatRate, featured, order,
        "year": null,
        "slug": { "current": coalesce(slug.current, projectSlug) },
        "mainImage": { "url": coalesce(coverImage.asset->url, coverImageUrl) },
        shopVariants[]{ badge, available, status, priceExclVAT, buyUrl, note }
      }`,
      {},
      { next: { revalidate: 0 } },
    ),
  ])

  // Expand zines: each zine is followed immediately by its active variant cards
  const vatRate = (z: { vatRate?: number | string }) =>
    typeof z.vatRate === 'number' ? z.vatRate : 9

  const expandedZines: ArtworkCard[] = zines
    .filter(z => z.slug?.current)
    .flatMap(z => {
      const variants: ArtworkCard[] = (z.shopVariants ?? [])
        .filter(v => v.available !== false)
        .map((v, i) => {
          const priceIncVat = v.priceExclVAT != null
            ? Math.round(v.priceExclVAT * (1 + vatRate(z) / 100) * 100) / 100
            : z.priceIncVat
          return {
            _id: `${z._id}-variant-${i}`,
            _type: z._type,
            title: z.title,
            category: z.category,
            status: v.status ?? 'available',
            priceIncVat,
            vatRate: z.vatRate,
            featured: z.featured,
            order: z.order,
            slug: z.slug,
            mainImage: z.mainImage,
            buyUrl: v.buyUrl ?? z.buyUrl,
            isVariantCard: true,
            variantBadge: v.badge,
            variantNote: v.note,
          } satisfies ArtworkCard
        })
      return [z as ArtworkCard, ...variants]
    })

  const works = [...artworks, ...expandedZines]
    .sort((a, b) => {
      // Items with an explicit order come first (ascending), items without go to the end
      // Variant cards share their parent's order value — they'll cluster together
      if (a.order != null && b.order != null) return a.order - b.order
      if (a.order != null) return -1
      if (b.order != null) return 1
      return 0
    })

  return { config, works }
}

function formatPrice(inclVat: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(inclVat)
}

function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

// A few "Publications" artwork docs are really zines readable on their own
// project page rather than purchasable products — link them there instead.
const ZINE_PROJECT_LINKS: Record<string, string> = {
  'zine-no-9-asia': '/projects/asia',
  'zine-no-8-the-warsaw-saga': '/projects/warsaw-saga',
  'zine-no-2-girls-in-paris': '/projects/girls-in-paris',
}

function WorkCard({ w }: { w: ArtworkCard }) {
  const rawUrl = w.mainImage?.url ?? null
  const imgUrl = rawUrl
    ? rawUrl.includes('cdn.sanity.io')
      ? `${rawUrl}?w=600&auto=format&q=80`
      : rawUrl
    : null
  const soldOut = w.status === 'sold' || w.status === 'sold_out'
  const price = w.priceIncVat ? formatPrice(w.priceIncVat) : null

  const zineProjectHref = ZINE_PROJECT_LINKS[w.slug.current]
  const isZine = w._type === 'zine' || !!zineProjectHref
  const isVariant = w.isVariantCard === true
  const badge = w.variantBadge
  const isGetInTouch = w.slug.current === 'get-in-touch'

  // Variant card: use its buyUrl directly (external), or fall back to product page with ?variant=<badge>
  const variantParam = badge ? `?variant=${encodeURIComponent(badge.toLowerCase())}` : ''
  const variantHref = w.buyUrl ?? `/projects/${w.slug.current}${variantParam}`

  const href = isGetInTouch
    ? '/contact'
    : isVariant
    ? variantHref
    : zineProjectHref
    ?? (w._type === 'zine' ? `/projects/${w.slug.current}` : `/works/${w.slug.current}`)

  // Badge style per type
  const BADGE_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
    'Signed':          { bg: '#1a1a1a', color: '#fff', icon: '✦' },
    'Special Edition': { bg: '#1a56c4', color: '#fff', icon: '★' },
  }
  const badgeStyle = badge ? (BADGE_STYLES[badge] ?? { bg: '#333', color: '#fff', icon: '' }) : null

  const overlayLabel = isGetInTouch
    ? 'Get in touch'
    : isVariant
    ? (badge ? `Buy — ${badge}` : 'Buy variant')
    : isZine
    ? 'Read the zine'
    : soldOut
    ? 'More information'
    : <><CartIcon /> Add to cart</>

  const isExternalHref = isVariant && !!w.buyUrl

  const cardContent = (
    <>
      <div className="works-grid-img-wrap">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={w.title} className="works-grid-img" />
        ) : (
          <div className="works-grid-img" style={{ background: '#f0f0f0' }} />
        )}
        {isVariant && !soldOut && badgeStyle && (
          <span className="works-badge" style={{ background: badgeStyle.bg, color: badgeStyle.color, fontSize: '0.65rem', letterSpacing: '0.08em' }}>
            {badgeStyle.icon && `${badgeStyle.icon} `}{badge?.toUpperCase()}
          </span>
        )}
        {soldOut && <span className="works-badge works-badge-sold">SOLD OUT</span>}
        <div className="works-hover-overlay">{overlayLabel}</div>
      </div>
      <h3 className="works-grid-title">
        {w.title}
        {isVariant && badge && <span style={{ color: '#999', fontStyle: 'normal' }}> — {badge.toLowerCase()}</span>}
        {!isVariant && isZine && <span style={{ color: '#999', fontStyle: 'normal' }}> (click to read)</span>}
      </h3>
      {w.variantNote && (
        <p className="works-grid-medium">{w.variantNote}</p>
      )}
      {!isVariant && w.medium && (
        <p className="works-grid-medium">{w.medium}</p>
      )}
      {(w.year || w.dimensions) && (
        <p className="works-grid-meta">
          {[
            w.year,
            w.dimensions?.widthCm && w.dimensions?.heightCm
              ? `${w.dimensions.widthCm} × ${w.dimensions.heightCm} cm`
              : null,
          ].filter(Boolean).join(' · ')}
        </p>
      )}
      {price && <p className="works-price">{price}</p>}
    </>
  )

  const className = `works-grid-item-link${soldOut ? ' is-sold-out' : ''}${isVariant ? ' is-variant-card' : ''}`
  const cardStyle = isVariant ? { background: '#f7f5f0' } : undefined

  if (isExternalHref) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={cardStyle}>
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={href} className={className} style={cardStyle}>
      {cardContent}
    </Link>
  )
}

export default async function WorksPage() {
  const { config, works } = await getWorksData()

  const sections = config?.sections ?? []
  const visibleSections = sections.filter(s => s.visible)

  if (visibleSections.length === 0) {
    return (
      <>
        <section className="works-section">
          <div className="works-grid">
            {works.map(w => <WorkCard key={w._id} w={w} />)}
          </div>
        </section>
        <ContactSection />
      </>
    )
  }

  const grouped = visibleSections.map(s => {
    const cats = s.categories ?? []
    const isAll = cats.length === 0 || cats.includes('Alle werken')
    const filtered = isAll
      ? works
      : works.filter(w => w.category && cats.includes(w.category))
    const cols = s.columns ?? 3
    const effectiveMax = cols === 2
      ? (s.max2col ?? 4)
      : cols === 4
      ? (s.max4col ?? 4)
      : (s.max3col ?? 6)
    const showAll = effectiveMax === 0
    return {
      title: s.title || (s.categories ?? []).join(' & ') || '',
      isAll,
      columns: cols,
      max: effectiveMax,
      showAll,
      description: s.description,
      showViewAll: s.showViewAll ?? false,
      works: showAll ? filtered : filtered.slice(0, effectiveMax),
      total: filtered.length,
    }
  }).filter(g => g.works.length > 0)

  return (
    <>
      {grouped.map((group, i) => (
        <div key={group.title} style={i > 0 ? { marginTop: '4rem' } : undefined}>
          {group.isAll ? (
            // "Alle werken" — interactive filter + highlighted
            <WorksAllSection works={works} columns={group.columns} />
          ) : (
            <section className="works-section">
              <h2 className="works-section-title">{group.title}</h2>
              {group.description && group.description.length > 0 && (
                <div className="works-section-desc">
                  <PortableText value={group.description} components={ptComponents} />
                </div>
              )}
              <div
                className="works-grid"
                style={{ gridTemplateColumns: `repeat(${group.columns}, 1fr)` }}
              >
                {group.works.map(w => <WorkCard key={w._id} w={w} />)}
              </div>
              {group.showViewAll && !group.showAll && group.total > group.max && (
                <div style={{ marginTop: '1.5rem' }}>
                  <Link
                    href={`/works/all?cat=${encodeURIComponent(group.title)}`}
                    className="works-view-all"
                  >
                    Bekijk alle {group.title} ({group.total}) →
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>
      ))}

      <ContactSection />
    </>
  )
}

function ContactSection() {
  return null
}

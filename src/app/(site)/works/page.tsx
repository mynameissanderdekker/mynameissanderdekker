import Link from 'next/link'
import { client } from '@/sanity/lib/client'

interface ArtworkCard {
  _id: string
  title: string
  year?: number
  slug: { current: string }
  mainImage?: { url?: string }
  priceExclVAT?: number
  vatRate?: number
  status?: string
  showInWebshop?: boolean
  category?: string
}

interface SectionConfig {
  category: string
  visible: boolean
  max: number
}

interface WorksPageConfig {
  sections?: SectionConfig[]
}

const ALL_KEY = '__all__'

async function getWorksData(): Promise<{ config: WorksPageConfig | null; works: ArtworkCard[] }> {
  const [config, works] = await Promise.all([
    client.fetch<WorksPageConfig | null>(
      `*[_type == "worksPage"][0]{ sections }`,
      {},
      { next: { revalidate: 60 } },
    ),
    client.fetch<ArtworkCard[]>(
      `*[_type == "artwork" && defined(slug.current)] | order(year desc){
        _id, title, year, slug,
        "mainImage": images[0].asset->{ url },
        priceExclVAT, vatRate, status, showInWebshop, category
      }`,
      {},
      { next: { revalidate: 60 } },
    ),
  ])

  return { config, works }
}

function formatPrice(excl: number, vatRate = 9) {
  const incl = excl * (1 + vatRate / 100)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(incl)
}

function WorkCard({ w }: { w: ArtworkCard }) {
  const imgUrl = w.mainImage?.url ? `${w.mainImage.url}?w=600&auto=format&q=80` : null
  const soldOut = w.status === 'sold_out'
  const price = w.showInWebshop && w.priceExclVAT ? formatPrice(w.priceExclVAT, w.vatRate) : null

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
      {w.year && <p className="works-grid-year">{w.year}</p>}
      {price && <p className="works-price">{price}</p>}
    </>
  )

  return soldOut ? (
    <div className="works-grid-item is-sold-out">{inner}</div>
  ) : (
    <Link href={`/works/${w.slug.current}`} className="works-grid-item-link">{inner}</Link>
  )
}

export default async function WorksPage() {
  const { config, works } = await getWorksData()

  const sections = config?.sections ?? []
  const allEntry = sections.find(s => s.category === ALL_KEY)
  // Default: show all artworks flat (when nothing is configured or __all__ is visible)
  const showAll = !sections.length || (allEntry?.visible ?? true)

  if (showAll) {
    // ── Flat grid — alle werken ──────────────────────────────────────────────
    return (
      <>
        <h1 className="project-title">Works</h1>
        <section className="works-section">
          <div className="works-grid">
            {works.map(w => <WorkCard key={w._id} w={w} />)}
          </div>
        </section>
        <ContactSection />
      </>
    )
  }

  // ── Sectie-weergave ───────────────────────────────────────────────────────
  const visibleSections = sections.filter(s => s.category !== ALL_KEY && s.visible)

  const grouped = visibleSections.map(s => ({
    title: s.category,
    max: s.max ?? 6,
    works: works.filter(w => w.category === s.category).slice(0, s.max ?? 6),
  })).filter(g => g.works.length > 0)

  return (
    <>
      <h1 className="project-title">Works</h1>

      {grouped.map((group, i) => (
        <section
          key={group.title}
          className="works-section"
          style={i > 0 ? { marginTop: '4rem' } : undefined}
        >
          <h2 className="works-section-title">{group.title}</h2>
          <div className="works-grid">
            {group.works.map(w => <WorkCard key={w._id} w={w} />)}
          </div>
        </section>
      ))}

      {grouped.length === 0 && (
        <section className="works-section">
          <p style={{ color: '#999' }}>Geen secties zichtbaar. Configureer de webshop secties in Sanity Studio.</p>
        </section>
      )}

      <ContactSection />
    </>
  )
}

function ContactSection() {
  return (
    <section className="works-section" style={{ marginTop: '3rem' }}>
      <p className="works-desc">
        Looking for something specific — or not sure where to start?
      </p>
      <a href="mailto:hello@mynameissanderdekker.com" className="works-btn" style={{ display: 'inline-block' }}>
        Get in touch
      </a>
    </section>
  )
}

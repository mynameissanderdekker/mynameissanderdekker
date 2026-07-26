/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 60

interface ZineItem {
  number?: string
  title: string
  meta?: string
  description?: string
  featured: boolean
  projectSlug?: string
  coverImage?: { asset?: { _ref?: string }; hotspot?: unknown; crop?: unknown }
  coverImageUrl?: string
}

interface Props {
  params: Promise<{ slug: string }>
}

// ── Sanity queries ─────────────────────────────────────────────────────────

async function getProject(slug: string) {
  return client.fetch(
    `*[_type == "project" && slug.current == $slug && isPage == true][0]{
      _id, title, dateRange, year, description,
      topVideoUrl, closingVideoUrl,
      images[]{ asset, hotspot, crop },
      zines[]{
        number, title, meta, description, featured, projectSlug,
        coverImage{ asset, hotspot, crop },
        coverImageUrl
      }
    }`,
    { slug }
  )
}

// ── Image helper ────────────────────────────────────────────────────────────

function zineImageUrl(zine: ZineItem): string | null {
  if (zine.coverImage?.asset) {
    return urlFor(zine.coverImage).width(600).height(800).fit('crop').url()
  }
  return zine.coverImageUrl ?? null
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params

  const project = await getProject(slug)

  if (!project) notFound()

  const allZines: ZineItem[] = project.zines ?? []
  const featuredZines = allZines.filter(z => z.featured)
  const restZines = allZines.filter(z => !z.featured)
  const exhibitionImages: { asset?: { _ref?: string }; hotspot?: unknown; crop?: unknown }[] = project.images ?? []

  const dateLabel = project.dateRange ?? project.year ?? null

  return (
    <>
      {/* Top video */}
      {project.topVideoUrl && (
        <div className="project-video">
          <video controls playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <source src={project.topVideoUrl} type="video/mp4" />
          </video>
        </div>
      )}

      <h1 className="project-title">{project.title}</h1>
      {dateLabel && <p className="project-date">{dateLabel}</p>}

      {/* Intro text */}
      {project.description && (
        <div className="project-intro">
          <PortableText value={project.description} />
        </div>
      )}

      {/* Featured zines */}
      {featuredZines.length > 0 && (
        <div className="zine-grid">
          {featuredZines.map((zine, i) => {
            const imgUrl = zineImageUrl(zine)
            const card = (
              <>
                {imgUrl && <img src={imgUrl} alt={zine.title} className="zine-card-img" />}
                <div className="zine-card-body">
                  <h3 className="zine-card-title">{zine.number ? `${zine.number} ` : ''}{zine.title}</h3>
                  {zine.meta && <p className="zine-card-meta">{zine.meta}</p>}
                  {zine.description && <p className="zine-card-desc">{zine.description}</p>}
                  {zine.projectSlug && <span className="zine-read-link">Read the zine →</span>}
                </div>
              </>
            )
            return zine.projectSlug ? (
              <Link key={i} href={`/projects/${zine.projectSlug}`} className="zine-card zine-card-link">
                {card}
              </Link>
            ) : (
              <div key={i} className="zine-card">{card}</div>
            )
          })}
        </div>
      )}

      {/* All other zines */}
      {restZines.length > 0 && (
        <div className="zine-grid zine-grid-all">
          {restZines.map((zine, i) => {
            const imgUrl = zineImageUrl(zine)
            return (
              <div key={i} className="zine-card">
                {imgUrl && <img src={imgUrl} alt={zine.title} className="zine-card-img" />}
                <div className="zine-card-body">
                  <h3 className="zine-card-title">{zine.number ? `${zine.number} ` : ''}{zine.title}</h3>
                  {zine.meta && <p className="zine-card-meta">{zine.meta}</p>}
                  {zine.description && <p className="zine-card-desc">{zine.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Exhibition gallery */}
      {exhibitionImages.length > 0 && (
        <div className="project-gallery" style={{ marginTop: '64px' }}>
          {exhibitionImages.map((img, i) => (
            <img
              key={i}
              src={urlFor(img).width(1200).fit('max').url()}
              alt={`${project.title} — ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Closing video */}
      {project.closingVideoUrl && (
        <div className="project-video" style={{ marginTop: '48px' }}>
          <video controls playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <source src={project.closingVideoUrl} type="video/mp4" />
          </video>
        </div>
      )}
    </>
  )
}

export async function generateStaticParams() {
  const projects = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "project" && isPage == true]{ slug }`
  )
  return projects.map(p => ({ slug: p.slug.current }))
}

/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { PortableText } from '@portabletext/react'
import PrintButton from './PrintButton'

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

async function getPressRelease(id: string) {
  return client.fetch(
    `*[_type == "pressRelease" && _id == $id][0]{
      title, date, embargo, subject, intro, body,
      contactName, contactEmail, contactPhone, website,
      images[]{ image{ asset, hotspot, crop }, caption },
      artworks[]->{ _id, title, year, "mainImage": images[0]{ asset, hotspot, crop } },
      exhibition->{ title, gallery, location, startDate, endDate }
    }`,
    { id }
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function PressReleasePage({ params }: Props) {
  const { id } = await params
  const pr = await getPressRelease(id)
  if (!pr) notFound()

  const releaseLabel = pr.embargo ?? 'FOR IMMEDIATE RELEASE'
  const dateLocation = ['Amsterdam', pr.date ? formatDate(pr.date) : ''].filter(Boolean).join(', ')

  return (
    <>
      {/* Print button — hidden in print */}
      <div className="press-print-bar no-print">
        <PrintButton />
        <a href="/studio/structure/campaignSegment" className="press-back-link">← Back to Studio</a>
      </div>

      <article className="press-release">
        {/* Header */}
        <header className="press-header">
          <p className="press-release-label">{releaseLabel}</p>
          {dateLocation && <p className="press-date-location">{dateLocation}</p>}
          <h1 className="press-title">{pr.title}</h1>
          {pr.subject && <p className="press-subject">{pr.subject}</p>}
          {pr.exhibition && (
            <p className="press-exhibition-line">
              {pr.exhibition.gallery}
              {pr.exhibition.location && `, ${pr.exhibition.location}`}
              {(pr.exhibition.startDate || pr.exhibition.endDate) && (
                <> — {formatDate(pr.exhibition.startDate)}{pr.exhibition.endDate ? ` – ${formatDate(pr.exhibition.endDate)}` : ''}</>
              )}
            </p>
          )}
        </header>

        {/* Intro */}
        {pr.intro && <p className="press-intro">{pr.intro}</p>}

        {/* Body */}
        {pr.body && pr.body.length > 0 && (
          <div className="press-body">
            <PortableText value={pr.body} />
          </div>
        )}

        {/* Press images */}
        {pr.images && pr.images.length > 0 && (
          <div className="press-images">
            <h2 className="press-section-title">Press images</h2>
            <div className="press-images-grid">
              {pr.images.map((item: { image?: { asset?: { _ref?: string } }; caption?: string }, i: number) => {
                const url = item.image?.asset ? urlFor(item.image).width(800).fit('max').url() : null
                return url ? (
                  <figure key={i} className="press-image-figure">
                    <img src={url} alt={item.caption ?? ''} />
                    {item.caption && <figcaption>{item.caption}</figcaption>}
                  </figure>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Featured artworks */}
        {pr.artworks && pr.artworks.length > 0 && (
          <div className="press-artworks">
            <h2 className="press-section-title">Featured works</h2>
            <div className="press-artworks-grid">
              {pr.artworks.map((a: { _id: string; title: string; year?: number; mainImage?: { asset?: { _ref?: string } } }) => {
                const url = a.mainImage?.asset ? urlFor(a.mainImage).width(400).fit('max').url() : null
                return (
                  <figure key={a._id} className="press-artwork-figure">
                    {url && <img src={url} alt={a.title} />}
                    <figcaption>{a.title}{a.year ? `, ${a.year}` : ''}</figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        <footer className="press-footer">
          <h2 className="press-section-title">Press contact</h2>
          <p>{pr.contactName}</p>
          {pr.contactEmail && <p><a href={`mailto:${pr.contactEmail}`}>{pr.contactEmail}</a></p>}
          {pr.contactPhone && <p>{pr.contactPhone}</p>}
          {pr.website && <p><a href={pr.website}>{pr.website}</a></p>}
        </footer>
      </article>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .press-release { max-width: 100%; padding: 0; }
        }
        .press-print-bar {
          position: sticky; top: 0; z-index: 10;
          background: #f5f5f5; border-bottom: 1px solid #ddd;
          padding: 12px 40px; display: flex; gap: 16px; align-items: center;
          font-size: 14px;
        }
        .press-back-link { color: #666; text-decoration: none; }
        .press-release {
          max-width: 720px; margin: 48px auto; padding: 0 40px 80px;
          font-family: Georgia, serif; color: #111; line-height: 1.7;
        }
        .press-release-label {
          font-family: sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: #888;
          margin: 0 0 4px;
        }
        .press-date-location {
          font-family: sans-serif; font-size: 13px; color: #666; margin: 0 0 24px;
        }
        .press-title {
          font-size: 28px; font-weight: 700; margin: 0 0 8px; line-height: 1.3;
        }
        .press-subject {
          font-size: 16px; color: #555; margin: 0 0 8px; font-style: italic;
        }
        .press-exhibition-line {
          font-family: sans-serif; font-size: 13px; color: #666; margin: 0 0 32px;
        }
        .press-intro {
          font-size: 17px; font-weight: 600; margin: 0 0 24px; line-height: 1.6;
        }
        .press-body p { margin: 0 0 16px; font-size: 15px; }
        .press-section-title {
          font-family: sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: #888;
          margin: 48px 0 16px; border-top: 1px solid #ddd; padding-top: 16px;
        }
        .press-images-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        .press-image-figure img { width: 100%; display: block; }
        .press-image-figure figcaption {
          font-size: 12px; color: #888; margin-top: 4px; font-family: sans-serif;
        }
        .press-artworks-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
        }
        .press-artwork-figure img { width: 100%; display: block; }
        .press-artwork-figure figcaption {
          font-size: 12px; color: #666; margin-top: 4px; font-family: sans-serif;
        }
        .press-footer { margin-top: 48px; font-family: sans-serif; font-size: 14px; }
        .press-footer p { margin: 0 0 4px; }
        .press-footer a { color: #111; }
      `}</style>
    </>
  )
}

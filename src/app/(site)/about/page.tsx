'use client'

import { useState, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { ptComponents } from '@/components/PageBuilder'

interface Quote {
  _key: string
  name: string
  role?: string
  publication?: string
  image?: { asset?: { _ref?: string } }
  quote?: string
  article?: string
  articleNl?: string
}

interface AboutData {
  portrait?: { asset?: { _ref?: string } }
  bio?: unknown[]
  quotes?: Quote[]
}

interface CvEntry {
  _key: string
  year?: string
  label: string
}

interface CvSection {
  _key: string
  title: string
  entries?: CvEntry[]
}

// Items can be either plain strings (legacy data) or {text, url} objects
type PubPressItem = string | { _key?: string; text: string; url?: string }

interface PubPressGroup {
  _key: string
  groupTitle: string
  items?: PubPressItem[]
}

interface PubPressColumn {
  _key: string
  columnTitle: string
  groups?: PubPressGroup[]
}

interface CvData {
  intro?: string
  cvPdfUrl?: string
  sections?: CvSection[]
  pubPressColumns?: PubPressColumn[]
}

function QuoteItem({ q }: { q: Quote }) {
  const [open, setOpen] = useState(false)
  const [showNl, setShowNl] = useState(false)
  const imgUrl = q.image?.asset ? urlFor(q.image).width(460).fit('max').url() : null

  const articleText = showNl ? q.articleNl : q.article

  return (
    <div className="about-quote">
      <div className="about-quote-header">
        {imgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={q.name} className="about-quote-img" />
        )}
        <div className="about-quote-meta">
          <p className="about-quote-name">
            <strong>{q.name}</strong>
            {q.role && <> — {q.role}</>}
            {q.publication && <>, <em>{q.publication}</em></>}
          </p>
          {q.quote && <p className="about-quote-text">{q.quote}</p>}
        </div>
      </div>
      {q.article && (
        <>
          <button className="about-quote-toggle" onClick={() => setOpen(o => !o)}>
            Read the whole article <span>{open ? '−' : '+'}</span>
          </button>
          {open && (
            <div className="about-quote-article">
              {q.articleNl && (
                <p style={{ fontSize: '11px', color: '#999', marginBottom: '1.2em' }}>
                  Translated from Dutch.{' '}
                  <button
                    onClick={() => setShowNl(v => !v)}
                    style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', color: 'inherit', padding: 0 }}
                  >
                    {showNl ? 'Read English translation' : 'Lees het origineel in het Nederlands'}
                  </button>
                </p>
              )}
              {articleText?.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CvSectionBlock({ section }: { section: CvSection }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 className="cv-project-name">• {section.title}</h3>
      {section.entries && section.entries.length > 0 && (
        <ul className="cv-list">
          {section.entries.map(e => (
            <li key={e._key}>
              {e.year ? `${e.year} — ${e.label}` : e.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null)
  const [cv, setCv] = useState<CvData | null>(null)

  useEffect(() => {
    Promise.all([
      client.fetch<AboutData>(
        `*[_type == "aboutPage"][0]{ portrait, bio, quotes[]{ ..., articleNl } }`,
        {},
        { cache: 'no-store' }
      ),
      client.fetch<CvData>(
        `*[_type == "cvPage"][0]{
          intro,
          cvPdfUrl,
          sections[]{ _key, title, entries[]{ _key, year, label } },
          pubPressColumns[]{ _key, columnTitle, groups[]{ _key, groupTitle, items[] } }
        }`,
        {},
        { cache: 'no-store' }
      ),
    ]).then(([aboutData, cvData]) => {
      setAbout(aboutData)
      setCv(cvData)
    })
  }, [])

  const quotes = about?.quotes ?? []
  const portraitUrl = about?.portrait?.asset ? urlFor(about.portrait).width(1200).fit('max').url() : null

  const cvSections = cv?.sections ?? []
  const mid = Math.ceil(cvSections.length / 2)
  const leftSections = cvSections.slice(0, mid)
  const rightSections = cvSections.slice(mid)
  const pubPressColumns = cv?.pubPressColumns ?? []

  return (
    <>
      {/* Large horizontal photo, centered */}
      {portraitUrl && (
        <div className="about-hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portraitUrl} alt="Sander Dekker" />
        </div>
      )}

      {/* About text — same style as a project page text block */}
      {about?.bio && about.bio.length > 0 && (
        <div className="project-intro" style={{ maxWidth: '66.666%', marginLeft: 'auto', marginRight: 'auto' }}>
          <PortableText value={about.bio as Parameters<typeof PortableText>[0]['value']} components={ptComponents} />
        </div>
      )}

      <hr className="project-divider" />

      {quotes.length > 0 && (
        <>
          <h2 className="section-title">Selected Quotes</h2>
          <div className="about-quotes">
            {quotes.map(q => <QuoteItem key={q._key} q={q} />)}
          </div>
        </>
      )}

      {/* CV */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Selected Projects &amp; Exhibitions</h2>
        {cv?.cvPdfUrl && (
          <a
            href={cv.cvPdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="cv-download-btn"
          >
            ↓ Download CV (PDF)
          </a>
        )}
      </div>
      {cv?.intro && (
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px', lineHeight: 1.7, marginTop: '8px' }}>
          {cv.intro}
        </p>
      )}

      <div className="cv-projects-grid">
        <div>
          {leftSections.map(s => <CvSectionBlock key={s._key} section={s} />)}
        </div>
        <div>
          {rightSections.map(s => <CvSectionBlock key={s._key} section={s} />)}
        </div>
      </div>

      {pubPressColumns.length > 0 && (
        <>
          <hr className="project-divider" style={{ marginTop: '64px' }} />
          <h2 className="section-title">Publications, Press &amp; Media</h2>

          <div className="cv-projects-grid">
            {pubPressColumns.map(col => (
              <div key={col._key}>
                <p className="cv-sub-head">{col.columnTitle}</p>
                {(col.groups ?? []).map(g => (
                  <div key={g._key} style={{ marginBottom: '1.5rem' }}>
                    <p className="cv-sub-label">{g.groupTitle}</p>
                    <ul className="cv-list">
                      {(g.items ?? []).filter(Boolean).map((item, i) => {
                        const text = typeof item === 'string' ? item : item.text
                        const url  = typeof item === 'string' ? undefined : item.url
                        const key  = typeof item === 'string' ? i : (item._key ?? i)
                        return (
                          <li key={key}>
                            {url
                              ? <a href={url} target="_blank" rel="noopener noreferrer">{text}</a>
                              : text}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

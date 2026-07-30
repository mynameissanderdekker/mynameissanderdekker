'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

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
  bio?: Array<{ _type: string; children?: Array<{ text: string }> }>
  quotes?: Quote[]
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

// Plain-text extract from Portable Text blocks
function blockText(blocks: AboutData['bio']): string[] {
  if (!blocks) return []
  return blocks.map(b =>
    (b.children ?? []).map((c: { text: string }) => c.text).join('')
  ).filter(Boolean)
}

export default function AboutPage() {
  const [data, setData] = useState<AboutData | null>(null)

  useEffect(() => {
    client.fetch<AboutData>(
      `*[_type == "aboutPage"][0]{ portrait, bio, quotes[]{ ..., articleNl } }`,
      {},
      { cache: 'no-store' }
    ).then(setData)
  }, [])

  const bioLines = blockText(data?.bio)
  const quotes = data?.quotes ?? []
  const portraitUrl = data?.portrait?.asset ? urlFor(data.portrait).width(800).fit('max').url() : null

  return (
    <>
      {/* Portrait + bio side by side */}
      <div className="about-portrait">
        <div className="about-portrait-img-wrap">
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt="Sander Dekker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div className="about-portrait-placeholder" aria-hidden="true">
              <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <rect width="500" height="400" fill="#f0f0f0"/>
                <circle cx="250" cy="160" r="80" fill="#ccc"/>
                <ellipse cx="250" cy="360" rx="130" ry="90" fill="#ccc"/>
              </svg>
            </div>
          )}
        </div>
        <div className="about-bio">
          {bioLines.map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>

      {quotes.length > 0 && (
        <>
          <h2 className="section-title">Selected Quotes</h2>
          <div className="about-quotes">
            {quotes.map(q => <QuoteItem key={q._key} q={q} />)}
          </div>
        </>
      )}
    </>
  )
}

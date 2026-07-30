import { client } from '@/sanity/lib/client'

interface Entry {
  _key: string
  year?: string
  label: string
}

interface CvSection {
  _key: string
  title: string
  entries?: Entry[]
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

async function getCvData(): Promise<CvData> {
  return client.fetch<CvData>(
    `*[_type == "cvPage"][0]{
      intro,
      cvPdfUrl,
      sections[]{
        _key,
        title,
        entries[]{ _key, year, label }
      },
      pubPressColumns[]{
        _key,
        columnTitle,
        groups[]{
          _key,
          groupTitle,
          items[]
        }
      }
    }`,
    {},
    { next: { revalidate: false } }
  )
}

function SectionBlock({ section }: { section: CvSection }) {
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

export default async function CVPage() {
  const data = await getCvData()

  const sections = data?.sections ?? []
  const columns = data?.pubPressColumns ?? []

  // Split sections into two columns roughly in half
  const mid = Math.ceil(sections.length / 2)
  const leftSections = sections.slice(0, mid)
  const rightSections = sections.slice(mid)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '48px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Selected Projects &amp; Exhibitions</h2>
        {data?.cvPdfUrl && (
          <a
            href={data.cvPdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="cv-download-btn"
          >
            ↓ Download CV (PDF)
          </a>
        )}
      </div>
      {data?.intro && (
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px', lineHeight: 1.7, marginTop: '8px' }}>
          {data.intro}
        </p>
      )}

      <div className="cv-projects-grid">
        <div>
          {leftSections.map(s => <SectionBlock key={s._key} section={s} />)}
        </div>
        <div>
          {rightSections.map(s => <SectionBlock key={s._key} section={s} />)}
        </div>
      </div>

      {columns.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: '64px' }}>Publications, Press &amp; Media</h2>

          <div className="cv-projects-grid">
            {columns.map(col => (
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

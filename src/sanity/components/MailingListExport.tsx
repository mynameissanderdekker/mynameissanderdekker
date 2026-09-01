'use client'
import React, { useEffect, useState } from 'react'
import { useListClient } from './useListClient'
import { SEGMENTS } from '../schemas/campaign'

interface Contact {
  firstName?: string
  lastName?: string
  email: string
  type?: string
  country?: string
  subscribed?: boolean
}

interface SegmentCount {
  segment: typeof SEGMENTS[number]
  count: number
  loading: boolean
}

function escapeCsv(value: string | undefined | null): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(contacts: Contact[]): string {
  const header = ['First name', 'Last name', 'Email', 'Type', 'Country', 'Subscribed']
  const rows = contacts.map(c => [
    escapeCsv(c.firstName),
    escapeCsv(c.lastName),
    escapeCsv(c.email),
    escapeCsv(c.type),
    escapeCsv(c.country),
    c.subscribed === false ? 'no' : 'yes',
  ])
  return [header.join(','), ...rows.map(r => r.join(','))].join('\r\n')
}

export function MailingListExport(_props: Record<string, unknown>) {
  const client = useListClient()
  const [segments, setSegments] = useState<SegmentCount[]>(
    SEGMENTS.map(s => ({ segment: s, count: 0, loading: true }))
  )
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    SEGMENTS.forEach((seg, i) => {
      client
        .fetch<number>(`count(*[_type == "contact" && defined(email) && (${seg.filter})])`)
        .then(count => {
          setSegments(prev => {
            const next = [...prev]
            next[i] = { ...next[i], count, loading: false }
            return next
          })
        })
        .catch(() => {
          setSegments(prev => {
            const next = [...prev]
            next[i] = { ...next[i], loading: false }
            return next
          })
        })
    })
  }, [client])

  async function downloadCsv(segmentValue: string, filter: string) {
    setDownloading(segmentValue)
    try {
      const contacts = await client.fetch<Contact[]>(
        `*[_type == "contact" && defined(email) && (${filter})]{
          firstName, lastName, email, type, country, subscribed
        } | order(lastName asc)`
      )
      const csv = buildCsv(contacts)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${segmentValue}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export mislukt.')
    } finally {
      setDownloading(null)
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--card-bg-color, #fff)',
    border: '1px solid var(--card-border-color, #e0e0e0)',
    borderRadius: 6,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  }

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto', fontFamily: 'var(--font-family-sans, sans-serif)' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: 'var(--card-fg-color, #111)' }}>
        Mailing lists
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--card-muted-fg-color, #888)' }}>
        Download een CSV per segment en importeer hem in Mailchimp, Brevo of een andere email builder.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {segments.map(({ segment, count, loading }) => (
          <div key={segment.value} style={card}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 500, color: 'var(--card-fg-color, #111)' }}>
                {segment.title}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--card-muted-fg-color, #888)' }}>
                {segment.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--card-fg-color, #111)', minWidth: 40, textAlign: 'right' }}>
                {loading ? '…' : count}
              </span>
              <button
                onClick={() => downloadCsv(segment.value, segment.filter)}
                disabled={downloading === segment.value || loading || count === 0}
                style={{
                  padding: '8px 18px',
                  fontSize: 12,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  cursor: count === 0 ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--card-border-color, #ddd)',
                  borderRadius: 4,
                  background: downloading === segment.value
                    ? 'var(--card-border-color, #eee)'
                    : 'var(--card-fg-color, #111)',
                  color: downloading === segment.value
                    ? 'var(--card-muted-fg-color, #888)'
                    : 'var(--card-bg-color, #fff)',
                  opacity: count === 0 ? 0.4 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {downloading === segment.value ? 'Downloaden…' : '↓ CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: 12, color: 'var(--card-muted-fg-color, #aaa)', lineHeight: 1.6 }}>
        Het CSV-bestand bevat: voornaam, achternaam, e-mail, type, land.<br />
        Gesorteerd op achternaam — klaar voor import in Mailchimp of Brevo.
      </p>
    </div>
  )
}

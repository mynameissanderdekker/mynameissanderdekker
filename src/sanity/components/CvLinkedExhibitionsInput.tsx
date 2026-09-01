'use client'

import { useEffect, useState } from 'react'
import { useFormValue } from 'sanity'
import { useListClient } from './useListClient'

interface LinkedItem {
  _id: string
  _type: 'exhibition' | 'artFair'
  gallery?: string
  startDate?: string
  exhibitionType?: string
}

const TYPE_LABEL: Record<string, string> = {
  solo: 'Solo',
  duo: 'Duo',
  group: 'Group',
  permanent: 'Permanent',
  special: 'Special',
  artFair: 'Art fair',
}

export function CvLinkedExhibitionsInput() {
  const client = useListClient()
  const rawId = useFormValue(['_id']) as string | undefined
  const documentId = rawId?.replace('drafts.', '')

  const [items, setItems] = useState<LinkedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId) return
    setLoading(true)
    Promise.all([
      client.fetch<LinkedItem[]>(
        `*[_type == "exhibition" && cvProject._ref == $id]{ _id, _type, gallery, startDate, exhibitionType } | order(startDate desc)`,
        { id: documentId }
      ),
      client.fetch<LinkedItem[]>(
        `*[_type == "artFair" && cvProject._ref == $id]{ _id, "_type": "artFair", "gallery": fair, startDate, "exhibitionType": "artFair" } | order(startDate desc)`,
        { id: documentId }
      ),
    ]).then(([exs, afs]) => {
      const all = [...exs, ...afs].sort((a, b) =>
        (b.startDate ?? '').localeCompare(a.startDate ?? '')
      )
      setItems(all)
      setLoading(false)
    })
  }, [client, documentId])

  const containerStyle: React.CSSProperties = {
    border: '1px solid var(--card-border-color, #e0e0e0)',
    borderRadius: 3,
    padding: '8px 12px',
    minHeight: 40,
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <span style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #888)' }}>Loading…</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <span style={{ fontSize: 13, color: 'var(--card-muted-fg-color, #888)' }}>
          No exhibitions linked yet. Set &ldquo;CV — Project&rdquo; on an Exhibition or Art Fair to link it here.
        </span>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {items.map((item, i) => {
        const year = item.startDate ? new Date(item.startDate).getFullYear() : '?'
        const label = TYPE_LABEL[item.exhibitionType ?? ''] ?? item.exhibitionType ?? '—'
        return (
          <div
            key={item._id}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'baseline',
              padding: '5px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--card-border-color, #eee)' : 'none',
              fontSize: 13,
            }}
          >
            <span style={{ minWidth: 36, color: 'var(--card-muted-fg-color, #999)' }}>{year}</span>
            <span style={{ flex: 1 }}>{item.gallery}</span>
            <span style={{ color: 'var(--card-muted-fg-color, #999)', fontSize: 11 }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

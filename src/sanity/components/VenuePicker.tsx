'use client'

import React, { useEffect, useState } from 'react'
import { set, unset, type StringInputProps } from 'sanity'
import { useListClient } from './useListClient'

/**
 * Kiest waar een expositie plaatsvindt.
 *
 * Hier ligt het anders dan bij een galerie: een kunstenaar exposeert per
 * definitie ergens anders, bij wisselende galeries. Die staan al in de
 * contacten, dus de lijst komt daarvandaan — alleen de contacten met het vinkje
 * "I work with this gallery", want in de nieuwsbrieflijst staan er tientallen
 * waar je nooit mee werkt.
 *
 * Daarnaast kun je je eigen studio kiezen, voor een open studio of een
 * presentatie bij jezelf.
 *
 * Bewaart een `_key` (eigen adres) of een contact-id, met een voorvoegsel zodat
 * de twee soorten uit elkaar te houden zijn.
 */

interface Space {
  id: string
  kind: 'own' | 'gallery'
  label: string
  detail?: string
}

export function VenuePicker(props: StringInputProps) {
  const { value, onChange, readOnly } = props
  const client = useListClient()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .fetch<{ own: any[]; galleries: any[] }>(
        `{
          "own": *[_type == "siteSettings"][0].addresses[label == "studio"]{ _key, name, street, city },
          "galleries": *[_type == "contact" && type == "gallery" && worksWithMe == true]
            | order(coalesce(company, lastName, firstName) asc){
              _id, company, firstName, lastName, city, country
            }
        }`
      )
      .then((r) => {
        const own: Space[] = (r?.own ?? []).map((a: any) => ({
          id: `own:${a._key}`,
          kind: 'own' as const,
          label: a.name || 'My studio',
          detail: [a.street, a.city].filter(Boolean).join(', '),
        }))
        const gal: Space[] = (r?.galleries ?? []).map((c: any) => ({
          id: `contact:${c._id}`,
          kind: 'gallery' as const,
          label: c.company || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Gallery',
          detail: [c.city, c.country].filter(Boolean).join(', '),
        }))
        setSpaces([...gal, ...own])
      })
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false))
  }, [client])

  if (loading) return <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</div>

  if (spaces.length === 0) {
    return (
      <div style={{ fontSize: 13, color: '#9ca3af', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        No venues yet — tick “I work with this gallery” on a contact, or add a studio under Site Settings → Locations.
      </div>
    )
  }

  const noGalleries = spaces.every((sp) => sp.kind === 'own')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Zonder galeries in de lijst zie je alleen je eigen studio, en lijkt het
          alsof er niets te kiezen valt. Zeggen waar die keuzes vandaan komen is
          hier nuttiger dan een lege lijst tonen. */}
      {noGalleries && (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
          Galleries you work with appear here. Add one under{' '}
          <strong style={{ color: '#6b7280', fontWeight: 500 }}>Contacts</strong>, set the type to
          Gallery and tick <em>“I work with this gallery”</em>.
        </p>
      )}
      {spaces.map((sp) => {
        const on = sp.id === value
        return (
          <button
            key={sp.id}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(on ? unset() : set(sp.id))}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: readOnly ? 'default' : 'pointer',
              border: `1.5px solid ${on ? '#111' : '#e5e7eb'}`,
              background: '#fff',
              fontWeight: on ? 600 : 400,
            }}
          >
            {sp.label}
            {sp.detail && <span style={{ color: '#9ca3af', fontWeight: 400 }}> — {sp.detail}</span>}
            {sp.kind === 'own' && <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>  ·  my space</span>}
          </button>
        )
      })}
    </div>
  )
}

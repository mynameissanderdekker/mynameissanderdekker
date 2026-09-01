'use client'

import React, { useState } from 'react'
import { useFormValue, useDocumentOperation, useClient } from 'sanity'

/**
 * Reserveren in één handeling, bovenaan het artwork.
 *
 * Eerder moest je eerst de status op "Reserved" zetten, waarna er drie velden
 * verschenen die je apart moest invullen. Wie de status omzette en verder
 * scrollde, liet een reservering achter zonder klant en zonder einddatum —
 * precies de twee dingen waar je later naar zoekt.
 *
 * Een verlopen reservering vraagt bovendien om een beslissing, en die werd
 * nergens aangeboden: verlengen, vrijgeven, of er een verkoop van maken.
 */

const iso = (d: Date) => d.toISOString().slice(0, 10)
const today = () => iso(new Date())
const plusDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

interface ContactHit { _id: string; label: string }

export function ArtworkReservation() {
  const rawId = useFormValue(['_id']) as string | undefined
  const id = (rawId ?? '').replace(/^drafts\./, '')
  const { patch, publish } = useDocumentOperation(id, 'artwork')
  const client = useClient({ apiVersion: '2024-01-01' })

  const status = useFormValue(['status']) as string | undefined
  const reservedFor = useFormValue(['reservedFor']) as { _ref?: string } | undefined
  const reservedUntil = useFormValue(['reservedUntil']) as string | undefined
  const reservedNote = useFormValue(['reservedNote']) as string | undefined

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ContactHit[]>([])
  const [picked, setPicked] = useState<ContactHit | null>(null)
  const [until, setUntil] = useState(plusDays(14))
  const [note, setNote] = useState('')
  const [name, setName] = useState<string | null>(null)

  const reserved = status === 'reserved'
  const expired = reserved && !!reservedUntil && reservedUntil < today()

  // Naam van de klant ophalen: het formulier heeft alleen de referentie.
  React.useEffect(() => {
    const ref = reservedFor?._ref
    if (!reserved || !ref) { setName(null); return }
    client
      .fetch<string | null>(
        `*[_id == $ref][0]{
          "n": coalesce(firstName + " " + lastName, firstName, company, email)
        }.n`,
        { ref }
      )
      .then(setName)
      .catch(() => setName(null))
  }, [reserved, reservedFor?._ref, client])

  async function search(q: string) {
    setQuery(q)
    if (q.trim().length < 2) { setHits([]); return }
    const res = await client.fetch<ContactHit[]>(
      `*[_type == "contact" && (
          firstName match $q + "*" || lastName match $q + "*" ||
          company match $q + "*" || email match $q + "*"
        )][0...8]{
          _id,
          "label": coalesce(firstName + " " + lastName, firstName, company, email)
        }`,
      { q: q.trim() }
    ).catch(() => [])
    setHits(res)
  }

  function apply(set: Record<string, unknown>, unset?: string[]) {
    setBusy(true)
    patch.execute([unset ? { set, unset } as any : { set }])
    setTimeout(() => { publish.execute(); setBusy(false) }, 120)
  }

  function reserve() {
    if (!picked) return
    apply({
      status: 'reserved',
      reservedFor: { _type: 'reference', _ref: picked._id },
      reservedUntil: until,
      ...(note.trim() ? { reservedNote: note.trim() } : {}),
    })
    setOpen(false); setPicked(null); setQuery(''); setHits([]); setNote('')
  }

  function release() {
    // Niets laten staan over een klant die het werk niet meer vasthoudt.
    apply({ status: 'available' }, ['reservedFor', 'reservedUntil', 'reservedNote'])
  }

  const box: React.CSSProperties = {
    border: `1px solid ${expired ? '#fed7aa' : '#e5e7eb'}`, borderRadius: 10,
    background: expired ? '#fffbeb' : '#fff', fontSize: 14, padding: '14px 16px',
  }
  const btn = (primary?: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', cursor: busy ? 'wait' : 'pointer',
    border: primary ? 'none' : '1.5px solid #e5e7eb',
    background: primary ? '#111' : '#fff',
    color: primary ? '#fff' : '#374151', whiteSpace: 'nowrap',
  })
  const input: React.CSSProperties = {
    width: '100%', padding: '9px 11px', border: '1.5px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  }

  if (!id) return <div style={box}>Save the artwork first.</div>

  // ── Al gereserveerd ──
  if (reserved) {
    return (
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: expired ? '#b45309' : '#111' }}>
              {expired ? 'Hold expired' : 'On hold'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {name ?? 'Nobody linked'}
              {reservedUntil ? ` · until ${fmt(reservedUntil)}` : ' · no end date'}
            </div>
            {reservedNote && (
              <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 }}>
                {reservedNote}
              </div>
            )}
          </div>
        </div>

        {/* Een verlopen hold vraagt om een keuze; die hoort hier te staan en
            niet als iets dat je zelf moet bedenken. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          <button style={btn(expired)} disabled={busy}
                  onClick={() => apply({ reservedUntil: plusDays(14) })}>
            Extend by two weeks
          </button>
          <button style={btn()} disabled={busy} onClick={release}>
            Release
          </button>
          <a href="/studio/structure/register-sale"
             style={{ ...btn(), textDecoration: 'none', display: 'inline-block' }}>
            Register a sale →
          </a>
        </div>
      </div>
    )
  }

  // ── Nog niet gereserveerd ──
  if (!open) {
    const sellable = status === 'available' || !status
    return (
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 13, color: '#6b7280' }}>
            {sellable
              ? 'Hold this work for a client for a set period.'
              : `This work is marked "${status}". Holding it only makes sense when it is available.`}
          </div>
          {sellable && (
            <button style={btn(true)} onClick={() => setOpen(true)}>Put on hold</button>
          )}
        </div>
      </div>
    )
  }

  // ── Formulier: klant, tot wanneer, notitie ──
  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Put on hold</div>

      {picked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 14 }}>{picked.label}</span>
          <button style={btn()} onClick={() => { setPicked(null); setQuery('') }}>Change</button>
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <input
            style={input}
            value={query}
            placeholder="Search client by name, company or email"
            onChange={e => search(e.target.value)}
          />
          {hits.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
              {hits.map(h => (
                <button
                  key={h._id}
                  onClick={() => { setPicked(h); setHits([]) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '9px 11px',
                    background: '#fff', border: 'none', borderBottom: '1px solid #f3f4f6',
                    fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Until</p>
          <input type="date" style={input} value={until} onChange={e => setUntil(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Note</p>
          <input style={input} value={note} onChange={e => setNote(e.target.value)}
                 placeholder="Agreement, viewing…" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn(true), opacity: picked ? 1 : 0.4 }} disabled={!picked || busy} onClick={reserve}>
          Put on hold
        </button>
        <button style={btn()} onClick={() => { setOpen(false); setPicked(null); setQuery('') }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

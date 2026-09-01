'use client'

import React, { useState } from 'react'
import { useFormValue, useDocumentOperation } from 'sanity'

/**
 * Eén paneel bovenaan de order dat de hele afhandeling doet.
 *
 * Een verkoop heeft twee dingen nodig voordat hij klaar is: het geld binnen, en
 * het werk de deur uit. Die stonden verspreid over twee tabbladen plus een knop
 * in de hoek — je moest weten waar alles zat en in welke volgorde.
 *
 * Hier staan ze onder elkaar, met per stap één handeling. De afrondknop werkt
 * pas als beide stappen af zijn; tot die tijd zegt hij wat er nog mist.
 */

const FULFILMENT = [
  { value: 'shipped',   label: 'Shipped (post / courier)' },
  { value: 'delivered', label: 'Delivered in person' },
  { value: 'collected', label: 'Collected by the client' },
  { value: 'transport', label: 'Art handler / transport' },
]

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function OrderCompletion(props: { documentId?: string }) {
  // Hook onvoorwaardelijk aanroepen: de documentId uit props gaat vóór, maar
  // useFormValue moet elke render draaien.
  const formId = (useFormValue(['_id']) as string | undefined) ?? ''
  const id = props.documentId ?? formId.replace(/^drafts\./, '')
  const { patch, publish } = useDocumentOperation(id, 'order')

  const status = useFormValue(['status']) as string | undefined
  const fulfilment = useFormValue(['fulfilment']) as string | undefined
  const shippedAt = useFormValue(['shippedAt']) as string | undefined
  const [busy, setBusy] = useState(false)

  const paid = status === 'paid'
  const method = fulfilment && fulfilment !== 'undecided' ? fulfilment : null
  // De gekozen manier ís de overdracht. De datum is een detail dat je mag
  // corrigeren, geen tweede voorwaarde — anders vinkt het paneel niets af als
  // je de manier op de Shipping-tab kiest.
  const sent = !!method
  const closed = status === 'cancelled' || status === 'refunded'
  const complete = paid && sent

  function apply(patches: { set?: Record<string, unknown>; unset?: string[] }) {
    setBusy(true)
    patch.execute([patches])
    // Meteen publiceren: een concept verandert niets aan de lijsten waar de
    // galerie naar kijkt, en dat is precies waar de verwarring vandaan kwam.
    setTimeout(() => { publish.execute(); setBusy(false) }, 120)
  }

  const box: React.CSSProperties = {
    border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
    background: '#fff', fontSize: 14,
  }
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
  }
  const btn = (primary?: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', cursor: busy ? 'wait' : 'pointer',
    border: primary ? 'none' : '1.5px solid #e5e7eb',
    background: primary ? '#111' : '#fff',
    color: primary ? '#fff' : '#374151',
    whiteSpace: 'nowrap',
  })
  const tick = (done: boolean) => (
    <span style={{
      flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700,
      background: done ? '#059669' : '#f3f4f6',
      color: done ? '#fff' : '#9ca3af',
      border: done ? 'none' : '1.5px solid #e5e7eb',
    }}>{done ? '✓' : ''}</span>
  )

  if (closed) {
    return (
      <div style={{ ...box, padding: '14px 16px', color: '#6b7280' }}>
        This order is {status === 'cancelled' ? 'cancelled' : 'refunded'}. Nothing left to do.
      </div>
    )
  }

  return (
    <div style={box}>
      {/* ── Stap 1: betaling ── */}
      <div style={row}>
        {tick(paid)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: paid ? '#111' : '#374151' }}>Payment</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {paid ? 'Received' : 'Not received yet'}
          </div>
        </div>
        {!paid && (
          <button style={btn(true)} disabled={busy} onClick={() => apply({ set: { status: 'paid' } })}>
            Mark as paid
          </button>
        )}
        {paid && (
          <button style={btn()} disabled={busy} onClick={() => apply({ set: { status: 'awaiting-payment' } })}>
            Undo
          </button>
        )}
      </div>

      {/* ── Stap 2: het werk de deur uit ── */}
      <div style={{ ...row, alignItems: 'flex-start' }}>
        {tick(sent)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: sent ? '#111' : '#374151' }}>Handover</div>
          {sent ? (
            // Zonder datum niet zwijgen, maar wijzen waar hij hoort. Anders
            // lijkt de regel af terwijl de details nog ontbreken.
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {FULFILMENT.find(f => f.value === method)?.label}
              {shippedAt
                ? ` · ${fmt(shippedAt)}`
                : ' — add the date and tracking under Shipping'}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                Still in the studio
              </div>
              {/* Alleen de manier vastleggen. Geen datum van vandaag erbij:
                  een order wordt zelden geregistreerd op het moment dat de
                  klant het werk meeneemt, dus die datum zou verzonnen zijn. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FULFILMENT.map(f => (
                  <button
                    key={f.value}
                    disabled={busy}
                    onClick={() => apply({ set: { fulfilment: f.value } })}
                    style={{
                      ...btn(),
                      borderColor: method === f.value ? '#111' : '#e5e7eb',
                      fontWeight: method === f.value ? 700 : 500,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {sent && (
          // Terugdraaien is unset, geen set: een veld op undefined zetten laat
          // Sanity ongemoeid, waardoor de knop niets leek te doen.
          <button
            style={btn()}
            disabled={busy}
            onClick={() => apply({ unset: ['shippedAt'], set: { fulfilment: 'undecided' } })}
          >
            Undo
          </button>
        )}
      </div>

      {/* ── Afronding ── */}
      <div style={{
        padding: '14px 16px',
        background: complete ? '#ecfdf5' : '#f9fafb',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, fontSize: 13, color: complete ? '#059669' : '#9ca3af' }}>
          {complete
            ? '✓ Complete — this order has moved to Archive.'
            : `Waiting for ${[!paid && 'payment', !sent && 'handover'].filter(Boolean).join(' and ')}.`}
        </div>
      </div>
    </div>
  )
}

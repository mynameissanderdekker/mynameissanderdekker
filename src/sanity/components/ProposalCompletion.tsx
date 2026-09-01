'use client'

import React, { useState } from 'react'
import { useFormValue, useDocumentOperation } from 'sanity'
import { useListClient } from './useListClient'
import { PROPOSAL_HANDOFF_KEY } from './ProposalToSale'

/**
 * Eén paneel bovenaan de offerte, zelfde vorm als OrderCompletion.
 *
 * Een offerte doorloopt drie dingen: hij gaat naar de klant, de klant reageert,
 * en bij een ja wordt het een verkoop. Die stonden verspreid over een
 * status-radio, een vervaldatum en twee losse knopvelden onderaan het
 * formulier — je moest de volgorde kennen om te weten wat je nu moest doen.
 *
 * `status` is het enige veld dat de uitkomst bepaalt. Net als bij een order
 * geldt: één veld beslist, de rest is detail.
 */

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function ProposalCompletion() {
  const rawId = useFormValue(['_id']) as string | undefined
  const id = (rawId ?? '').replace(/^drafts\./, '')
  const { patch, publish } = useDocumentOperation(id, 'proposal')
  const client = useListClient()

  const status = useFormValue(['status']) as string | undefined
  const expiryDate = useFormValue(['expiryDate']) as string | undefined
  const proposalNumber = useFormValue(['proposalNumber']) as string | undefined
  const items = useFormValue(['items']) as unknown[] | undefined
  const contact = useFormValue(['contact']) as { _ref?: string } | undefined
  const [busy, setBusy] = useState(false)

  const itemCount = items?.length ?? 0
  const sent = status === 'sent' || status === 'accepted' || status === 'declined' || status === 'expired'
  const answered = status === 'accepted' || status === 'declined'
  const accepted = status === 'accepted'
  const declined = status === 'declined'
  // Verlopen is een afgeleide, geen aparte toestand om handmatig bij te houden:
  // een datum in het verleden zonder antwoord is verlopen.
  const overdue = !!expiryDate && !answered && expiryDate < today()

  function apply(set: Record<string, unknown>) {
    setBusy(true)
    patch.execute([{ set }])
    setTimeout(() => { publish.execute(); setBusy(false) }, 120)
  }

  /**
   * Versturen, met een nummer erbij als dat er nog niet is.
   *
   * Het nummer kwam alleen van de knop "Genereer nummer" op het veld zelf.
   * Vergat iemand die, dan ging de offerte naamloos de deur uit en viel de
   * koppeling met de factuur stil weg: `/api/manual-sale` laat de factuur de
   * reeks van de offerte volgen (PROP-<prefix>-26-003 → <prefix>-26-003), maar
   * zonder nummer valt hij terug op het eerstvolgende vrije. Belt de klant
   * over "offerte 003", dan is er niets te vinden.
   *
   * Versturen is het moment waarop het nummer moet bestaan — daarvoor is een
   * offerte een klad, daarna een stuk waar de klant naar verwijst.
   */
  async function markSent() {
    setBusy(true)
    try {
      let number = proposalNumber
      if (!number) {
        const token = (client as unknown as { config?: () => { token?: string } }).config?.()?.token ?? ''
        const res = await fetch('/api/admin/generate-number?type=proposal', {
          headers: { 'x-sanity-token': token },
        })
        if (res.ok) number = (await res.json()).number
      }
      patch.execute([{ set: { status: 'sent', ...(number ? { proposalNumber: number } : {}) } }])
      setTimeout(() => { publish.execute(); setBusy(false) }, 120)
    } catch {
      // Lukt het nummer niet, dan blijft versturen wel mogelijk — een offerte
      // tegenhouden om een ontbrekend volgnummer helpt niemand.
      apply({ status: 'sent' })
    }
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
  const tick = (done: boolean, mark = '✓', color = '#059669') => (
    <span style={{
      flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700,
      background: done ? color : '#f3f4f6',
      color: done ? '#fff' : '#9ca3af',
      border: done ? 'none' : '1.5px solid #e5e7eb',
    }}>{done ? mark : ''}</span>
  )

  // Zonder klant of werken valt er niets te versturen — dat eerst zeggen in
  // plaats van knoppen tonen die stukloven.
  const blocking = !id ? 'Save the proposal first.'
    : !contact?._ref ? 'Link a client to this proposal first.'
    : itemCount === 0 ? 'Add artworks to this proposal first.'
    : null
  if (blocking) {
    return <div style={{ ...box, padding: '14px 16px', color: '#6b7280' }}>{blocking}</div>
  }

  async function toSale() {
    setBusy(true)
    try {
      if (status !== 'accepted') {
        await client.patch(id).set({ status: 'accepted' }).commit().catch(() => {})
      }
      sessionStorage.setItem(
        PROPOSAL_HANDOFF_KEY,
        JSON.stringify({ proposalId: id, proposalNumber: proposalNumber ?? null })
      )
      window.location.href = '/studio/structure/register-sale'
    } catch {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      {/* ── Stap 1: naar de klant ── */}
      <div style={row}>
        {tick(sent)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>Sent to client</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {sent
              ? (expiryDate ? `Valid until ${fmt(expiryDate)}` : 'No expiry date')
              : 'Still a draft — the client cannot see it yet'}
          </div>
        </div>
        {!sent && (
          <button style={btn(true)} disabled={busy} onClick={markSent}>
            Mark as sent
          </button>
        )}
        {sent && !answered && (
          <button style={btn()} disabled={busy} onClick={() => apply({ status: 'draft' })}>
            Undo
          </button>
        )}
      </div>

      {/* ── Stap 2: het antwoord ── */}
      <div style={row}>
        {tick(answered, declined ? '✗' : '✓', declined ? '#9ca3af' : '#059669')}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>Client response</div>
          <div style={{ fontSize: 12, color: overdue && !answered ? '#b45309' : '#9ca3af' }}>
            {accepted ? 'Accepted'
              : declined ? 'Declined'
              : !sent ? 'Send it first'
              : overdue ? `Expired on ${fmt(expiryDate)} — follow up or extend the date`
              : 'Waiting for the client'}
          </div>
        </div>
        {sent && !answered && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={btn(true)} disabled={busy} onClick={() => apply({ status: 'accepted' })}>
              Accepted
            </button>
            <button style={btn()} disabled={busy} onClick={() => apply({ status: 'declined' })}>
              Declined
            </button>
          </div>
        )}
        {answered && (
          <button style={btn()} disabled={busy} onClick={() => apply({ status: 'sent' })}>
            Undo
          </button>
        )}
      </div>

      {/* ── Stap 3: de verkoop ── */}
      <div style={{
        padding: '14px 16px',
        background: accepted ? '#ecfdf5' : '#f9fafb',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, fontSize: 13, color: accepted ? '#059669' : '#9ca3af' }}>
          {accepted
            ? 'Accepted — turn it into a sale with the agreed works and prices.'
            : declined ? 'Declined. Nothing left to do.'
            : 'A sale can be created once the client has accepted.'}
        </div>
        {accepted && (
          <button style={btn(true)} disabled={busy} onClick={toSale}>
            {busy ? 'One moment…' : 'Create sale →'}
          </button>
        )}
      </div>
    </div>
  )
}

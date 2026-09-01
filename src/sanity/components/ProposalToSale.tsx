'use client'

import React, { useState } from 'react'
import { useFormValue } from 'sanity'
import { useListClient } from './useListClient'

/**
 * Eén knop op het offertedocument: "Verkoop maken van deze offerte".
 *
 * Zet contact, werken en prijzen klaar in de verkooptool, zodat er niets hoeft
 * te worden overgetypt — daar ontstaan de verschillen tussen wat de klant is
 * beloofd en wat er op de factuur komt.
 *
 * De overdracht loopt via sessionStorage: de Studio-tool draait in dezelfde
 * browsertab, en een URL-parameter zou het offertenummer zichtbaar maken in de
 * adresbalk zonder dat dat iets toevoegt.
 */

export const PROPOSAL_HANDOFF_KEY = 'proposal-to-sale'

export function ProposalToSale() {
  const rawId = useFormValue(['_id']) as string | undefined
  const proposalNumber = useFormValue(['proposalNumber']) as string | undefined
  const status = useFormValue(['status']) as string | undefined
  const items = useFormValue(['items']) as unknown[] | undefined
  const contact = useFormValue(['contact']) as { _ref?: string } | undefined
  const client = useListClient()
  const [busy, setBusy] = useState(false)

  const id = rawId?.replace(/^drafts\./, '')
  const itemCount = items?.length ?? 0

  const box: React.CSSProperties = {
    padding: '12px 16px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    color: '#6b7280',
  }

  if (!id) return <div style={box}>Save the proposal first.</div>
  if (!contact?._ref) return <div style={box}>Link a contact to this proposal first.</div>
  if (itemCount === 0) return <div style={box}>Add artworks to this proposal first.</div>

  async function go() {
    setBusy(true)
    try {
      // Een geaccepteerde offerte omzetten betekent dat hij is geaccepteerd —
      // dat hoeft de galerie niet ook nog handmatig te doen.
      if (status !== 'accepted') {
        await client.patch(id!).set({ status: 'accepted' }).commit().catch(() => {})
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
    <div style={{ ...box, color: '#374151' }}>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        style={{
          padding: '9px 18px',
          background: busy ? '#9ca3af' : '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: busy ? 'wait' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {busy ? 'One moment…' : '→ Create a sale from this proposal'}
      </button>
      <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.6, color: '#6b7280' }}>
        Opens the sale tool with the client and {itemCount === 1 ? 'the work' : `all ${itemCount} works`} uit
        this proposal already filled in — including the agreed prices.
        {proposalNumber
          ? <> The invoice will get number <strong>{proposalNumber.replace(/^PROP-/, '')}</strong>, so the proposal and
            the invoice stay together.</>
          : <> Generate a proposal number above first, then the invoice gets the same number.</>}
        {status !== 'accepted' && <> De status gaat automatisch op <em>Accepted</em>.</>}
      </p>
    </div>
  )
}

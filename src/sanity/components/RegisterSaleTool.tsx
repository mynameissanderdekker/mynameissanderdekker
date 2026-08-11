'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useClient } from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactResult {
  _id: string
  firstName: string
  lastName: string
  email: string
  company?: string
}

interface ArtworkResult {
  _id: string
  title: string
  year?: number
  medium?: string
  category?: string
  editionTotal?: number
  editionAP?: number
  priceExclVAT?: number
  vatRate?: number
}

interface CartItem {
  artwork: ArtworkResult
  copyNumber: string      // '' for books/no-edition
  priceExcl: number
  vatRate: number
  availableEditions: string[]  // pre-computed available slots
}

type Step = 1 | 2 | 3
type SaleMode = 'make' | 'register'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PUBLICATION_CATEGORIES = ['book', 'Zine', 'zine', 'publication']

function isPublication(artwork: ArtworkResult) {
  return !artwork.editionTotal || PUBLICATION_CATEGORIES.includes(artwork.category ?? '')
}

function generateInvoiceNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `SD-${y}${m}-${rand}`
}

const soldViaOptions = [
  { value: 'direct',  label: 'Direct (studio/website)' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'artfair', label: 'Art fair' },
  { value: 'other',   label: 'Other' },
]

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  wrap:        { padding: '32px 40px', maxWidth: 720, fontFamily: 'system-ui, sans-serif', color: '#101112' } as React.CSSProperties,
  h1:          { fontWeight: 600, fontSize: 22, margin: '0 0 4px' } as React.CSSProperties,
  sub:         { fontSize: 13, color: '#6b7280', margin: '0 0 32px' } as React.CSSProperties,
  card:        { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px', marginBottom: 16 } as React.CSSProperties,
  label:       { display: 'block', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: 4 },
  inp:         { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
  btnPrimary:  { padding: '8px 22px', background: '#101112', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' } as React.CSSProperties,
  btnSecondary:{ padding: '8px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
  btnSmall:    { padding: '4px 10px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' } as React.CSSProperties,
  grid3:       { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px' } as React.CSSProperties,
  resultRow:   { padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13 } as React.CSSProperties,
  selected:    { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '9px 12px', fontSize: 13, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegisterSaleTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [saleMode, setSaleMode] = useState<SaleMode>('make')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [step, setStep] = useState<Step>(1)

  // Step 1 — contact
  const [contactQuery, setContactQuery]       = useState('')
  const [contactResults, setContactResults]   = useState<ContactResult[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const [useNew, setUseNew]                   = useState(false)
  const [newContact, setNewContact]           = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', vatNumber: '', street: '', postalCode: '', city: '', country: '',
  })

  // Step 2 — cart
  const [artworkQuery, setArtworkQuery]     = useState('')
  const [artworkResults, setArtworkResults] = useState<ArtworkResult[]>([])
  const [pendingArtwork, setPendingArtwork] = useState<ArtworkResult | null>(null)
  const [pendingEdition, setPendingEdition] = useState('')
  const [pendingEditions, setPendingEditions] = useState<string[]>([])
  const [loadingEditions, setLoadingEditions] = useState(false)
  const [cart, setCart]                     = useState<CartItem[]>([])
  const [soldVia, setSoldVia]               = useState('direct')
  const [saleDate, setSaleDate]             = useState(new Date().toISOString().slice(0, 10))

  // Step 3 — invoice
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber)
  const [termDays, setTermDays]           = useState('14')
  const [notes, setNotes]                 = useState('')
  const [sendConf, setSendConf]           = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState<{ invoiceNumber: string; paid: boolean } | null>(null)
  const [error, setError]           = useState('')

  // ── Contact search ──────────────────────────────────────────────────────────

  const searchContacts = useCallback(async (q: string) => {
    if (!q) { setContactResults([]); return }
    const res = await client.fetch<ContactResult[]>(
      `*[_type == "contact" && (firstName match $q || lastName match $q || email match $q)][0...10]{ _id, firstName, lastName, email, company }`,
      { q: `${q}*` }
    )
    setContactResults(res)
  }, [client])

  useEffect(() => {
    const t = setTimeout(() => searchContacts(contactQuery), 150)
    return () => clearTimeout(t)
  }, [contactQuery, searchContacts])

  // ── Artwork search ──────────────────────────────────────────────────────────

  const searchArtworks = useCallback(async (q: string) => {
    if (!q) { setArtworkResults([]); return }
    const res = await client.fetch<ArtworkResult[]>(
      `*[_type == "artwork" && !(_id in path("drafts.**")) && title match $q] | order(year desc) [0...15]{ _id, title, year, medium, category, editionTotal, editionAP, priceExclVAT, vatRate }`,
      { q: `${q}*` }
    )
    setArtworkResults(res)
  }, [client])

  useEffect(() => {
    const t = setTimeout(() => searchArtworks(artworkQuery), 150)
    return () => clearTimeout(t)
  }, [artworkQuery, searchArtworks])

  // ── Load available editions when artwork selected ────────────────────────────

  async function selectPendingArtwork(artwork: ArtworkResult) {
    setPendingArtwork(artwork)
    setArtworkResults([])
    setArtworkQuery(artwork.title)
    setPendingEdition('')

    if (isPublication(artwork)) {
      setPendingEditions([])
      return
    }

    setLoadingEditions(true)
    try {
      // Fetch all sold copy numbers for this artwork
      const soldCopies = await client.fetch<string[]>(
        `*[_type == "contact" && defined(purchases)]{
          "copies": purchases[artwork._ref == $id && defined(copyNumber)].copyNumber
        }[count(copies) > 0].copies[]`,
        { id: artwork._id }
      )

      // Build all possible edition slots: 1/N … N/N + AP 1/M … AP M/N
      const total = artwork.editionTotal ?? 0
      const ap    = artwork.editionAP ?? 0
      const all: string[] = []
      for (let i = 1; i <= total; i++) all.push(`${i}/${total}`)
      for (let i = 1; i <= ap; i++)    all.push(`AP ${i}/${ap}`)

      // Normalize stored copy numbers: "4" → "4/7", "AP 1" → "AP 1/2"
      function normalizeCopy(copy: string): string {
        if (!copy) return copy
        if (copy.includes('/')) return copy            // already "N/M" or "AP N/M"
        const apMatch = copy.match(/^AP\s*(\d+)$/i)
        if (apMatch) return `AP ${apMatch[1]}/${ap}`  // "AP 1" → "AP 1/2"
        const n = parseInt(copy, 10)
        if (!isNaN(n)) return `${n}/${total}`          // "4" → "4/7"
        return copy
      }

      // Filter out already-sold and already-in-cart editions
      const inCart = cart.filter(c => c.artwork._id === artwork._id).map(c => c.copyNumber)
      const sold   = new Set([...soldCopies.map(normalizeCopy), ...inCart])
      const available = all.filter(e => !sold.has(e))

      setPendingEditions(available)
      if (available.length === 1) setPendingEdition(available[0])
    } finally {
      setLoadingEditions(false)
    }
  }

  // ── Add to cart ─────────────────────────────────────────────────────────────

  function addToCart() {
    if (!pendingArtwork) return
    const item: CartItem = {
      artwork:          pendingArtwork,
      copyNumber:       isPublication(pendingArtwork) ? '' : pendingEdition,
      priceExcl:        pendingArtwork.priceExclVAT ?? 0,
      vatRate:          pendingArtwork.vatRate ?? 9,
      availableEditions: pendingEditions,
    }
    setCart(prev => [...prev, item])
    setPendingArtwork(null)
    setArtworkQuery('')
    setPendingEdition('')
    setPendingEditions([])
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  function updateCartPrice(idx: number, val: string) {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, priceExcl: Number(val) } : item))
  }

  function updateCartVat(idx: number, val: string) {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, vatRate: Number(val) } : item))
  }

  // ── Totals ──────────────────────────────────────────────────────────────────

  const totalExcl = cart.reduce((sum, i) => sum + i.priceExcl, 0)
  const totalIncl = cart.reduce((sum, i) => sum + i.priceExcl * (1 + i.vatRate / 100), 0)
  const totalVat  = totalIncl - totalExcl

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0) return
    setSubmitting(true)
    setError('')

    const paid = saleMode === 'register' || alreadyPaid

    const payload = {
      contactId:  (!useNew && selectedContact?._id) ? selectedContact._id : undefined,
      firstName:  useNew ? newContact.firstName : selectedContact!.firstName,
      lastName:   useNew ? newContact.lastName  : selectedContact!.lastName,
      email:      useNew ? newContact.email      : selectedContact!.email,
      phone:      useNew ? newContact.phone      : undefined,
      company:    useNew ? newContact.company    : selectedContact!.company,
      vatNumber:  useNew ? newContact.vatNumber  : undefined,
      street:     useNew ? newContact.street     : undefined,
      postalCode: useNew ? newContact.postalCode : undefined,
      city:       useNew ? newContact.city       : undefined,
      country:    useNew ? newContact.country    : undefined,
      items: cart.map(i => ({
        artworkId:    i.artwork._id,
        artworkTitle: i.artwork.title,
        artworkYear:  i.artwork.year,
        copyNumber:   i.copyNumber,
        priceExclVAT: i.priceExcl,
        vatRate:      i.vatRate,
      })),
      soldVia,
      saleDate,
      invoiceNumber,
      paymentTermsDays: Number(termDays),
      notes,
      sendConfirmation: sendConf,
      paid,
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanityToken = (client as any).config?.()?.token ?? ''
      const res = await fetch('/api/manual-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sanity-token': sanityToken },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDone({ invoiceNumber: data.invoiceNumber, paid })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function reset() {
    setStep(1); setDone(null); setError('')
    setSaleMode('make'); setAlreadyPaid(false)
    setContactQuery(''); setContactResults([]); setSelectedContact(null); setUseNew(false)
    setNewContact({ firstName: '', lastName: '', email: '', phone: '', company: '', vatNumber: '', street: '', postalCode: '', city: '', country: '' })
    setArtworkQuery(''); setArtworkResults([]); setPendingArtwork(null); setPendingEdition(''); setPendingEditions([])
    setCart([]); setSoldVia('direct'); setSaleDate(new Date().toISOString().slice(0, 10))
    setInvoiceNumber(generateInvoiceNumber()); setTermDays('14'); setNotes(''); setSendConf(true)
  }

  const stepLabels = ['Buyer', 'Items', 'Invoice']
  const canAddToCart = pendingArtwork && (isPublication(pendingArtwork) || pendingEdition)
  const isPaid = saleMode === 'register' || alreadyPaid

  // ── Done screen ─────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={{ ...s.wrap, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontWeight: 500, fontSize: 20, marginBottom: 8 }}>{done.paid ? 'Sale registered' : 'Invoice created'}</h2>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>
          {done.paid
            ? `Invoice ${done.invoiceNumber} created and purchases added to contact.`
            : `Invoice ${done.invoiceNumber} created and awaiting payment.`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href={`/admin/invoices/${done.invoiceNumber}`} target="_blank" rel="noopener noreferrer"
            style={{ ...s.btnSecondary, textDecoration: 'none' }}>View invoice ↗</a>
          <button onClick={reset} style={s.btnPrimary}>{done.paid ? 'Register another sale' : 'Make another sale'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Make or Register a Sale</h1>
      <p style={s.sub}>Manual sale — no Stripe involved</p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', marginBottom: 24, borderRadius: 6, overflow: 'hidden', border: '1px solid #d1d5db', width: 'fit-content' }}>
        {([
          { value: 'make', label: 'Make a sale', sub: 'Create invoice' },
          { value: 'register', label: 'Register a sale', sub: 'Already paid' },
        ] as { value: SaleMode; label: string; sub: string }[]).map((opt, i) => (
          <button key={opt.value} onClick={() => { setSaleMode(opt.value); setAlreadyPaid(false) }}
            style={{
              padding: '9px 20px', textAlign: 'left',
              background: saleMode === opt.value ? '#101112' : '#fff',
              color: saleMode === opt.value ? '#fff' : '#6b7280',
              border: 'none', borderLeft: i > 0 ? '1px solid #d1d5db' : 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              fontWeight: saleMode === opt.value ? 600 : 400,
            }}>
            <div>{opt.label}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{opt.sub}</div>
          </button>
        ))}
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
        {stepLabels.map((lbl, i) => {
          const n = (i + 1) as Step
          return (
            <div key={n} onClick={() => { if (n < step) setStep(n) }}
              style={{
                flex: 1, paddingBottom: 10, textAlign: 'center',
                borderBottom: `2px solid ${n === step ? '#101112' : n < step ? '#9ca3af' : '#e5e7eb'}`,
                color: n === step ? '#101112' : n < step ? '#6b7280' : '#d1d5db',
                fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase',
                cursor: n < step ? 'pointer' : 'default',
              }}>
              {n}. {lbl}
            </div>
          )
        })}
      </div>

      {/* ══ Step 1: Buyer ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[false, true].map(isNew => (
              <button key={String(isNew)} onClick={() => setUseNew(isNew)}
                style={{ padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer', border: '1px solid #d1d5db', background: useNew === isNew ? '#101112' : '#fff', color: useNew === isNew ? '#fff' : '#374151' }}>
                {isNew ? 'New contact' : 'Existing contact'}
              </button>
            ))}
          </div>

          <div style={s.card}>
            {!useNew ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <span style={s.label}>Search contact</span>
                  <input style={s.inp} placeholder="Name or email…" value={contactQuery} autoFocus
                    onChange={e => { setContactQuery(e.target.value); setSelectedContact(null) }} />
                </div>
                {contactResults.length > 0 && !selectedContact && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    {contactResults.map(c => (
                      <div key={c._id} style={s.resultRow}
                        onClick={() => { setSelectedContact(c); setContactResults([]); setContactQuery(`${c.firstName} ${c.lastName}`) }}>
                        <strong>{c.firstName} {c.lastName}</strong>
                        <span style={{ color: '#6b7280', marginLeft: 8 }}>{c.email}</span>
                        {c.company && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>{c.company}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedContact && (
                  <div style={s.selected}>
                    <span><strong>{selectedContact.firstName} {selectedContact.lastName}</strong> <span style={{ color: '#6b7280', marginLeft: 8 }}>{selectedContact.email}</span></span>
                    <button onClick={() => { setSelectedContact(null); setContactQuery('') }}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                )}
              </>
            ) : (
              <div style={s.grid2}>
                {([
                  ['firstName','First name *'],['lastName','Last name *'],['email','Email *'],
                  ['phone','Phone'],['company','Company'],['vatNumber','BTW number'],
                  ['street','Street'],['postalCode','Postal code'],['city','City'],['country','Country (NL, BE…)'],
                ] as [keyof typeof newContact, string][]).map(([field, lbl]) => (
                  <div key={field} style={field === 'street' || field === 'email' ? { gridColumn: '1 / -1' } : {}}>
                    <span style={s.label}>{lbl}</span>
                    <input style={s.inp} value={newContact[field]} type={field === 'email' ? 'email' : 'text'}
                      onChange={e => setNewContact(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setStep(2)}
            style={{ ...s.btnPrimary, opacity: (useNew ? !newContact.firstName || !newContact.email : !selectedContact) ? 0.4 : 1 }}
            disabled={useNew ? !newContact.firstName || !newContact.email : !selectedContact}>
            Next →
          </button>
        </>
      )}

      {/* ══ Step 2: Items ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          {/* Search + add */}
          <div style={s.card}>
            <div style={{ marginBottom: 12 }}>
              <span style={s.label}>Add artwork or publication</span>
              <input style={s.inp} placeholder="Search by title…" value={artworkQuery} autoFocus
                onChange={e => { setArtworkQuery(e.target.value); setPendingArtwork(null); setPendingEdition(''); setPendingEditions([]) }} />
            </div>

            {/* Search results */}
            {artworkResults.length > 0 && !pendingArtwork && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                {artworkResults.map(a => (
                  <div key={a._id} style={s.resultRow} onClick={() => selectPendingArtwork(a)}>
                    <strong>{a.title}</strong>
                    {a.year && <span style={{ color: '#6b7280', marginLeft: 8 }}>{a.year}</span>}
                    {a.editionTotal
                      ? <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>Ed. {a.editionTotal}{a.editionAP ? ` + ${a.editionAP} AP` : ''}</span>
                      : <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>No edition</span>
                    }
                    {a.priceExclVAT && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>€{a.priceExclVAT.toLocaleString('nl-NL')}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Pending item: edition picker + add button */}
            {pendingArtwork && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <strong>{pendingArtwork.title}</strong>
                    {pendingArtwork.year && <span style={{ color: '#6b7280', marginLeft: 8 }}>{pendingArtwork.year}</span>}
                    {pendingArtwork.medium && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12, fontStyle: 'italic' }}>{pendingArtwork.medium}</span>}
                  </div>
                  <button onClick={() => { setPendingArtwork(null); setArtworkQuery(''); setPendingEditions([]) }}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>

                {/* Edition selector — only for non-publications */}
                {!isPublication(pendingArtwork) && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={s.label}>Edition</span>
                    {loadingEditions ? (
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Loading available editions…</p>
                    ) : pendingEditions.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>No editions available — all sold.</p>
                    ) : (
                      <select style={{ ...s.inp, width: 'auto' }} value={pendingEdition} onChange={e => setPendingEdition(e.target.value)}>
                        <option value="">Select edition…</option>
                        {pendingEditions.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    )}
                  </div>
                )}

                {isPublication(pendingArtwork) && (
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>Publication — no edition number required.</p>
                )}

                <button onClick={addToCart} disabled={!canAddToCart}
                  style={{ ...s.btnPrimary, padding: '6px 16px', fontSize: 12, opacity: canAddToCart ? 1 : 0.4 }}>
                  + Add to sale
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div style={s.card}>
              <p style={{ ...s.label, marginBottom: 12 }}>Items in this sale ({cart.length})</p>
              {cart.map((item, idx) => (
                <div key={idx} style={{ borderBottom: idx < cart.length - 1 ? '1px solid #f3f4f6' : 'none', paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{item.artwork.title}</strong>
                      {item.artwork.year && <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 13 }}>{item.artwork.year}</span>}
                      {item.copyNumber && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>Ed. {item.copyNumber}</span>}
                    </div>
                    <button onClick={() => removeFromCart(idx)}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14 }}>Remove</button>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <span style={s.label}>Price excl. BTW (€)</span>
                      <input style={s.inp} type="number" min="0" step="0.01" value={item.priceExcl}
                        onChange={e => updateCartPrice(idx, e.target.value)} />
                    </div>
                    <div style={{ width: 100 }}>
                      <span style={s.label}>BTW %</span>
                      <select style={s.inp} value={item.vatRate} onChange={e => updateCartVat(idx, e.target.value)}>
                        <option value="0">0% — Reverse charge</option>
                        <option value="9">9% — Low rate</option>
                        <option value="21">21% — Standard rate</option>
                      </select>
                    </div>
                    <div style={{ width: 120, textAlign: 'right', paddingTop: 18 }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>
                        €{(item.priceExcl * (1 + item.vatRate / 100)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })} incl.
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Cart total */}
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ color: '#6b7280', marginBottom: 2 }}>Excl. BTW: €{totalExcl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
                  <div style={{ color: '#6b7280', marginBottom: 6 }}>BTW: €{totalVat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Total: €{totalIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          )}

          {/* Sale meta */}
          {cart.length > 0 && (
            <div style={{ ...s.card, marginBottom: 16 }}>
              <div style={s.grid2}>
                <div>
                  <span style={s.label}>Sale date</span>
                  <input style={s.inp} type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
                </div>
                <div>
                  <span style={s.label}>Sold via</span>
                  <select style={s.inp} value={soldVia} onChange={e => setSoldVia(e.target.value)}>
                    {soldViaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={s.btnSecondary}>← Back</button>
            <button onClick={() => setStep(3)} disabled={cart.length === 0}
              style={{ ...s.btnPrimary, opacity: cart.length === 0 ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        </>
      )}

      {/* ══ Step 3: Invoice ════════════════════════════════════════════════════ */}
      {step === 3 && (
        <>
          {/* Summary */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 5, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{useNew ? `${newContact.firstName} ${newContact.lastName}` : `${selectedContact?.firstName} ${selectedContact?.lastName}`}</strong>
            {' — '}
            {cart.map(i => i.artwork.title).join(', ')}
          </div>

          <div style={s.card}>
            <div style={s.grid3}>
              <div>
                <span style={s.label}>Invoice number</span>
                <input style={s.inp} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              {!isPaid && (
                <div>
                  <span style={s.label}>Payment terms (days)</span>
                  <input style={s.inp} type="number" min="0" value={termDays} onChange={e => setTermDays(e.target.value)} />
                </div>
              )}
              <div />
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={s.label}>Notes (on invoice)</span>
                <textarea style={{ ...s.inp, resize: 'vertical' } as React.CSSProperties} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              {saleMode === 'make' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer',
                    color: '#374151', padding: '10px 14px', borderRadius: 4,
                    border: `1px solid ${alreadyPaid ? '#bbf7d0' : '#e5e7eb'}`,
                    background: alreadyPaid ? '#f0fdf4' : '#fff',
                  }}>
                    <input type="checkbox" checked={alreadyPaid} onChange={e => setAlreadyPaid(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    <span>
                      <strong style={{ fontWeight: 500 }}>Already paid</strong>
                      <span style={{ color: '#9ca3af', marginLeft: 6 }}>— register immediately instead of sending an invoice</span>
                    </span>
                  </label>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="sendconf" checked={sendConf} onChange={e => setSendConf(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                <label htmlFor="sendconf" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                  {isPaid ? 'Send confirmation email to buyer' : 'Send invoice by email to buyer'}
                </label>
              </div>
            </div>
          </div>

          {/* Invoice total recap */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 5, padding: '14px 16px', marginBottom: 16, fontSize: 13 }}>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', marginBottom: 4 }}>
                <span>{item.artwork.title}{item.copyNumber ? ` — Ed. ${item.copyNumber}` : ''}</span>
                <span>€{item.priceExcl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })} excl.</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
              <span>Total incl. BTW</span>
              <span>€{totalIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(2)} style={s.btnSecondary}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ ...s.btnPrimary, opacity: submitting ? 0.5 : 1 }}>
              {submitting ? 'Saving…' : isPaid ? 'Register sale' : 'Create invoice'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

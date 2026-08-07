'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useClient } from 'sanity'

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
  editionTotal?: number
  editionAP?: number
  priceExclVAT?: number
  vatRate?: number
}

type Step = 1 | 2 | 3

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

const s = {
  wrap: { padding: '32px 40px', maxWidth: 680, fontFamily: 'system-ui, sans-serif', color: '#101112' } as React.CSSProperties,
  h1: { fontWeight: 600, fontSize: 22, margin: '0 0 4px' } as React.CSSProperties,
  sub: { fontSize: 13, color: '#6b7280', margin: '0 0 32px' } as React.CSSProperties,
  steps: { display: 'flex', gap: 0, marginBottom: 28 } as React.CSSProperties,
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px', marginBottom: 16 } as React.CSSProperties,
  label: { display: 'block', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: 4 },
  inp: { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
  btnPrimary: { padding: '8px 22px', background: '#101112', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em' } as React.CSSProperties,
  btnSecondary: { padding: '8px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px' } as React.CSSProperties,
  resultRow: { padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13 } as React.CSSProperties,
  selected: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '9px 12px', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
}

export function RegisterSaleTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [contactQuery, setContactQuery]     = useState('')
  const [contactResults, setContactResults] = useState<ContactResult[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const [useNew, setUseNew] = useState(false)
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', vatNumber: '', street: '', postalCode: '', city: '', country: '' })

  // Step 2
  const [artworkQuery, setArtworkQuery]     = useState('')
  const [artworkResults, setArtworkResults] = useState<ArtworkResult[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkResult | null>(null)
  const [copyNumber, setCopyNumber] = useState('')
  const [soldVia, setSoldVia]       = useState('direct')
  const [saleDate, setSaleDate]     = useState(new Date().toISOString().slice(0, 10))

  // Step 3
  const [priceExcl, setPriceExcl]         = useState('')
  const [vatRate, setVatRate]             = useState('9')
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber)
  const [termDays, setTermDays]           = useState('14')
  const [notes, setNotes]                 = useState('')
  const [sendConf, setSendConf]           = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState<string | null>(null)
  const [error, setError]           = useState('')

  // Contact search
  const searchContacts = useCallback(async (q: string) => {
    if (q.length < 2) { setContactResults([]); return }
    const res = await client.fetch<ContactResult[]>(
      `*[_type == "contact" && (firstName match $q || lastName match $q || email match $q)][0...10]{ _id, firstName, lastName, email, company }`,
      { q: `${q}*` }
    )
    setContactResults(res)
  }, [client])

  useEffect(() => {
    const t = setTimeout(() => searchContacts(contactQuery), 300)
    return () => clearTimeout(t)
  }, [contactQuery, searchContacts])

  // Artwork search
  const searchArtworks = useCallback(async (q: string) => {
    if (q.length < 2) { setArtworkResults([]); return }
    const res = await client.fetch<ArtworkResult[]>(
      `*[_type == "artwork" && title match $q][0...15]{ _id, title, year, medium, editionTotal, editionAP, priceExclVAT, vatRate } | order(year desc)`,
      { q: `${q}*` }
    )
    setArtworkResults(res)
  }, [client])

  useEffect(() => {
    const t = setTimeout(() => searchArtworks(artworkQuery), 300)
    return () => clearTimeout(t)
  }, [artworkQuery, searchArtworks])

  // Pre-fill price
  useEffect(() => {
    if (selectedArtwork?.priceExclVAT) setPriceExcl(String(selectedArtwork.priceExclVAT))
    if (selectedArtwork?.vatRate)      setVatRate(String(selectedArtwork.vatRate))
  }, [selectedArtwork])

  async function handleSubmit() {
    if (!selectedArtwork) return
    setSubmitting(true)
    setError('')

    const payload = {
      contactId:    (!useNew && selectedContact?._id) ? selectedContact._id : undefined,
      firstName:    useNew ? newContact.firstName : selectedContact!.firstName,
      lastName:     useNew ? newContact.lastName  : selectedContact!.lastName,
      email:        useNew ? newContact.email      : selectedContact!.email,
      phone:        useNew ? newContact.phone      : undefined,
      company:      useNew ? newContact.company    : selectedContact!.company,
      vatNumber:    useNew ? newContact.vatNumber  : undefined,
      street:       useNew ? newContact.street     : undefined,
      postalCode:   useNew ? newContact.postalCode : undefined,
      city:         useNew ? newContact.city       : undefined,
      country:      useNew ? newContact.country    : undefined,
      artworkId:    selectedArtwork._id,
      artworkTitle: selectedArtwork.title,
      artworkYear:  selectedArtwork.year,
      copyNumber,
      soldVia,
      saleDate,
      priceExclVAT:     Number(priceExcl),
      vatRate:          Number(vatRate),
      invoiceNumber,
      paymentTermsDays: Number(termDays),
      notes,
      sendConfirmation: sendConf,
    }

    try {
      const res = await fetch('/api/manual-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY ?? '',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDone(data.invoiceNumber)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(1); setDone(null); setError('')
    setContactQuery(''); setContactResults([]); setSelectedContact(null); setUseNew(false)
    setNewContact({ firstName: '', lastName: '', email: '', phone: '', company: '', vatNumber: '', street: '', postalCode: '', city: '', country: '' })
    setArtworkQuery(''); setArtworkResults([]); setSelectedArtwork(null)
    setCopyNumber(''); setSoldVia('direct'); setSaleDate(new Date().toISOString().slice(0, 10))
    setPriceExcl(''); setVatRate('9'); setInvoiceNumber(generateInvoiceNumber()); setTermDays('14'); setNotes(''); setSendConf(true)
  }

  const stepLabels = ['Buyer', 'Artwork', 'Invoice']
  const priceIncl = priceExcl ? Number(priceExcl) * (1 + Number(vatRate) / 100) : null
  const vatAmount = priceIncl ? priceIncl - Number(priceExcl) : null

  if (done) {
    return (
      <div style={{ ...s.wrap, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontWeight: 500, fontSize: 20, marginBottom: 8 }}>Sale registered</h2>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>Invoice {done} created and purchase added to contact.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href={`/admin/invoices/${done}`} target="_blank" rel="noopener noreferrer"
            style={{ ...s.btnSecondary, textDecoration: 'none' }}>View invoice ↗</a>
          <button onClick={reset} style={s.btnPrimary}>Register another sale</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Register a sale</h1>
      <p style={s.sub}>Manual sale — no Stripe involved</p>

      {/* Step tabs */}
      <div style={s.steps}>
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

      {/* ── Step 1: Buyer ── */}
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
                    <span><strong>{selectedContact.firstName} {selectedContact.lastName}</strong> <span style={{ color: '#6b7280' }}>{selectedContact.email}</span></span>
                    <button onClick={() => { setSelectedContact(null); setContactQuery('') }}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                )}
              </>
            ) : (
              <div style={s.grid2}>
                {([['firstName','First name *'],['lastName','Last name *'],['email','Email *'],['phone','Phone'],['company','Company'],['vatNumber','VAT number'],['street','Street'],['postalCode','Postal code'],['city','City'],['country','Country (NL, BE…)']] as [keyof typeof newContact, string][]).map(([field, lbl]) => (
                  <div key={field} style={field === 'street' || field === 'email' ? { gridColumn: '1 / -1' } : {}}>
                    <span style={s.label}>{lbl}</span>
                    <input style={s.inp} value={newContact[field]} type={field === 'email' ? 'email' : 'text'}
                      onChange={e => setNewContact(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setStep(2)} style={{ ...s.btnPrimary, opacity: (useNew ? !newContact.firstName || !newContact.email : !selectedContact) ? 0.4 : 1 }}
            disabled={useNew ? !newContact.firstName || !newContact.email : !selectedContact}>
            Next →
          </button>
        </>
      )}

      {/* ── Step 2: Artwork ── */}
      {step === 2 && (
        <>
          <div style={s.card}>
            <div style={{ marginBottom: 12 }}>
              <span style={s.label}>Search artwork</span>
              <input style={s.inp} placeholder="Title…" value={artworkQuery} autoFocus
                onChange={e => { setArtworkQuery(e.target.value); setSelectedArtwork(null) }} />
            </div>
            {artworkResults.length > 0 && !selectedArtwork && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                {artworkResults.map(a => (
                  <div key={a._id} style={s.resultRow}
                    onClick={() => { setSelectedArtwork(a); setArtworkResults([]); setArtworkQuery(a.title) }}>
                    <strong>{a.title}</strong>
                    {a.year && <span style={{ color: '#6b7280', marginLeft: 8 }}>{a.year}</span>}
                    {a.editionTotal && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>Ed. {a.editionTotal}{a.editionAP ? ` + ${a.editionAP} AP` : ''}</span>}
                    {a.priceExclVAT && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12 }}>€{a.priceExclVAT.toLocaleString('nl-NL')}</span>}
                  </div>
                ))}
              </div>
            )}
            {selectedArtwork && (
              <div style={{ ...s.selected, marginBottom: 16 }}>
                <span>
                  <strong>{selectedArtwork.title}</strong>
                  {selectedArtwork.year && <span style={{ color: '#6b7280', marginLeft: 8 }}>{selectedArtwork.year}</span>}
                  {selectedArtwork.medium && <span style={{ color: '#9ca3af', marginLeft: 8, fontSize: 12, fontStyle: 'italic' }}>{selectedArtwork.medium}</span>}
                </span>
                <button onClick={() => { setSelectedArtwork(null); setArtworkQuery('') }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            )}
            <div style={s.grid3}>
              <div>
                <span style={s.label}>Copy number *</span>
                <input style={s.inp} placeholder="e.g. 3/7" value={copyNumber} onChange={e => setCopyNumber(e.target.value)} />
              </div>
              <div>
                <span style={s.label}>Sale date *</span>
                <input style={s.inp} type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
              </div>
              <div>
                <span style={s.label}>Sold via *</span>
                <select style={s.inp} value={soldVia} onChange={e => setSoldVia(e.target.value)}>
                  {soldViaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={s.btnSecondary}>← Back</button>
            <button onClick={() => setStep(3)} style={{ ...s.btnPrimary, opacity: (!selectedArtwork || !copyNumber) ? 0.4 : 1 }}
              disabled={!selectedArtwork || !copyNumber}>Next →</button>
          </div>
        </>
      )}

      {/* ── Step 3: Invoice ── */}
      {step === 3 && (
        <>
          {/* Summary bar */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 5, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            {useNew ? `${newContact.firstName} ${newContact.lastName}` : `${selectedContact?.firstName} ${selectedContact?.lastName}`}
            {' — '}
            <strong>{selectedArtwork?.title}</strong>{selectedArtwork?.year ? `, ${selectedArtwork.year}` : ''} · {copyNumber}
          </div>

          <div style={s.card}>
            <div style={s.grid3}>
              <div style={{ gridColumn: '1 / 3' }}>
                <span style={s.label}>Price excl. VAT (€) *</span>
                <input style={s.inp} type="number" min="0" step="0.01" value={priceExcl} onChange={e => setPriceExcl(e.target.value)} />
              </div>
              <div>
                <span style={s.label}>VAT %</span>
                <select style={s.inp} value={vatRate} onChange={e => setVatRate(e.target.value)}>
                  <option value="0">0%</option>
                  <option value="9">9%</option>
                  <option value="21">21%</option>
                </select>
              </div>

              {priceExcl && (
                <div style={{ gridColumn: '1 / -1', background: '#f9fafb', borderRadius: 4, padding: '10px 14px' }}>
                  {[
                    [`Excl. VAT`, `€${Number(priceExcl).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`],
                    [`VAT ${vatRate}%`, `€${vatAmount!.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`],
                    [`Total incl. VAT`, `€${priceIncl!.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`],
                  ].map(([label, val], i) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: i === 2 ? 14 : 12, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? '#101112' : '#6b7280', borderTop: i === 2 ? '1px solid #e5e7eb' : 'none', paddingTop: i === 2 ? 8 : 0, marginBottom: i < 2 ? 4 : 0 }}>
                      <span>{label}</span><span>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <span style={s.label}>Invoice number</span>
                <input style={s.inp} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <span style={s.label}>Payment terms (days)</span>
                <input style={s.inp} type="number" min="0" value={termDays} onChange={e => setTermDays(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={s.label}>Notes (on invoice)</span>
                <textarea style={{ ...s.inp, resize: 'vertical' } as React.CSSProperties} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="sendconf" checked={sendConf} onChange={e => setSendConf(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                <label htmlFor="sendconf" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Send invoice confirmation email to buyer</label>
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(2)} style={s.btnSecondary}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting || !priceExcl}
              style={{ ...s.btnPrimary, opacity: submitting || !priceExcl ? 0.5 : 1 }}>
              {submitting ? 'Registering…' : 'Confirm sale'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

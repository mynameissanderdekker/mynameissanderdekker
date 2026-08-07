'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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
  editionTotal?: number
  editionAP?: number
  priceExclVAT?: number
  vatRate?: number
  status?: string
}

type Step = 1 | 2 | 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateInvoiceNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `SD-${y}${m}-${rand}`
}

const soldViaOptions = [
  { value: 'direct', label: 'Direct (studio/website)' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'artfair', label: 'Art fair' },
  { value: 'other', label: 'Other' },
]

// ── Shared input style ────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 14,
  border: '1px solid #ddd', borderRadius: 3, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 11, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#888', marginBottom: 4,
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewSalePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1 — contact
  const [contactQuery, setContactQuery] = useState('')
  const [contactResults, setContactResults] = useState<ContactResult[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const [newContact, setNewContact] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', vatNumber: '', street: '', postalCode: '', city: '', country: '',
  })
  const [useNewContact, setUseNewContact] = useState(false)

  // Step 2 — artwork
  const [artworkQuery, setArtworkQuery] = useState('')
  const [artworkResults, setArtworkResults] = useState<ArtworkResult[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkResult | null>(null)
  const [copyNumber, setCopyNumber] = useState('')
  const [soldVia, setSoldVia] = useState<'direct' | 'gallery' | 'artfair' | 'other'>('direct')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))

  // Step 3 — invoice
  const [priceExclVAT, setPriceExclVAT] = useState('')
  const [vatRate, setVatRate] = useState('9')
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber)
  const [paymentTermsDays, setPaymentTermsDays] = useState('14')
  const [notes, setNotes] = useState('')
  const [sendConfirmation, setSendConfirmation] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ invoiceNumber: string; contactId: string } | null>(null)
  const [error, setError] = useState('')

  // ── Contact search ──────────────────────────────────────────────────────────

  const searchContacts = useCallback(async (q: string) => {
    if (q.length < 2) { setContactResults([]); return }
    const res = await fetch(`/api/admin/search-contacts?q=${encodeURIComponent(q)}`)
    if (res.ok) setContactResults(await res.json())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchContacts(contactQuery), 300)
    return () => clearTimeout(t)
  }, [contactQuery, searchContacts])

  // ── Artwork search ──────────────────────────────────────────────────────────

  const searchArtworks = useCallback(async (q: string) => {
    if (q.length < 2) { setArtworkResults([]); return }
    const res = await fetch(`/api/admin/search-artworks?q=${encodeURIComponent(q)}`)
    if (res.ok) setArtworkResults(await res.json())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchArtworks(artworkQuery), 300)
    return () => clearTimeout(t)
  }, [artworkQuery, searchArtworks])

  // ── Pre-fill price when artwork selected ────────────────────────────────────

  useEffect(() => {
    if (selectedArtwork?.priceExclVAT) setPriceExclVAT(String(selectedArtwork.priceExclVAT))
    if (selectedArtwork?.vatRate)      setVatRate(String(selectedArtwork.vatRate))
  }, [selectedArtwork])

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedArtwork) return
    setSubmitting(true)
    setError('')

    const contact = useNewContact ? newContact : selectedContact
    if (!contact) { setError('No contact selected'); setSubmitting(false); return }

    const payload = {
      contactId:    (!useNewContact && selectedContact?._id) ? selectedContact._id : undefined,
      firstName:    useNewContact ? newContact.firstName : selectedContact!.firstName,
      lastName:     useNewContact ? newContact.lastName  : selectedContact!.lastName,
      email:        useNewContact ? newContact.email      : selectedContact!.email,
      phone:        useNewContact ? newContact.phone      : undefined,
      company:      useNewContact ? newContact.company    : selectedContact!.company,
      vatNumber:    useNewContact ? newContact.vatNumber  : undefined,
      street:       useNewContact ? newContact.street     : undefined,
      postalCode:   useNewContact ? newContact.postalCode : undefined,
      city:         useNewContact ? newContact.city       : undefined,
      country:      useNewContact ? newContact.country    : undefined,
      artworkId:    selectedArtwork._id,
      artworkTitle: selectedArtwork.title,
      artworkYear:  selectedArtwork.year,
      copyNumber,
      soldVia,
      saleDate,
      priceExclVAT: Number(priceExclVAT),
      vatRate:      Number(vatRate),
      invoiceNumber,
      paymentTermsDays: Number(paymentTermsDays),
      notes,
      sendConfirmation,
    }

    try {
      const res = await fetch('/api/manual-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDone({ invoiceNumber: data.invoiceNumber, contactId: data.contactId })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6,
    padding: '20px 24px', marginBottom: 12,
  }

  // ── Done screen ─────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontWeight: 400, fontSize: 22, marginBottom: 8 }}>Sale registered</h2>
          <p style={{ color: '#666', marginBottom: 32 }}>Invoice {done.invoiceNumber} has been created and the purchase has been added to the contact record.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/admin/invoices/${done.invoiceNumber}`}
              target="_blank"
              style={{ padding: '9px 20px', border: '1px solid #111', borderRadius: 3, fontSize: 13, textDecoration: 'none', color: '#111', letterSpacing: '0.05em' }}
            >
              View invoice
            </a>
            <button
              onClick={() => router.push('/admin/new-sale')}
              style={{ padding: '9px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 3, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              New sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step indicators ─────────────────────────────────────────────────────────

  const stepLabel = ['Buyer', 'Artwork', 'Invoice']

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/admin" style={{ fontSize: 12, color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em' }}>← Admin</a>
          <h1 style={{ fontWeight: 400, fontSize: 24, margin: '12px 0 4px' }}>Register a sale</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Manual sale — no Stripe involved</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {stepLabel.map((lbl, i) => {
            const n = (i + 1) as Step
            const active = n === step
            const done_s = n < step
            return (
              <div
                key={n}
                style={{ flex: 1, textAlign: 'center', paddingBottom: 10,
                  borderBottom: `2px solid ${active ? '#111' : done_s ? '#bbb' : '#e0e0e0'}`,
                  cursor: done_s ? 'pointer' : 'default',
                  color: active ? '#111' : done_s ? '#666' : '#bbb',
                  fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
                onClick={() => { if (done_s) setStep(n) }}
              >
                {n}. {lbl}
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Buyer ── */}
        {step === 1 && (
          <div>
            {/* Toggle new vs existing */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[false, true].map(isNew => (
                <button
                  key={String(isNew)}
                  onClick={() => setUseNewContact(isNew)}
                  style={{
                    padding: '7px 16px', fontSize: 13, borderRadius: 3, cursor: 'pointer',
                    border: '1px solid #ddd',
                    background: useNewContact === isNew ? '#111' : '#fff',
                    color: useNewContact === isNew ? '#fff' : '#333',
                  }}
                >
                  {isNew ? 'New contact' : 'Existing contact'}
                </button>
              ))}
            </div>

            {!useNewContact ? (
              <div style={card}>
                <div style={{ marginBottom: 12 }}>
                  <span style={label}>Search contact</span>
                  <input
                    style={inp} placeholder="Name or email…"
                    value={contactQuery}
                    onChange={e => { setContactQuery(e.target.value); setSelectedContact(null) }}
                    autoFocus
                  />
                </div>
                {contactResults.length > 0 && !selectedContact && (
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    {contactResults.map(c => (
                      <div
                        key={c._id}
                        onClick={() => { setSelectedContact(c); setContactResults([]); setContactQuery(`${c.firstName} ${c.lastName}`) }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}
                      >
                        <strong>{c.firstName} {c.lastName}</strong>
                        <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{c.email}</span>
                        {c.company && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>{c.company}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {selectedContact && (
                  <div style={{ background: '#f9f9f8', border: '1px solid #e0e0e0', borderRadius: 3, padding: '10px 14px', fontSize: 14 }}>
                    <strong>{selectedContact.firstName} {selectedContact.lastName}</strong>
                    <span style={{ color: '#888', marginLeft: 8 }}>{selectedContact.email}</span>
                    {selectedContact.company && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 13 }}>{selectedContact.company}</span>}
                    <button onClick={() => { setSelectedContact(null); setContactQuery('') }} style={{ float: 'right', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13 }}>×</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={card}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  {([
                    ['firstName', 'First name *'],
                    ['lastName', 'Last name *'],
                    ['email', 'Email *'],
                    ['phone', 'Phone'],
                    ['company', 'Company'],
                    ['vatNumber', 'VAT number'],
                    ['street', 'Street + number'],
                    ['postalCode', 'Postal code'],
                    ['city', 'City'],
                    ['country', 'Country (ISO: NL, BE…)'],
                  ] as [keyof typeof newContact, string][]).map(([field, lbl]) => (
                    <div key={field} style={field === 'street' || field === 'email' ? { gridColumn: '1 / -1' } : {}}>
                      <span style={label}>{lbl}</span>
                      <input
                        style={inp}
                        value={newContact[field]}
                        onChange={e => setNewContact(p => ({ ...p, [field]: e.target.value }))}
                        type={field === 'email' ? 'email' : 'text'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={useNewContact
                ? !newContact.firstName || !newContact.lastName || !newContact.email
                : !selectedContact
              }
              style={{
                marginTop: 8, padding: '10px 28px', background: '#111', color: '#fff',
                border: 'none', borderRadius: 3, fontSize: 14, cursor: 'pointer',
                opacity: (useNewContact ? !newContact.firstName || !newContact.email : !selectedContact) ? 0.4 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Step 2: Artwork ── */}
        {step === 2 && (
          <div>
            <div style={card}>
              <div style={{ marginBottom: 12 }}>
                <span style={label}>Search artwork</span>
                <input
                  style={inp} placeholder="Title…"
                  value={artworkQuery}
                  onChange={e => { setArtworkQuery(e.target.value); setSelectedArtwork(null) }}
                  autoFocus
                />
              </div>
              {artworkResults.length > 0 && !selectedArtwork && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                  {artworkResults.map(a => (
                    <div
                      key={a._id}
                      onClick={() => { setSelectedArtwork(a); setArtworkResults([]); setArtworkQuery(a.title) }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}
                    >
                      <strong>{a.title}</strong>
                      {a.year && <span style={{ color: '#888', marginLeft: 8 }}>{a.year}</span>}
                      {a.editionTotal && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>Ed. {a.editionTotal}{a.editionAP ? ` + ${a.editionAP} AP` : ''}</span>}
                      {a.priceExclVAT && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>€{a.priceExclVAT.toLocaleString('nl-NL')}</span>}
                    </div>
                  ))}
                </div>
              )}
              {selectedArtwork && (
                <div style={{ background: '#f9f9f8', border: '1px solid #e0e0e0', borderRadius: 3, padding: '10px 14px', fontSize: 14, marginBottom: 16 }}>
                  <strong>{selectedArtwork.title}</strong>
                  {selectedArtwork.year && <span style={{ color: '#888', marginLeft: 8 }}>{selectedArtwork.year}</span>}
                  {selectedArtwork.medium && <span style={{ color: '#aaa', marginLeft: 8, fontSize: 13, fontStyle: 'italic' }}>{selectedArtwork.medium}</span>}
                  {selectedArtwork.editionTotal && (
                    <span style={{ color: '#aaa', marginLeft: 8, fontSize: 12 }}>
                      Ed. {selectedArtwork.editionTotal}{selectedArtwork.editionAP ? ` + ${selectedArtwork.editionAP} AP` : ''}
                    </span>
                  )}
                  <button onClick={() => { setSelectedArtwork(null); setArtworkQuery('') }} style={{ float: 'right', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13 }}>×</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px' }}>
                <div>
                  <span style={label}>Copy number *</span>
                  <input style={inp} placeholder="e.g. 3/7 or AP 1/2" value={copyNumber} onChange={e => setCopyNumber(e.target.value)} />
                </div>
                <div>
                  <span style={label}>Sale date *</span>
                  <input style={inp} type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} />
                </div>
                <div>
                  <span style={label}>Sold via *</span>
                  <select style={{ ...inp }} value={soldVia} onChange={e => setSoldVia(e.target.value as typeof soldVia)}>
                    {soldViaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ padding: '10px 20px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 3, fontSize: 14, cursor: 'pointer' }}>← Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedArtwork || !copyNumber}
                style={{ padding: '10px 28px', background: '#111', color: '#fff', border: 'none', borderRadius: 3, fontSize: 14, cursor: 'pointer', opacity: (!selectedArtwork || !copyNumber) ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Invoice ── */}
        {step === 3 && (
          <div>
            {/* Summary */}
            <div style={{ ...card, background: '#f9f9f8', marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>
                {useNewContact ? `${newContact.firstName} ${newContact.lastName}` : `${selectedContact?.firstName} ${selectedContact?.lastName}`}
                {(useNewContact ? newContact.company : selectedContact?.company) && (
                  <span style={{ color: '#aaa', marginLeft: 8 }}>{useNewContact ? newContact.company : selectedContact?.company}</span>
                )}
              </p>
              <p style={{ margin: 0, fontSize: 15, color: '#111' }}>
                {selectedArtwork?.title}{selectedArtwork?.year ? `, ${selectedArtwork.year}` : ''} — {copyNumber}
              </p>
            </div>

            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px' }}>
                <div style={{ gridColumn: '1 / 3' }}>
                  <span style={label}>Price excl. VAT (€) *</span>
                  <input style={inp} type="number" min="0" step="0.01" value={priceExclVAT} onChange={e => setPriceExclVAT(e.target.value)} />
                </div>
                <div>
                  <span style={label}>VAT %</span>
                  <select style={{ ...inp }} value={vatRate} onChange={e => setVatRate(e.target.value)}>
                    <option value="0">0%</option>
                    <option value="9">9%</option>
                    <option value="21">21%</option>
                  </select>
                </div>

                {priceExclVAT && (
                  <div style={{ gridColumn: '1 / -1', background: '#f9f9f8', borderRadius: 3, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 4 }}>
                      <span>Excl. VAT</span>
                      <span>€{Number(priceExclVAT).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 4 }}>
                      <span>VAT {vatRate}%</span>
                      <span>€{(Number(priceExclVAT) * Number(vatRate) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#111', fontWeight: 600, borderTop: '1px solid #e0e0e0', paddingTop: 8 }}>
                      <span>Total incl. VAT</span>
                      <span>€{(Number(priceExclVAT) * (1 + Number(vatRate) / 100)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                <div>
                  <span style={label}>Invoice number</span>
                  <input style={inp} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <span style={label}>Payment terms (days)</span>
                  <input style={inp} type="number" min="0" value={paymentTermsDays} onChange={e => setPaymentTermsDays(e.target.value)} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={label}>Notes (shown on invoice)</span>
                  <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="sendconf" checked={sendConfirmation} onChange={e => setSendConfirmation(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="sendconf" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>
                    Send invoice confirmation email to buyer
                  </label>
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#c00', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: '10px 20px', background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 3, fontSize: 14, cursor: 'pointer' }}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !priceExclVAT || !invoiceNumber}
                style={{
                  padding: '10px 28px', background: '#111', color: '#fff',
                  border: 'none', borderRadius: 3, fontSize: 14, cursor: 'pointer',
                  opacity: (submitting || !priceExclVAT) ? 0.5 : 1,
                }}
              >
                {submitting ? 'Registering…' : 'Confirm sale'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import SegmentBuilder, { conditionsToGroq } from './SegmentBuilder'

const GrapesEditor = dynamic(() => import('./GrapesEditor'), { ssr: false })

// ── Built-in segments ─────────────────────────────────────────────────────────
const BUILTIN_SEGMENTS = [
  { value: 'newsletter',  label: '📬 Nieuwsbrief',   filter: `subscribed == true` },
  { value: 'collectors',  label: '🔥 Collectoren',    filter: `type == "collector" && subscribed != false` },
  { value: 'buyers_low',  label: '🟡 Kopers < €500',  filter: `count(purchases[price < 500]) > 0 && subscribed != false` },
  { value: 'galleries',   label: '🏛 Galeries',        filter: `type == "gallery" && subscribed != false` },
  { value: 'all',         label: '📢 Alle contacten',  filter: `defined(email)` },
]

interface CustomSegment {
  _id: string
  name: string
  conditions: { field: string; operator: string; value: string }[]
}

interface SegmentCount { value: string; count: number }

export default function CampaignsPage() {
  const [subject, setSubject]         = useState('')
  const [segment, setSegment]         = useState('newsletter')
  const [counts, setCounts]           = useState<SegmentCount[]>([])
  const [customSegments, setCustom]   = useState<CustomSegment[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [status, setStatus]           = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage]         = useState('')
  const [testEmail, setTestEmail]     = useState('hello@mynameissanderdekker.com')
  const [showConfirm, setShowConfirm] = useState(false)

  const getHtmlRef = useRef<() => string>(() => '')
  const handleEditorReady = useCallback((fn: () => string) => { getHtmlRef.current = fn }, [])

  // ── Load built-in counts + custom segments ────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/segment-counts').then(r => r.json()).then(setCounts).catch(() => {})
    fetch('/api/admin/segments').then(r => r.json()).then(setCustom).catch(() => {})
  }, [])

  // All segments: built-in + custom
  const allSegments = [
    ...BUILTIN_SEGMENTS,
    ...customSegments.map(s => ({
      value: `custom_${s._id}`,
      label: `⭐ ${s.name}`,
      filter: conditionsToGroq(s.conditions),
      _id: s._id,
    })),
  ]

  function countFor(val: string) {
    return counts.find(c => c.value === val)?.count ?? '…'
  }

  // ── Save new custom segment ───────────────────────────────────────────────
  async function saveSegment(name: string, conditions: CustomSegment['conditions']) {
    const res  = await fetch('/api/admin/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, conditions }),
    })
    const doc = await res.json()
    setCustom(prev => [...prev, doc])

    // Fetch count for the new segment
    const filter = conditionsToGroq(conditions)
    fetch('/api/admin/segment-count-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter }),
    })
      .then(r => r.json())
      .then(({ count }) => {
        setCounts(prev => [...prev, { value: `custom_${doc._id}`, count }])
      })
      .catch(() => {})

    setShowBuilder(false)
    setSegment(`custom_${doc._id}`)
  }

  // ── Delete custom segment ─────────────────────────────────────────────────
  async function deleteSegment(id: string) {
    await fetch(`/api/admin/segments/${id}`, { method: 'DELETE' })
    setCustom(prev => prev.filter(s => s._id !== id))
    if (segment === `custom_${id}`) setSegment('newsletter')
  }

  // ── Send test ─────────────────────────────────────────────────────────────
  async function sendTest() {
    if (!subject.trim()) { setMessage('Vul eerst een onderwerp in.'); return }
    const html = getHtmlRef.current()
    if (!html.trim()) { setMessage('De email is nog leeg.'); return }
    setStatus('sending'); setMessage('')
    try {
      const res = await fetch('/api/campaign/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, to: testEmail }),
      })
      if (res.ok) { setStatus('idle'); setMessage(`✅ Test verstuurd naar ${testEmail}`) }
      else throw new Error((await res.json()).error)
    } catch (err) { setStatus('error'); setMessage(`❌ ${err}`) }
  }

  // ── Send campaign ─────────────────────────────────────────────────────────
  async function sendCampaign() {
    if (!subject.trim()) { setMessage('Vul eerst een onderwerp in.'); return }
    const html = getHtmlRef.current()
    if (!html.trim()) { setMessage('De email is nog leeg.'); return }
    setStatus('sending'); setShowConfirm(false); setMessage('')
    try {
      const seg = allSegments.find(s => s.value === segment)
      const res = await fetch('/api/campaign/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, segment, customFilter: seg?.filter }),
      })
      const data = await res.json()
      if (res.ok) { setStatus('sent'); setMessage(`✅ Verstuurd naar ${data.sent} ontvangers`) }
      else throw new Error(data.error)
    } catch (err) { setStatus('error'); setMessage(`❌ ${err}`) }
  }

  const selectedSegment = allSegments.find(s => s.value === segment)
  const recipientCount  = countFor(segment)

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: 13,
    }}>

      {/* ── Left: segments ───────────────────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0, borderRight: '1px solid #e5e5e5',
        background: '#fafafa', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#aaa' }}>
            Doelgroepen
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            title="Nieuw segment"
            style={{
              background: '#111', color: '#fff', border: 'none',
              width: 24, height: 24, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 2, lineHeight: 1,
            }}
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {allSegments.map(s => {
            const isCustom = s.value.startsWith('custom_')
            const customId = isCustom ? s.value.replace('custom_', '') : null
            return (
              <div
                key={s.value}
                style={{
                  display: 'flex', alignItems: 'center',
                  background: segment === s.value ? '#111' : 'transparent',
                  borderLeft: segment === s.value ? '3px solid #111' : '3px solid transparent',
                }}
              >
                <button
                  onClick={() => setSegment(s.value)}
                  style={{
                    flex: 1, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 12px 10px 17px',
                    border: 'none', background: 'transparent',
                    color: segment === s.value ? '#fff' : '#333',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 10,
                    background: segment === s.value ? 'rgba(255,255,255,0.2)' : '#eee',
                    color: segment === s.value ? '#fff' : '#888',
                  }}>
                    {countFor(s.value)}
                  </span>
                </button>
                {isCustom && customId && (
                  <button
                    onClick={() => deleteSegment(customId)}
                    title="Verwijder segment"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: segment === s.value ? 'rgba(255,255,255,0.5)' : '#ccc',
                      padding: '0 12px', fontSize: 14, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e5e5' }}>
          <a
            href="/studio"
            style={{
              display: 'block', marginBottom: 12, fontSize: 12, color: '#555',
              textDecoration: 'none', letterSpacing: 0.5,
            }}
          >
            ← Terug naar Studio
          </a>
          <p style={{ margin: '0 0 2px', fontSize: 11, color: '#aaa' }}>Ingelogd als</p>
          <p style={{ margin: 0, fontSize: 12, color: '#555' }}>Sander Dekker</p>
          <a href="/admin/login" style={{ fontSize: 11, color: '#aaa' }}>Uitloggen</a>
        </div>
      </div>

      {/* ── Center: editor ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          borderBottom: '1px solid #e5e5e5', background: '#fff',
        }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#aaa', flexShrink: 0 }}>
            Sander Dekker — Campagne
          </p>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Onderwerp (verplicht)…"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', fontSize: 14, outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <GrapesEditor onReady={handleEditorReady} />
        </div>
      </div>

      {/* ── Right: send controls ─────────────────────────────────────────── */}
      <div style={{
        width: 260, flexShrink: 0, borderLeft: '1px solid #e5e5e5',
        background: '#fafafa', padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#aaa' }}>
            Geselecteerd segment
          </p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{selectedSegment?.label}</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>{recipientCount} ontvangers</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#aaa' }}>
            Test versturen
          </p>
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #ddd', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={sendTest}
            disabled={status === 'sending'}
            style={{
              padding: '10px', background: '#fff', border: '1px solid #333',
              fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
              cursor: 'pointer', color: '#333',
            }}
          >
            Stuur test
          </button>
        </div>

        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 20 }}>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={status === 'sending' || status === 'sent'}
              style={{
                width: '100%', padding: '14px', background: '#111', color: '#fff',
                border: 'none', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                cursor: status === 'sent' ? 'default' : 'pointer',
                opacity: status === 'sending' ? 0.6 : 1,
              }}
            >
              {status === 'sending' ? 'Versturen…' : status === 'sent' ? '✅ Verstuurd' : 'Verstuur campagne'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#333' }}>
                Stuur naar <strong>{recipientCount} ontvangers</strong>?
              </p>
              <button
                onClick={sendCampaign}
                style={{
                  padding: '12px', background: '#c00', color: '#fff',
                  border: 'none', fontSize: 12, letterSpacing: 1,
                  textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Ja, verstuur
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '10px', background: 'transparent', border: '1px solid #ddd',
                  fontSize: 12, cursor: 'pointer', color: '#666',
                }}
              >
                Annuleer
              </button>
            </div>
          )}
        </div>

        {message && (
          <p style={{ margin: 0, fontSize: 12, color: message.startsWith('✅') ? '#080' : '#c00', lineHeight: 1.5 }}>
            {message}
          </p>
        )}
      </div>

      {/* ── Segment builder modal ─────────────────────────────────────────── */}
      {showBuilder && (
        <SegmentBuilder
          onSave={saveSegment}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  )
}

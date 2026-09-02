'use client'

import { useState, useRef } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const SUBJECTS = [
  { value: 'artwork',    label: 'Artwork enquiry',           desc: 'Interested in purchasing a work' },
  { value: 'interior',  label: 'Interior & corporate art',  desc: 'Art for your space or organisation' },
  { value: 'brand',     label: 'Brand & commercial',        desc: 'Photography for brands or campaigns' },
  { value: 'press',     label: 'Press & media',             desc: 'Interview, publication or feature' },
  { value: 'exhibition',label: 'Exhibition & collaboration', desc: 'Gallery proposal or artist collaboration' },
  { value: 'other',     label: 'Other',                     desc: 'Anything else' },
]

const BUDGET_OPTIONS = [
  'Under €1,000',
  '€1,000 – €5,000',
  '€5,000 – €15,000',
  '€15,000 – €50,000',
  'Over €50,000',
  'To be discussed',
]

const TIMELINE_OPTIONS = [
  'Flexible',
  'Within 1 month',
  '1 – 3 months',
  '3 – 6 months',
  'Over 6 months',
]

export default function ContactPage() {
  const [subject, setSubject]         = useState('')
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [message, setMessage]         = useState('')
  const [newsletter, setNewsletter]   = useState(false)

  // Artwork
  const [artworkInterest, setArtworkInterest] = useState('')

  // Interior / corporate
  const [spaceType, setSpaceType]     = useState('')
  const [budget, setBudget]           = useState('')
  const [timeline, setTimeline]       = useState('')

  // Brand / commercial
  const [company, setCompany]         = useState('')
  const [projectType, setProjectType] = useState('')

  // Press
  const [publication, setPublication] = useState('')
  const [topic, setTopic]             = useState('')

  // Exhibition
  const [venue, setVenue]             = useState('')

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, name, email, phone, message, newsletter,
          turnstileToken,
          artworkInterest, spaceType, budget, timeline,
          company, projectType, publication, topic, venue,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong.')
        turnstileRef.current?.reset()
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again later.')
      turnstileRef.current?.reset()
    }
  }

  const inputCls = 'w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors'
  const labelCls = 'block text-xs tracking-widest uppercase text-gray-400 mb-1.5'

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-normal mb-2">Contact</h1>
      <p className="text-sm text-gray-500 mb-10">
        For artwork enquiries, commercial projects, press or collaborations.
      </p>

      {status === 'success' ? (
        <div className="border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            Thank you for your message.<br />
            I will get back to you as soon as possible.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Subject */}
          <div>
            <p className={labelCls}>What can I help you with? *</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUBJECTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSubject(s.value)}
                  className={`text-left px-4 py-3 border text-sm transition-colors duration-150 ${
                    subject === s.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className="block font-medium">{s.label}</span>
                  <span className={`block text-xs mt-0.5 ${subject === s.value ? 'opacity-70' : 'text-gray-400'}`}>
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject-specific fields */}
          {subject === 'artwork' && (
            <div>
              <label className={labelCls}>Which work or series are you interested in?</label>
              <input
                type="text"
                value={artworkInterest}
                onChange={e => setArtworkInterest(e.target.value)}
                placeholder="E.g. Unleashed Moments, Birds of Paradise, or browse the collection"
                className={inputCls}
              />
            </div>
          )}

          {subject === 'interior' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Type of space</label>
                <input
                  type="text"
                  value={spaceType}
                  onChange={e => setSpaceType(e.target.value)}
                  placeholder="E.g. private home, hotel, office, restaurant"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Budget</label>
                  <select value={budget} onChange={e => setBudget(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {BUDGET_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timeline</label>
                  <select value={timeline} onChange={e => setTimeline(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {TIMELINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {subject === 'brand' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Company / brand *</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="E.g. Acme Studio"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Type of project</label>
                <input
                  type="text"
                  value={projectType}
                  onChange={e => setProjectType(e.target.value)}
                  placeholder="E.g. campaign shoot, lookbook, social content, interior photography"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Budget</label>
                  <select value={budget} onChange={e => setBudget(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {BUDGET_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timeline</label>
                  <select value={timeline} onChange={e => setTimeline(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {TIMELINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {subject === 'press' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Publication or media outlet</label>
                <input
                  type="text"
                  value={publication}
                  onChange={e => setPublication(e.target.value)}
                  placeholder="E.g. Vogue, AD, Het Parool"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Topic or angle</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="E.g. interview, review, feature on a specific series"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {subject === 'exhibition' && (
            <div>
              <label className={labelCls}>Venue or organisation</label>
              <input
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="E.g. gallery name, museum, foundation"
                className={inputCls}
              />
            </div>
          )}

          {/* Contact details — only show after subject is picked */}
          {subject && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  className={inputCls}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={e => setNewsletter(e.target.checked)}
                  className="mt-0.5"
                />
                Keep me updated via the newsletter
              </label>

              {status === 'error' && (
                <p className="text-sm text-red-500">{errorMsg}</p>
              )}

              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={token => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                // Onzichtbaar: geen "verify you are human"-vinkje. Werkt alleen
                // als het widget in Cloudflare ook op Invisible staat.
                // De `action` wordt server-side gecontroleerd; zo hoort een
                // token bij dít formulier en niet bij de nieuwsbrief.
                options={{ size: 'invisible', action: 'contact' }}
              />

              <button
                type="submit"
                disabled={status === 'loading' || !name || !email || !message || !turnstileToken}
                className="self-start border border-black px-8 py-3 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  )
}

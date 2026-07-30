'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterSignup({ className }: { className?: string }) {
  const [email,     setEmail]     = useState('')
  const [firstName, setFirstName] = useState('')
  const [state,     setState]     = useState<State>('idle')
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setError('')

    try {
      const res = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, firstName }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
      } else {
        setState('success')
        setEmail('')
        setFirstName('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className={className}>
        <p style={{ fontSize: 14, color: '#555' }}>
          Thank you &mdash; you&apos;re on the list.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        type="text"
        placeholder="First name (optional)"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        disabled={state === 'loading'}
        style={{
          padding:     '10px 14px',
          fontSize:    14,
          border:      '1px solid #ddd',
          borderRadius: 0,
          outline:     'none',
          background:  'transparent',
        }}
      />
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={state === 'loading'}
        style={{
          padding:     '10px 14px',
          fontSize:    14,
          border:      '1px solid #ddd',
          borderRadius: 0,
          outline:     'none',
          background:  'transparent',
        }}
      />
      {error && (
        <p style={{ margin: 0, fontSize: 12, color: '#c00' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={state === 'loading'}
        style={{
          padding:         '10px 24px',
          fontSize:        12,
          letterSpacing:   '1.5px',
          textTransform:   'uppercase',
          background:      '#111',
          color:           '#fff',
          border:          'none',
          cursor:          state === 'loading' ? 'not-allowed' : 'pointer',
          opacity:         state === 'loading' ? 0.6 : 1,
        }}
      >
        {state === 'loading' ? 'Please wait…' : 'Subscribe'}
      </button>
    </form>
  )
}

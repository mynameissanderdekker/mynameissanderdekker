'use client'

import { useState } from 'react'

interface Props {
  source?: string          // bijv. 'footer', 'innate-curiosity'
  placeholder?: string
  buttonText?: string
  className?: string
}

export default function NewsletterForm({
  source = 'website',
  placeholder = 'Je e-mailadres',
  buttonText = 'Aanmelden',
  className = '',
}: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message ?? 'Je bent ingeschreven.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Er ging iets mis.')
      }
    } catch {
      setStatus('error')
      setMessage('Er ging iets mis. Probeer het later opnieuw.')
    }
  }

  if (status === 'success') {
    return (
      <p className={`newsletter-success ${className}`}>
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`newsletter-form ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === 'loading'}
        className="newsletter-input"
      />
      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="newsletter-button"
      >
        {status === 'loading' ? '...' : buttonText}
      </button>
      {status === 'error' && (
        <p className="newsletter-error">{message}</p>
      )}
    </form>
  )
}

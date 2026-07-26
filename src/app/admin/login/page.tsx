'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(params.get('from') ?? '/admin/campaigns')
      } else {
        setError('Onjuist wachtwoord')
        setLoading(false)
      }
    } catch (err) {
      setError(`Fout: ${err}`)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f3', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <div style={{ background: '#fff', padding: '48px 40px', width: 360 }}>
        <p style={{ margin: '0 0 32px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#999' }}>
          Sander Dekker — Studio
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            autoFocus
            style={{
              padding: '12px 14px', border: '1px solid #ddd', fontSize: 15,
              outline: 'none', borderRadius: 0,
            }}
          />
          {error && <p style={{ margin: 0, fontSize: 13, color: '#c00' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: '13px', background: password ? '#111' : '#ccc',
              color: '#fff', border: 'none', fontSize: 12, letterSpacing: 2,
              textTransform: 'uppercase', cursor: password ? 'pointer' : 'default',
            }}
          >
            {loading ? 'Inloggen…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

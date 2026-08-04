'use client'
import { useState, useEffect } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

export function CookieBanner() {
  const [consent, setConsent] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent')
    if (stored !== null) setConsent(stored === 'true')
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true')
    setConsent(true)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'false')
    setConsent(false)
  }

  return (
    <>
      {consent === true && <GoogleAnalytics gaId="G-TJPFN6X82E" />}

      {consent === null && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111',
          color: '#fff',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          zIndex: 9999,
          fontSize: '13px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <span>
            This site uses Google Analytics to measure visits.{' '}
            <a href="/cookie-policy" style={{ color: '#aaa', textDecoration: 'underline' }}>
              Cookie policy
            </a>
          </span>
          <button
            onClick={accept}
            style={{
              background: '#fff',
              color: '#111',
              border: 'none',
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            Accept
          </button>
          <button
            onClick={decline}
            style={{
              background: 'transparent',
              color: '#aaa',
              border: '1px solid #444',
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            Decline
          </button>
        </div>
      )}
    </>
  )
}

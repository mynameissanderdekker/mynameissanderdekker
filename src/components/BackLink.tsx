'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Terug naar waar je vandaan kwam.
 *
 * De expositie- en beurspagina hadden een vaste link naar `/works`. Kom je uit
 * de CV, uit een project of uit de aankondiging op de homepage, dan zette die
 * je ergens anders neer dan waar je vandaan kwam — en op de webshop, waar je
 * nooit was geweest.
 *
 * Alleen `router.back()` is óók niet goed: wie via een gedeelde link
 * binnenkomt heeft geen geschiedenis op deze site, en dan stuurt de knop hem
 * terug naar Google of naar een lege tab. Daarom: teruggaan als er iets is om
 * naar terug te gaan, anders de opgegeven pagina.
 */
export default function BackLink({
  fallback = '/works',
  fallbackLabel = 'Works',
}: {
  fallback?: string
  fallbackLabel?: string
}) {
  // Server en client moeten dezelfde HTML opleveren, dus pas ná het monteren
  // bepalen we of er geschiedenis is.
  const [kanTerug, setKanTerug] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const zelfdeSite = document.referrer
        ? new URL(document.referrer).origin === window.location.origin
        : false
      setKanTerug(window.history.length > 1 && zelfdeSite)
    } catch {
      setKanTerug(false)
    }
  }, [])

  const className = 'text-xs tracking-widest uppercase text-gray-400 hover:text-black mb-8 inline-block'

  if (!kanTerug) {
    return <Link href={fallback} className={className}>← {fallbackLabel}</Link>
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={className}
      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
    >
      ← Back
    </button>
  )
}

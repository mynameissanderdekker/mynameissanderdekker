'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

export default function CheckoutSuccess() {
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <p className="text-4xl mb-6">✓</p>
      <h1 className="text-2xl font-normal mb-4">Bedankt voor je bestelling!</h1>
      <p className="text-sm text-gray-500 mb-10">
        Je ontvangt een bevestiging per e-mail. Ik neem zo snel mogelijk contact op over de verzending.
      </p>
      <Link
        href="/works"
        className="text-xs tracking-[0.2em] uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
      >
        Terug naar Works
      </Link>
    </div>
  )
}

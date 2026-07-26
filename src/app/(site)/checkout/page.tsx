'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'

function formatPrice(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function CheckoutPage() {
  const { items, total } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Er ging iets mis')

      window.location.href = json.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-normal mb-8">Bestelling bevestigen</h1>

      <div className="bg-[#f8f8f6] p-6 mb-8 text-left">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm mb-2 last:mb-0">
            <span>{item.title}</span>
            <span>{formatPrice(item.priceIncl)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-medium">
          <span>Totaal incl. BTW</span>
          <span>{formatPrice(total())}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-8">
        Je wordt doorgestuurd naar Stripe voor veilig betalen.<br />
        Stripe accepteert iDEAL, creditcard en Bancontact.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-black text-white px-6 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
      >
        {loading ? 'Doorsturen naar Stripe…' : 'Betalen via Stripe →'}
      </button>
    </div>
  )
}

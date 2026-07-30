'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

function formatPrice(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function CartPage() {
  const { items, removeItem, total } = useCartStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">Je winkelmandje is leeg</p>
        <Link
          href="/works"
          className="text-xs tracking-[0.2em] uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
        >
          Terug naar Works
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-normal mb-10">Winkelmandje</h1>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex gap-5 py-6 items-start">
            {/* Thumbnail */}
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-20 h-20 object-contain bg-[#f0eeeb] shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <Link
                href={`/works/${item.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {item.title}
              </Link>
              {item.variantLabel && (
                <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{formatPrice(item.priceIncl)} incl. BTW</p>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-xs tracking-widest uppercase text-gray-400 hover:text-black transition-colors shrink-0"
            >
              Verwijder
            </button>
          </div>
        ))}
      </div>

      {/* Totaal */}
      <div className="border-t border-gray-200 pt-6 mt-2 flex justify-between items-baseline">
        <span className="text-sm text-gray-500">Totaal incl. BTW</span>
        <span className="text-xl font-medium">{formatPrice(total())}</span>
      </div>

      <p className="text-xs text-gray-400 mt-2 mb-8">Verzendkosten worden berekend bij checkout.</p>

      <Link
        href="/checkout"
        className="block w-full text-center bg-black text-white px-6 py-4 text-xs tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors"
      >
        Bestellen →
      </Link>

      <Link
        href="/works"
        className="block text-center mt-4 text-xs tracking-widest uppercase text-gray-400 hover:text-black transition-colors"
      >
        Verder winkelen
      </Link>
    </div>
  )
}

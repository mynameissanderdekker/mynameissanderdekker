'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

function formatPrice(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function CartPage() {
  const { items, removeItem, total, coupon, setCoupon, totalAfterDiscount } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Pre-fill input if coupon already applied
  }, [])

  useEffect(() => {
    if (coupon) setCouponInput(coupon.code)
  }, [coupon])

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

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError(null)

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), orderTotal: total() }),
      })
      const json = await res.json()

      if (json.valid) {
        setCoupon(json)
      } else {
        setCouponError(json.error ?? 'Ongeldige couponcode')
        setCoupon(null)
      }
    } catch {
      setCouponError('Er ging iets mis bij het valideren van de coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setCoupon(null)
    setCouponInput('')
    setCouponError(null)
  }

  const subtotal = total()
  const discount = coupon?.discountAmount ?? 0
  const finalTotal = totalAfterDiscount()

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-normal mb-10">Winkelmandje</h1>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex gap-5 py-6 items-start">
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

      {/* Coupon */}
      <div className="border-t border-gray-100 pt-6 mt-2">
        {coupon ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{coupon.code}</span>
              <span className="text-gray-400 ml-2">
                {coupon.type === 'percentage' ? `${coupon.value}% korting` : `€${coupon.value} korting`}
              </span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs tracking-widest uppercase text-gray-400 hover:text-black transition-colors"
            >
              Verwijder
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder="Couponcode"
              className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
            >
              {couponLoading ? '…' : 'Toepassen'}
            </button>
          </div>
        )}
        {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
      </div>

      {/* Totaal */}
      <div className="border-t border-gray-200 pt-6 mt-4">
        {coupon && (
          <>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Subtotaal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700 mb-3">
              <span>Korting ({coupon.code})</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-500">Totaal incl. BTW</span>
          <span className="text-xl font-medium">{formatPrice(finalTotal)}</span>
        </div>
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

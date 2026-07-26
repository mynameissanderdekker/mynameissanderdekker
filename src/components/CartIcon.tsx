'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'

export default function CartIcon() {
  const items = useCartStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const count = mounted ? items.length : 0

  return (
    <Link href="/cart" aria-label="Winkelmandje" className="relative flex items-center text-black hover:opacity-60 transition-opacity">
      {/* Bag icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>

      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-black text-white text-[10px] font-medium rounded-full flex items-center justify-center px-0.5 leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}

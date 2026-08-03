import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string        // artwork._id, or `${artwork._id}::${optionKey}` when a variant is selected
  slug: string      // for linking back
  title: string
  priceIncl: number // incl. BTW
  imageUrl?: string
  variantLabel?: string // e.g. "1 roll" — set when the artwork has purchase options
}

export interface AppliedCoupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discountAmount: number
  sanityId: string
}

interface CartStore {
  items: CartItem[]
  coupon: AppliedCoupon | null
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
  totalAfterDiscount: () => number
  setCoupon: (coupon: AppliedCoupon | null) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) =>
        set((state) => {
          // Voorkom duplicaten (een editie is uniek)
          if (state.items.find((i) => i.id === item.id)) return state
          return { items: [...state.items, item] }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [], coupon: null }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.priceIncl, 0),

      totalAfterDiscount: () => {
        const { items, coupon } = get()
        const subtotal = items.reduce((sum, item) => sum + item.priceIncl, 0)
        if (!coupon) return subtotal
        return Math.max(0, subtotal - coupon.discountAmount)
      },

      setCoupon: (coupon) => set({ coupon }),
    }),
    { name: 'sander-cart' }
  )
)

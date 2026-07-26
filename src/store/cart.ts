import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string        // artwork._id
  slug: string      // for linking back
  title: string
  priceIncl: number // incl. BTW
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // Voorkom duplicaten (een editie is uniek)
          if (state.items.find((i) => i.id === item.id)) return state
          return { items: [...state.items, item] }
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.priceIncl, 0),
    }),
    { name: 'sander-cart' }
  )
)

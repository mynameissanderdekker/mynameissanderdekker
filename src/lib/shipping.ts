export interface ShippingMethod {
  methodType?: 'flat_rate' | 'free_shipping' | 'local_pickup'
  title?: string
  cost?: number
  freeShippingMinimum?: number
}

export interface ShippingZone {
  _id: string
  zoneName: string
  regions?: string[]
  active?: boolean
  shippingMethods?: ShippingMethod[]
}

/** Zoek de beste zone voor een land, val terug op catch-all zone met ["*"] */
export function resolveShippingZone(country: string, zones: ShippingZone[]): ShippingZone | null {
  const active = zones.filter(z => z.active !== false)
  return active.find(z => z.regions?.includes(country))
    ?? active.find(z => z.regions?.includes('*'))
    ?? null
}

/** Bereken verzendkosten op basis van zone en subtotaal */
export function calculateShippingCost(zone: ShippingZone | null, subtotal: number): number {
  if (!zone) return 0
  const method = zone.shippingMethods?.[0]
  if (!method || method.methodType === 'free_shipping') return 0
  if (method.freeShippingMinimum != null && subtotal >= method.freeShippingMinimum) return 0
  return method.cost ?? 0
}

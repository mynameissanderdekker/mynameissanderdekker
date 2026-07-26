const TRACKING_URL: Record<string, (n: string, p?: string) => string> = {
  PostNL: (n, p) => p
    ? `https://jouw.postnl.nl/track-and-trace/${n}-NL-${p.replace(/\s/g, '')}`
    : `https://jouw.postnl.nl/track-and-trace/${n}`,
  DHL: n => `https://www.dhl.com/nl-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${n}`,
  UPS: n => `https://www.ups.com/track?loc=en_US&tracknum=${n}`,
}

interface OrderItem { title: string; quantity: number; price: number }
interface ShippingAddress { street?: string; postalCode?: string; city?: string; country?: string }

interface OrderNotificationData {
  orderNumber: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: ShippingAddress
  items: OrderItem[]
  shippingCost?: number
  totalAmount: number
}

export function buildOrderNotificationEmail(order: OrderNotificationData) {
  const a = order.shippingAddress
  const lines = [
    `Nieuwe bestelling: ${order.orderNumber}`, '',
    `Klant:   ${order.customerName ?? '-'}`,
    `E-mail:  ${order.customerEmail ?? '-'}`,
    order.customerPhone ? `Tel:     ${order.customerPhone}` : null, '',
    'Verzendadres:',
    a?.street ?? '-',
    [a?.postalCode, a?.city].filter(Boolean).join(' ') || null,
    a?.country ?? null, '',
    'Items:',
    ...order.items.map(i => `  ${i.quantity}× ${i.title} — €${i.price.toFixed(2)}`), '',
    order.shippingCost ? `Verzendkosten: €${order.shippingCost.toFixed(2)}` : null,
    `Totaal:        €${order.totalAmount.toFixed(2)}`,
  ].filter((l): l is string => l !== null)

  return { subject: `Nieuwe bestelling — ${order.orderNumber}`, text: lines.join('\n') }
}

interface ShippedEmailData {
  orderNumber: string
  customerName?: string
  trackingNumber: string
  trackingCarrier?: string
  postalCode?: string
}

export function buildShippedEmail(order: ShippedEmailData) {
  const builder = order.trackingCarrier ? TRACKING_URL[order.trackingCarrier] : null
  const trackingUrl = builder ? builder(order.trackingNumber, order.postalCode) : null

  const lines = [
    `Hallo ${order.customerName || 'daar'},`, '',
    `Je bestelling ${order.orderNumber} is op weg!`, '',
    `Vervoerder:         ${order.trackingCarrier || '-'}`,
    `Track & trace:      ${order.trackingNumber}`,
    trackingUrl ? `Volg je pakket:     ${trackingUrl}` : null, '',
    'Met vriendelijke groet,',
    'Sander Dekker',
  ].filter((l): l is string => l !== null)

  return {
    subject: `Je bestelling ${order.orderNumber} is verzonden`,
    text: lines.join('\n'),
  }
}

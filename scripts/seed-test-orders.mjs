import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

const orders = [
  {
    _type: 'order',
    orderNumber: 'SD-TEST-001',
    stripeSessionId: 'cs_test_001',
    status: 'new',
    customerName: 'Jan de Vries',
    customerEmail: 'jan@example.com',
    customerPhone: '+31612345678',
    shippingAddress: { street: 'Keizersgracht 123', postalCode: '1015 CJ', city: 'Amsterdam', country: 'NL' },
    items: [{ _key: 'i1', title: 'Without Colour #12', quantity: 1, price: 450 }],
    shippingCost: 6.95,
    totalAmount: 456.95,
    createdAt: new Date().toISOString(),
    statusHistory: [{ _key: 'h1', _type: 'statusHistoryEntry', status: 'new', changedAt: new Date().toISOString(), changedBy: 'systeem', note: 'Test bestelling' }],
  },
  {
    _type: 'order',
    orderNumber: 'SD-TEST-002',
    stripeSessionId: 'cs_test_002',
    status: 'new',
    customerName: 'Sophie Müller',
    customerEmail: 'sophie@example.de',
    shippingAddress: { street: 'Unter den Linden 7', postalCode: '10117', city: 'Berlin', country: 'DE' },
    items: [
      { _key: 'i1', title: 'Form Study III', quantity: 1, price: 680 },
      { _key: 'i2', title: 'Texture Series — Book', quantity: 2, price: 35 },
    ],
    shippingCost: 14.95,
    totalAmount: 764.95,
    createdAt: new Date().toISOString(),
    statusHistory: [{ _key: 'h1', _type: 'statusHistoryEntry', status: 'new', changedAt: new Date().toISOString(), changedBy: 'systeem' }],
  },
  {
    _type: 'order',
    orderNumber: 'SD-TEST-003',
    stripeSessionId: 'cs_test_003',
    status: 'processing',
    customerName: 'Emily Chen',
    customerEmail: 'emily@example.com',
    shippingAddress: { street: '456 Broadway', postalCode: '10013', city: 'New York', country: 'US' },
    items: [{ _key: 'i1', title: 'Light Study #4', quantity: 1, price: 1200 }],
    shippingCost: 24.95,
    totalAmount: 1224.95,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    statusHistory: [
      { _key: 'h1', _type: 'statusHistoryEntry', status: 'new', changedAt: new Date(Date.now() - 86400000).toISOString(), changedBy: 'systeem' },
      { _key: 'h2', _type: 'statusHistoryEntry', status: 'processing', changedAt: new Date(Date.now() - 72000000).toISOString(), changedBy: 'Sander Dekker' },
    ],
  },
]

for (const order of orders) {
  const result = await sanity.create(order)
  console.log(`✅ ${order.orderNumber} aangemaakt — ${result._id}`)
}

console.log('\nKlaar! Open /studio en kijk of de 🔴 badge bij Bestellingen staat.')

import { defineField, defineType } from 'sanity'
import { OrderStatusHistoryTimeline } from '../components/OrderStatusHistoryTimeline'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import React from 'react'

export const ORDER_STATUS_LIST = [
  { title: 'New',        value: 'new' },
  { title: 'Processing', value: 'processing' },
  { title: 'Shipped',    value: 'shipped' },
  { title: 'Delivered',  value: 'delivered' },
  { title: 'Cancelled',  value: 'cancelled' },
  { title: 'Refunded',   value: 'refunded' },
]

export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  liveEdit: false,
  fields: [
    defineField({ name: 'orderNumber',    title: 'Order number',    type: 'string' }),
    defineField({ name: 'stripeSessionId', title: 'Stripe session ID', type: 'string', readOnly: true }),
    defineField({
      name: 'status', title: 'Status', type: 'string',
      options: { list: ORDER_STATUS_LIST }, initialValue: 'new',
    }),
    defineField({ name: 'customerName',  title: 'Name',  type: 'string' }),
    defineField({ name: 'customerEmail', title: 'Email', type: 'string' }),
    defineField({ name: 'customerPhone', title: 'Phone', type: 'string' }),
    defineField({
      name: 'shippingAddress', title: 'Shipping address', type: 'object',
      fields: [
        { name: 'street',     title: 'Street + house number', type: 'string' },
        { name: 'postalCode', title: 'Postal code',           type: 'string' },
        { name: 'city',       title: 'City',                  type: 'string' },
        { name: 'country',    title: 'Country',               type: 'string' },
      ],
    }),
    defineField({
      name: 'items', title: 'Items', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'artworkId', title: 'Artwork ID',                type: 'string' },
          { name: 'title',     title: 'Title (at time of purchase)', type: 'string' },
          { name: 'quantity',  title: 'Quantity',                   type: 'number' },
          { name: 'price',     title: 'Price per unit (€)',         type: 'number' },
        ],
        preview: {
          select: { title: 'title', quantity: 'quantity', price: 'price' },
          prepare({ title, quantity, price }: any) {
            return { title: title || '—', subtitle: `${quantity}× · €${Number(price).toFixed(2)}` }
          },
        },
      }],
    }),
    defineField({ name: 'shippingCost', title: 'Shipping cost (€)', type: 'number' }),
    defineField({ name: 'totalAmount',  title: 'Total amount (€)',  type: 'number' }),
    defineField({ name: 'createdAt',    title: 'Created at',        type: 'datetime' }),
    // ── Shipping ───────────────────────────────────────────────────────────
    defineField({ name: 'trackingNumber', title: 'Tracking number', type: 'string' }),
    defineField({
      name: 'trackingCarrier', title: 'Carrier', type: 'string',
      options: { list: ['PostNL', 'DHL', 'UPS', 'Other'] },
    }),
    defineField({ name: 'shippedAt',          title: 'Shipped at',                type: 'datetime' }),
    defineField({ name: 'shippingEmailSentAt', title: 'Shipping email sent at',   type: 'datetime', readOnly: true, hidden: true }),
    // ── Invoice ───────────────────────────────────────────────────────────────
    defineField({ name: 'invoiceNumber', title: 'Invoice number', type: 'string', readOnly: true }),
    defineField({
      name: 'invoicePdf', title: 'Invoice PDF', type: 'file',
      options: { accept: 'application/pdf' },
      readOnly: true,
    }),
    // ── Status history ─────────────────────────────────────────────────────
    defineField({
      name: 'statusHistory', title: 'Status history', type: 'array', readOnly: true,
      of: [{
        type: 'object', name: 'statusHistoryEntry',
        fields: [
          { name: 'status',    title: 'Status',     type: 'string' },
          { name: 'changedAt', title: 'Timestamp',  type: 'datetime' },
          { name: 'changedBy', title: 'Changed by', type: 'string' },
          { name: 'note',      title: 'Note',       type: 'string' },
        ],
      }],
      components: { input: OrderStatusHistoryTimeline },
    }),
  ],
  orderings: [
    { title: 'Date, newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      customerName: 'customerName',
      orderNumber:  'orderNumber',
      status:       'status',
      totalAmount:  'totalAmount',
      createdAt:    'createdAt',
    },
    prepare({ customerName, orderNumber, status, totalAmount, createdAt }: any) {
      const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
      const statusLabel = ORDER_STATUS_LIST.find(s => s.value === status)?.title || status || 'New'
      return {
        title: customerName || orderNumber || 'Order',
        subtitle: [dateLabel, totalAmount != null ? `€${Number(totalAmount).toFixed(2)}` : '', statusLabel].filter(Boolean).join('  ·  '),
        media: () => React.createElement(OrderStatusBadge, { status }),
      }
    },
  },
})

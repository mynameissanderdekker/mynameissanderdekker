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
  // Zelfde vier tabs als in de gallery-template. Stond hier als één lange
  // lijst, waarin de verkoop, het geld en de verzending door elkaar liepen.
  groups: [
    { name: 'sale',     title: 'Sale', default: true },
    { name: 'amounts',  title: 'Amounts' },
    { name: 'shipping', title: 'Shipping' },
    { name: 'history',  title: 'History' },
  ],
  fields: [
    defineField({ name: 'orderNumber',    title: 'Order number',    type: 'string', group: 'sale' }),
    defineField({ name: 'stripeSessionId', title: 'Stripe session ID', type: 'string', readOnly: true, group: 'history' }),
    defineField({
      name: 'status', title: 'Status', type: 'string', group: 'sale',
      options: { list: ORDER_STATUS_LIST }, initialValue: 'new',
    }),
    defineField({ name: 'customerName',  title: 'Name',  type: 'string', group: 'sale' }),
    defineField({ name: 'customerEmail', title: 'Email', type: 'string', group: 'sale' }),
    defineField({ name: 'customerPhone', title: 'Phone', type: 'string', group: 'sale' }),
    defineField({ name: 'companyName',   title: 'Company name', type: 'string', group: 'sale' }),
    defineField({ name: 'vatNumber',     title: 'BTW number', type: 'string', group: 'sale' }),
    defineField({
      name: 'shippingAddress', title: 'Shipping address', type: 'object', group: 'shipping',
      fields: [
        { name: 'street',     title: 'Street + house number', type: 'string' },
        { name: 'postalCode', title: 'Postal code',           type: 'string' },
        { name: 'city',       title: 'City',                  type: 'string' },
        { name: 'country',    title: 'Country',               type: 'string' },
      ],
    }),
    defineField({
      name: 'items', title: 'Items', type: 'array', group: 'sale',
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
    defineField({ name: 'shippingCost', title: 'Shipping cost (€)', type: 'number', group: 'amounts' }),
    defineField({ name: 'totalAmount',  title: 'Total amount (€)',  type: 'number', group: 'amounts' }),
    defineField({ name: 'createdAt',    title: 'Created at',        type: 'datetime', group: 'history' }),
    // ── Shipping ───────────────────────────────────────────────────────────
    defineField({ name: 'trackingNumber', title: 'Tracking number', type: 'string', group: 'shipping' }),
    defineField({
      name: 'trackingCarrier', title: 'Carrier', type: 'string', group: 'shipping',
      options: { list: ['PostNL', 'DHL', 'UPS', 'Other'] },
    }),
    defineField({ name: 'shippedAt',          title: 'Shipped at',                type: 'datetime', group: 'shipping' }),
    defineField({ name: 'shippingEmailSentAt', title: 'Shipping email sent at',   type: 'datetime', readOnly: true, hidden: true, group: 'shipping' }),
    // ── Invoice ───────────────────────────────────────────────────────────────
    defineField({ name: 'invoiceNumber', title: 'Invoice number', type: 'string', readOnly: true, group: 'sale' }),
    defineField({
      name: 'invoicePdf', title: 'Invoice PDF', type: 'file', group: 'sale',
      options: { accept: 'application/pdf' },
      readOnly: true,
    }),
    // ── Status history ─────────────────────────────────────────────────────
    defineField({
      name: 'statusHistory', title: 'Status history', type: 'array', readOnly: true, group: 'history',
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

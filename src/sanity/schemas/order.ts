import { defineField, defineType } from 'sanity'
import { OrderStatusHistoryTimeline } from '../components/OrderStatusHistoryTimeline'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { OrderCompletion } from '../components/OrderCompletion'
import React from 'react'

/**
 * Status is betaling, fulfilment is levering.
 *
 * Die twee zaten hier door elkaar (New / Processing / Shipped / Delivered),
 * waardoor "betaald" niet te noteren was en de verkooptool `delivered`
 * misbruikte om betaald te bedoelen. Overgenomen uit de gallery-template, waar
 * dit al gesplitst was.
 */
export const ORDER_STATUS_LIST = [
  { title: 'Awaiting payment', value: 'awaiting-payment' },
  { title: 'Paid',             value: 'paid' },
  { title: 'Cancelled',        value: 'cancelled' },
  { title: 'Refunded',         value: 'refunded' },
]

export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  liveEdit: false,
  // Ingedeeld naar wat je achtereenvolgens doet met een verkoop: eerst kijken
  // wat er verkocht is, dan het geld, dan verzenden, en achteraf terugkijken.
  groups: [
    { name: 'sale',     title: 'Sale', default: true },
    { name: 'amounts',  title: 'Amounts' },
    { name: 'shipping', title: 'Shipping' },
    { name: 'history',  title: 'History' },
  ],
  fields: [
    // Bovenaan: wat er nog moet gebeuren voordat deze verkoop klaar is.
    // Betaling en overdracht stonden verspreid over twee tabbladen; hier staan
    // ze onder elkaar met per stap één handeling.
    defineField({
      name: 'completion',
      title: 'To do',
      type: 'string',
      readOnly: true,
      group: 'sale',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: { field: OrderCompletion as any },
    }),
    defineField({ name: 'orderNumber', title: 'Order number', type: 'string', group: 'sale' }),
    defineField({
      name: 'status', title: 'Status', type: 'string', group: 'sale',
      options: { list: ORDER_STATUS_LIST }, initialValue: 'awaiting-payment',
    }),
    // Orders ontstaan niet alleen in de webshop — de verkooptool maakt ze ook
    // voor directe verkopen, via een galerie en op beurzen. Zonder dit veld is
    // achteraf niet te zien waar een verkoop vandaan kwam.
    defineField({
      name: 'channel', title: 'Sales channel', type: 'string', group: 'sale',
      options: {
        list: [
          { title: 'Studio / direct', value: 'direct' },
          { title: 'Via a gallery',   value: 'gallery' },
          { title: 'Art Fair',        value: 'artfair' },
          { title: 'Webshop',         value: 'webshop' },
        ],
      },
    }),
    // De klant zelf. customerName/customerEmail hieronder blijven staan als
    // momentopname, maar de factuur haalt bedrijf, BTW-nummer, adres en
    // telefoon hiervandaan.
    defineField({
      name: 'contact', title: 'Customer', type: 'reference', group: 'sale',
      to: [{ type: 'contact' }],
      options: { disableNew: true },
    }),
    // Gezet wanneer de verkoop via de knop op een offerte is gemaakt.
    defineField({
      name: 'proposal', title: 'From proposal', type: 'reference', group: 'sale',
      to: [{ type: 'proposal' }],
      readOnly: true,
    }),
    // Momentopname bij verkoop. Verborgen zodra er een contact hangt — dan is
    // dát de bron. Blijft zichtbaar bij webshopbestellingen zonder contact.
    defineField({
      name: 'customerName', title: 'Customer name', type: 'string', group: 'sale',
      hidden: ({ document }) => !!document?.contact,
    }),
    defineField({
      name: 'customerEmail', title: 'Customer email', type: 'string', group: 'sale',
      hidden: ({ document }) => !!document?.contact,
    }),
    defineField({
      name: 'customerPhone', title: 'Customer phone', type: 'string', group: 'sale',
      hidden: ({ document }) => !!document?.contact,
    }),
    defineField({
      name: 'companyName', title: 'Company name', type: 'string', group: 'sale',
      hidden: ({ document }) => !!document?.contact,
    }),
    defineField({
      name: 'vatNumber', title: 'BTW number', type: 'string', group: 'sale',
      hidden: ({ document }) => !!document?.contact,
    }),
    defineField({
      name: 'items', title: 'Items', type: 'array', group: 'sale',
      of: [{
        type: 'object',
        fields: [
          { name: 'item', title: 'Shop item', type: 'reference', to: [{ type: 'artwork' }, { type: 'publication' }] },
          { name: 'artworkId', title: 'Artwork ID (legacy)', type: 'string', hidden: true },
          { name: 'title',     title: 'Title (at time of purchase)', type: 'string' },
          { name: 'quantity',  title: 'Quantity', type: 'number' },
          { name: 'price',     title: 'Price per unit (at time of purchase)', type: 'number' },
          { name: 'priceExcl', title: 'Price excl. BTW', type: 'number' },
          { name: 'vatRate',   title: 'BTW rate (%)', type: 'number' },
        ],
        // Zonder preview toont Sanity een generiek documenticoon. De foto van
        // het werk maakt in één oogopslag duidelijk wat er verkocht is.
        preview: {
          select: {
            title: 'title', artworkTitle: 'item.title', year: 'item.year',
            price: 'priceExcl', quantity: 'quantity', media: 'item.images.0',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prepare({ title, artworkTitle, year, price, quantity, media }: any) {
            const name = title || artworkTitle || 'Werk'
            const qty = quantity && quantity > 1 ? `${quantity} × ` : ''
            const amount = typeof price === 'number'
              ? `€ ${price.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
              : ''
            return {
              title: year ? `${name}, ${year}` : name,
              subtitle: `${qty}${amount}`.trim(),
              media,
            }
          },
        },
      }],
    }),
    // De verkooptool schreef dit al weg, maar het stond niet in het schema —
    // waardoor de notitie bij een verkoop onzichtbaar was in de Studio.
    defineField({
      name: 'notes', title: 'Internal note', type: 'text', rows: 2, group: 'sale',
      description: 'Internal note for this sale. Never shown on the invoice.',
    }),
    defineField({ name: 'invoiceNumber', title: 'Invoice number', type: 'string', readOnly: true, group: 'sale' }),
    defineField({
      name: 'invoicePdf', title: 'Invoice PDF', type: 'file', group: 'sale',
      options: { accept: 'application/pdf' },
      readOnly: true,
    }),

    // ── Amounts ───────────────────────────────────────────────────────────────
    defineField({ name: 'shippingCost', title: 'Shipping cost (excl. BTW)', type: 'number', group: 'amounts' }),
    defineField({
      name: 'discountPercent', title: 'Discount (%)', type: 'number', group: 'amounts',
      description: 'Discount percentage as agreed with the client. Shown as a percentage on the invoice.',
      validation: (r) => r.min(0).max(100),
    }),
    defineField({
      name: 'discount', title: 'Discount amount (excl. BTW)', type: 'number', group: 'amounts',
      readOnly: true,
      description: 'Calculated from the percentage — used for the totals.',
    }),
    defineField({ name: 'totalAmount', title: 'Total amount (EUR)', type: 'number', group: 'amounts' }),

    // ── Shipping ──────────────────────────────────────────────────────────────
    // Hoe het werk bij de klant komt. Een webshopbestelling wordt verzonden,
    // maar een directe verkoop wordt vaak zelf gebracht, door een
    // kunsttransporteur vervoerd, of door de klant opgehaald.
    defineField({
      name: 'fulfilment', title: 'How is it delivered?', type: 'string', group: 'shipping',
      options: {
        list: [
          // Een radiokeuze is in Sanity niet uit te klikken; zonder deze optie
          // zit je vast aan je eerste keuze.
          { title: 'Not decided yet',          value: 'undecided' },
          { title: 'Shipped (post / courier)', value: 'shipped' },
          { title: 'Delivered in person',      value: 'delivered' },
          { title: 'Collected by the client',  value: 'collected' },
          { title: 'Art handler / transport',  value: 'transport' },
        ],
        layout: 'radio',
      },
    }),
    // Wanneer het werkelijk gebeurde. Optioneel, en bewust niet automatisch
    // ingevuld: je registreert een order zelden op het moment zelf.
    defineField({
      name: 'shippedAt', title: 'Date shipped / delivered / collected', type: 'date', group: 'shipping',
      description: 'Optional — fill in if you want to record the actual date.',
      // Nooit verbergen zodra er een datum staat: anders kun je hem niet meer
      // weghalen.
      hidden: ({ document }) =>
        !document?.shippedAt && (!document?.fulfilment || document.fulfilment === 'undecided'),
    }),
    defineField({
      name: 'differentAddress', title: 'Deliver to a different address', type: 'boolean', group: 'shipping',
      initialValue: false,
      hidden: ({ document }) =>
        !document?.differentAddress &&
        (!document?.fulfilment || ['undecided', 'collected'].includes(document.fulfilment as string)),
    }),
    defineField({
      name: 'shippingAddress', title: 'Delivery address (if different)', type: 'object', group: 'shipping',
      // Ook tonen zodra er iets ingevuld staat: een webshopbestelling krijgt het
      // adres bij het afrekenen mee, zonder dat de toggle aan staat. Ingevulde
      // gegevens verbergen is altijd fout.
      hidden: ({ document }) =>
        !document?.differentAddress &&
        !(document?.shippingAddress as { street?: string } | undefined)?.street,
      fields: [
        { name: 'street',     title: 'Street + house number', type: 'string' },
        { name: 'postalCode', title: 'Postal code',           type: 'string' },
        { name: 'city',       title: 'City',                  type: 'string' },
        { name: 'country',    title: 'Country',               type: 'string' },
      ],
    }),
    defineField({
      name: 'trackingNumber', title: 'Tracking number', type: 'string', group: 'shipping',
      description: 'Track & Trace number',
      hidden: ({ document }) =>
        document?.fulfilment !== 'shipped' && !document?.trackingNumber && !document?.trackingCarrier,
    }),
    defineField({
      name: 'trackingCarrier', title: 'Carrier', type: 'string', group: 'shipping',
      options: { list: ['PostNL', 'DHL', 'UPS', 'Other'] },
      hidden: ({ document }) =>
        document?.fulfilment !== 'shipped' && !document?.trackingNumber && !document?.trackingCarrier,
    }),
    defineField({
      name: 'shippingEmailSentAt', title: 'Shipping email sent at', type: 'datetime',
      group: 'shipping', readOnly: true, hidden: true,
    }),

    // ── History ───────────────────────────────────────────────────────────────
    defineField({ name: 'stripeSessionId', title: 'Stripe session ID', type: 'string', readOnly: true, group: 'history' }),
    defineField({ name: 'createdAt', title: 'Created at', type: 'datetime', group: 'history' }),
    defineField({
      name: 'statusHistory', title: 'Status history', type: 'array', readOnly: true, group: 'history',
      description: 'Automatically recorded whenever this order\'s status changes. Read-only.',
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
      contactFirst: 'contact.firstName',
      contactLast:  'contact.lastName',
      orderNumber:  'orderNumber',
      status:       'status',
      totalAmount:  'totalAmount',
      createdAt:    'createdAt',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare({ customerName, contactFirst, contactLast, orderNumber, status, totalAmount, createdAt }: any) {
      const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
      const statusLabel = ORDER_STATUS_LIST.find(s => s.value === status)?.title || status || 'Awaiting payment'
      const name = [contactFirst, contactLast].filter(Boolean).join(' ') || customerName
      // Ordernummer voorop: daar zoek je op, en het staat op de factuur.
      return {
        title: [orderNumber, name].filter(Boolean).join(' · ') || 'Order',
        subtitle: [dateLabel, totalAmount != null ? `€${Number(totalAmount).toFixed(2)}` : '', statusLabel].filter(Boolean).join('  ·  '),
        media: () => React.createElement(OrderStatusBadge, { status }),
      }
    },
  },
})

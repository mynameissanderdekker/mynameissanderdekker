import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import { PrintBar } from './PrintBar'

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ invoiceNumber: string }>
}

export default async function InvoicePage({ params }: Props) {
  const { invoiceNumber } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (client.fetch as any)(
    `*[_type == "order" && orderNumber == $n][0]{
      orderNumber, createdAt, status,
      customerName, customerEmail, customerPhone,
      companyName, vatNumber,
      shippingAddress,
      items, totalAmount,
      statusHistory
    }`,
    { n: invoiceNumber }
  )

  if (!order) notFound()

  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Determine VAT from items (totalAmount is incl. VAT; derive from item prices)
  // Items store price incl. VAT; we show totals
  const totalIncl: number = order.totalAmount ?? 0

  // Try to parse sold-via from statusHistory note
  const histNote: string = order.statusHistory?.[0]?.note ?? ''
  const soldViaMatch = histNote.match(/Handmatige verkoop — (\w+)/)
  const soldViaMap: Record<string, string> = {
    direct: 'Direct (studio)', gallery: 'Gallery', artfair: 'Art fair', other: 'Other',
    webshop: 'Webshop',
  }
  const soldVia = soldViaMatch ? (soldViaMap[soldViaMatch[1]] ?? soldViaMatch[1]) : 'Direct'

  const address = order.shippingAddress

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
          .invoice-wrap { padding: 40px !important; max-width: 100% !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Print / back bar */}
      <PrintBar orderNumber={order.orderNumber} />

      {/* Invoice */}
      <div className="invoice-wrap" style={{
        maxWidth: 720, margin: '40px auto', padding: '40px 48px',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#111', background: '#fff',
        border: '1px solid #e8e8e8',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: '0.02em', marginBottom: 4 }}>Sander Dekker</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
              hello@mynameissanderdekker.com<br />
              mynameissanderdekker.com<br />
              Amsterdam, the Netherlands
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>Invoice</div>
            <div style={{ fontSize: 20, fontWeight: 400 }}>{order.orderNumber}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{dateStr}</div>
          </div>
        </div>

        {/* Bill to */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>Bill to</div>
          <div style={{ fontSize: 15, marginBottom: 2 }}>{order.customerName}</div>
          {order.companyName && <div style={{ fontSize: 13, color: '#555' }}>{order.companyName}</div>}
          {order.vatNumber && <div style={{ fontSize: 12, color: '#888' }}>VAT: {order.vatNumber}</div>}
          {order.customerEmail && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{order.customerEmail}</div>}
          {order.customerPhone && <div style={{ fontSize: 13, color: '#555' }}>{order.customerPhone}</div>}
          {address && (
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
              {address.street && <>{address.street}<br /></>}
              {(address.postalCode || address.city) && <>{[address.postalCode, address.city].filter(Boolean).join(' ')}<br /></>}
              {address.country && <>{address.country}</>}
            </div>
          )}
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32, fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #111' }}>
              <th style={{ textAlign: 'left', padding: '6px 0 10px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 400 }}>Description</th>
              <th style={{ textAlign: 'right', padding: '6px 0 10px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 400 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item: { title: string; quantity: number; price: number }, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 0', lineHeight: 1.5 }}>
                  <div>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Qty: {item.quantity} · Via: {soldVia}</div>
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', verticalAlign: 'top' }}>
                  €{Number(item.price).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ paddingTop: 16, fontSize: 15, fontWeight: 600 }}>Total (incl. VAT)</td>
              <td style={{ paddingTop: 16, textAlign: 'right', fontSize: 15, fontWeight: 600 }}>
                €{totalIncl.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment info */}
        <div style={{ background: '#f9f9f8', border: '1px solid #eeeeec', borderRadius: 4, padding: '16px 20px', fontSize: 13, color: '#555', marginBottom: 32 }}>
          <strong style={{ color: '#111' }}>Payment</strong><br />
          Please transfer the amount to the bank account on file, referencing invoice number <strong>{order.orderNumber}</strong>.
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #eeeeec', paddingTop: 20, fontSize: 11, color: '#bbb', lineHeight: 1.6 }}>
          Sander Dekker · hello@mynameissanderdekker.com · mynameissanderdekker.com · Amsterdam, NL
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: '' }} />
    </>
  )
}

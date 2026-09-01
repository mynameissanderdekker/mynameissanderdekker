import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import { InvoiceToolbar } from './PrintBar'
import { vatTreatment } from '@/lib/invoiceVat'

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_WRITE_TOKEN,
  useCdn:     false,
})

export const dynamic = 'force-dynamic'

// ── i18n ─────────────────────────────────────────────────────────────────────

const T = {
  en: {
    invoice: 'INVOICE',
    from: 'From', billTo: 'Bill to',
    description: 'Description', amount: 'Amount',
    subtotal: 'Subtotal excl. VAT', vat: 'VAT',
    shipping: 'Shipping', discount: 'Discount',
    total: 'Total incl. VAT',
    payment: 'Payment details',
    payRef: (n: string) => `Please reference invoice number ${n} with your payment.`,
    payDue: (d: number) => `Payment due within ${d} days.`,
    notes: 'Notes', excl: 'excl.',
  },
  nl: {
    invoice: 'FACTUUR',
    from: 'Van', billTo: 'Aan',
    description: 'Omschrijving', amount: 'Bedrag',
    subtotal: 'Subtotaal excl. BTW', vat: 'BTW',
    shipping: 'Verzending', discount: 'Korting',
    total: 'Totaal incl. BTW',
    payment: 'Betalingsgegevens',
    payRef: (n: string) => `Vermeld bij betaling het factuurnummer ${n}.`,
    payDue: (d: number) => `Betaling binnen ${d} dagen.`,
    notes: 'Notities', excl: 'excl.',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_NL: Record<string, string> = {
  Netherlands: 'Nederland', Germany: 'Duitsland', Belgium: 'België',
  France: 'Frankrijk', 'United Kingdom': 'Verenigd Koninkrijk', Spain: 'Spanje',
  Italy: 'Italië', 'United States': 'Verenigde Staten',
}

function localizeCountry(val: string, lang: 'en' | 'nl'): string {
  if (!val) return ''
  if (/^[A-Z]{2}$/i.test(val.trim())) {
    try { return new Intl.DisplayNames([lang === 'nl' ? 'nl-NL' : 'en-GB'], { type: 'region' }).of(val.toUpperCase()) ?? val } catch { return val }
  }
  return lang === 'nl' ? (COUNTRY_NL[val] ?? val) : val
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(iso: string, lang: 'en' | 'nl') {
  return new Date(iso).toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  _key: string; title: string; quantity: number
  price: number; priceExcl?: number; vatRate?: number
  artwork?: { title: string; vatRate?: string }
}

interface Order {
  orderNumber: string; createdAt: string; status: string; notes?: string
  customerName: string; customerEmail?: string; customerPhone?: string
  companyName?: string; vatNumber?: string
  shippingAddress?: { street?: string; postalCode?: string; city?: string; country?: string }
  items: OrderItem[]
  totalAmount?: number; shippingCost?: number; discount?: number
  statusHistory?: { note?: string }[]
  contact?: {
    firstName?: string; lastName?: string; name?: string
    company?: string; vatNumber?: string
    email?: string; phone?: string
    street?: string; postalCode?: string; city?: string; country?: string
    clientLocation?: 'nl' | 'eu' | 'export'
  }
}

interface Settings {
  siteName?: string
  email?: string
  invoiceSettings?: {
    legalName?: string; address?: string; postalCode?: string; city?: string
    country?: string; phone?: string; kvkNumber?: string; vatNumber?: string
    iban?: string; bic?: string; invoicePrefix?: string; paymentTerms?: number; invoiceNote?: string
    website?: string
  }
  logoUrl?: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ invoiceNumber: string }>
  searchParams: Promise<{ lang?: string }>
}

export default async function InvoicePage({ params, searchParams }: Props) {
  const { invoiceNumber } = await params
  const { lang: langParam } = await searchParams
  const lang: 'en' | 'nl' = langParam === 'nl' ? 'nl' : 'en'
  const t = T[lang]

  const [order, settings] = await Promise.all([
    client.fetch<Order | null>(
      `*[_type == "order" && orderNumber == $n][0]{
        orderNumber, createdAt, status, notes, statusHistory,
        customerName, customerEmail, customerPhone, companyName, vatNumber,
        shippingAddress, shippingCost, discount, totalAmount,
        items[]{ _key, title, quantity, price, priceExcl, vatRate,
          "artwork": item->{title, "vatRate": vatRate}
        },
        contact->{ firstName, lastName, name, company, vatNumber, email, phone, street, postalCode, city, country, clientLocation }
      }`,
      { n: invoiceNumber }
    ),
    client.fetch<Settings | null>(
      `*[_type == "siteSettings"][0]{ siteName, email, invoiceSettings, "logoUrl": logo.asset->url }`
    ),
  ])

  if (!order) notFound()

  const is = settings?.invoiceSettings ?? {}
  const legalName    = is.legalName    ?? settings?.siteName ?? 'Sander Dekker'
  const address      = is.address      ?? ''
  const postalCity   = [is.postalCode, is.city].filter(Boolean).join(' ')
  const country      = is.country      ?? ''
  const phone        = is.phone        ?? ''
  const senderEmail  = settings?.email ?? ''
  const kvkNumber    = is.kvkNumber    ?? ''
  const iban         = is.iban         ?? ''
  const bic          = is.bic          ?? ''
  const paymentTerms = is.paymentTerms ?? 14
  const invoiceNote  = is.invoiceNote  ?? ''
  const logoUrl      = settings?.logoUrl ?? null

  // ── VAT calculation ──────────────────────────────────────────────────────

  const vatGroups: Record<number, { excl: number; vat: number }> = {}
  let totalExcl = 0

  // Waar de klant zit bepaalt het tarief: binnenland het gewone percentage,
  // binnen de EU verlegd (0%), daarbuiten export (0%).
  const vatRule = vatTreatment(order.contact?.clientLocation)

  for (const item of order.items ?? []) {
    const qty = item.quantity ?? 1
    const priceExcl = (item.priceExcl ?? item.price ?? 0) * qty
    const baseRate = item.vatRate ?? (item.artwork?.vatRate != null ? parseInt(item.artwork.vatRate, 10) : 9)
    const rate = vatRule.rate(baseRate)
    const vatAmount = priceExcl * (rate / 100)
    totalExcl += priceExcl
    if (!vatGroups[rate]) vatGroups[rate] = { excl: 0, vat: 0 }
    vatGroups[rate].excl += priceExcl
    vatGroups[rate].vat += vatAmount
  }

  const totalVat     = Object.values(vatGroups).reduce((s, g) => s + g.vat, 0)
  const discount     = order.discount     ?? 0
  const shippingCost = order.shippingCost ?? 0
  const shippingVat  = shippingCost * (vatRule.rate(21) / 100)
  const discountVat  = discount * (totalExcl > 0 ? totalVat / totalExcl : 0)
  const totalExclAdj = totalExcl - discount + shippingCost
  const totalVatAdj  = totalVat - discountVat + shippingVat
  const totalIncl    = totalExclAdj + totalVatAdj

  // ── Bill-to ─────────────────────────────────────────────────────────────

  const c = order.contact
  const billName    = c ? ([c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '') : order.customerName
  const billCompany = c?.company   ?? order.companyName   ?? ''
  const billVat     = c?.vatNumber ?? order.vatNumber     ?? ''
  const billStreet  = c?.street    ?? order.shippingAddress?.street    ?? ''
  const billPostal  = c?.postalCode ?? order.shippingAddress?.postalCode ?? ''
  const billCity    = c?.city      ?? order.shippingAddress?.city      ?? ''
  const billCountry = c?.country   ?? order.shippingAddress?.country   ?? ''
  const billPhone   = c?.phone     ?? order.customerPhone ?? ''
  const billEmail   = c?.email     ?? order.customerEmail ?? ''

  const footerParts = [
    legalName,
    kvkNumber ? `KVK: ${kvkNumber}` : null,
    iban      ? `IBAN: ${iban}`      : null,
    bic       ? `BIC: ${bic}`        : null,
    senderEmail || null,
    is.website || null,
  ].filter(Boolean)

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; background: #fff !important; }
          .invoice-wrap { box-shadow: none !important; margin: 0 !important; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
      `}</style>

      <InvoiceToolbar invoiceNumber={invoiceNumber} lang={lang} />

      <div
        className="invoice-wrap"
        style={{
          width: 794, minHeight: 1123, margin: '32px auto 64px',
          background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
          padding: '56px 64px 32px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <img
            src={`${logoUrl}?h=80&auto=format`}
            alt={legalName}
            style={{ maxHeight: 36, width: 'auto', maxWidth: 200, display: 'block', marginBottom: 28 }}
          />
        )}

        {/* Header grid: From | Bill to | (empty) | Invoice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 32, marginBottom: 40, alignItems: 'flex-start' }}>
          {/* From */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>{t.from}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
              <strong>{legalName}</strong><br />
              {address && <>{address}<br /></>}
              {postalCity && <>{postalCity}<br /></>}
              {country && <>{localizeCountry(country, lang)}<br /></>}
              {phone && <>{phone}<br /></>}
              {senderEmail && <>{senderEmail}</>}
            </div>
          </div>

          {/* Bill to */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>{t.billTo}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
              {billCompany
                ? <>
                    <strong>{billCompany}</strong>
                    {billVat && <span style={{ fontWeight: 400 }}> · BTW: {billVat}</span>}<br />
                    t.a.v. {billName}<br />
                  </>
                : <><strong>{billName}</strong><br /></>
              }
              {billStreet && <>{billStreet}<br /></>}
              {(billPostal || billCity) && <>{`${billPostal} ${billCity}`.trim()}<br /></>}
              {billCountry && <>{localizeCountry(billCountry, lang)}<br /></>}
              {billPhone && <>{billPhone}<br /></>}
              {billEmail && <>{billEmail}</>}
            </div>
          </div>

          {/* spacer */}
          <div />

          {/* Invoice number + date */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{t.invoice}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <strong>#{invoiceNumber}</strong><br />
              {order.createdAt ? fmtDate(order.createdAt, lang) : ''}
            </div>
          </div>
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111' }}>
              <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', paddingBottom: 8 }}>{t.description}</th>
              <th style={{ textAlign: 'right', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', paddingBottom: 8, width: 180 }}>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item) => {
              const qty = item.quantity ?? 1
              const priceExcl = item.priceExcl ?? item.price ?? 0
              const label = item.artwork?.title ?? item.title ?? '—'
              return (
                <tr key={item._key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 0 10px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                    {qty > 1 && <div style={{ fontSize: 12, color: '#6b7280' }}>Qty: {qty}</div>}
                  </td>
                  <td style={{ padding: '14px 0 10px', textAlign: 'right', verticalAlign: 'top', fontSize: 14 }}>
                    € {fmtEur(priceExcl * qty)} {t.excl}
                  </td>
                </tr>
              )
            })}

            {discount > 0 && (
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontSize: 14 }}>{t.discount}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontSize: 14, color: '#059669' }}>− € {fmtEur(discount)} {t.excl}</td>
              </tr>
            )}

            {shippingCost > 0 && (
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontSize: 14 }}>{t.shipping}</td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontSize: 14 }}>€ {fmtEur(shippingCost)} {t.excl}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: '2px solid #111', paddingTop: 16, marginBottom: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
              <span>{t.subtotal}</span>
              <span>€ {fmtEur(totalExclAdj)}</span>
            </div>
            {Object.entries(vatGroups).map(([rate, group]) => (
              <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                <span>{t.vat} {rate}%</span>
                <span>€ {fmtEur(group.vat)}</span>
              </div>
            ))}
            {shippingCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                <span>{t.vat} 21% ({t.shipping.toLowerCase()})</span>
                <span>€ {fmtEur(shippingVat)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
              <span>{t.total}</span>
              <span>€ {fmtEur(totalIncl)}</span>
            </div>
            {/* Zonder deze regel staat er 0% BTW zonder uitleg. */}
            {vatRule.note && (
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 10, textAlign: 'right' }}>
                {lang === 'nl' ? vatRule.note.nl : vatRule.note.en}
              </p>
            )}
          </div>
        </div>

        {/* Payment box */}
        {(iban || bic) && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '20px 24px', marginBottom: order.notes ? 32 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>{t.payment}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              {t.payRef(invoiceNumber)}<br />
              {iban && <>IBAN: {iban}{bic && <> &nbsp;·&nbsp; BIC: {bic}</>}<br /></>}
              {t.payDue(paymentTerms)}
              {invoiceNote && <><br />{invoiceNote}</>}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div style={{ marginTop: 24, marginBottom: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>{t.notes}</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{order.notes}</div>
          </div>
        )}

        {/* Footer — pinned to bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #e5e7eb', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          {footerParts.join(' · ')}
        </div>
      </div>
    </>
  )
}

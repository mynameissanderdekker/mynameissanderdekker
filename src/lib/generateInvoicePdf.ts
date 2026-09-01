/**
 * Invoice PDF generator — pdf-lib
 *
 * De verkopersgegevens stonden hier hardcoded. De webfactuur las ze al uit
 * Site Settings → Invoice & business; de PDF die de klant krijgt niet. Twee
 * bronnen voor dezelfde gegevens, en de PDF won.
 *
 * Nu komen ze mee als `seller` uit de aanroeper. De oude waarden blijven als
 * terugval, zodat er niets breekt zolang `invoiceSettings` nog niet is
 * ingevuld — maar zodra dat wel zo is, wint de instelling.
 */
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'

export interface InvoiceSeller {
  name?:    string
  attn?:    string
  street?:  string
  postal?:  string
  country?: string
  email?:   string
  website?: string
  iban?:    string
  bic?:     string
  btw?:     string
  kvk?:     string
}

const SELLER_FALLBACK = {
  name:    'My name is Sander Dekker',
  attn:    'Sander Dekker',
  street:  'Leliendaalstraat 1',
  postal:  '1013BP Amsterdam',
  country: 'Netherlands',
  email:   'hello@mynameissanderdekker.com',
  iban:    'NL54 BUNQ 2105 4317 20',
  bic:     'BUNQNL2A',
  btw:     'NL002124967B84',
  kvk:     '52124819',
}

export interface InvoiceItem {
  title:    string
  quantity: number
  price:    number   // unit price incl. BTW
}

export interface InvoiceData {
  invoiceNumber:  string
  issuedAt:       Date
  orderNumber:    string
  customerName?:  string
  customerEmail?: string
  shippingAddress?: {
    street?:     string
    postalCode?: string
    city?:       string
    country?:    string
  }
  items:          InvoiceItem[]
  shippingCost?:  number
  totalAmount:    number
  /** Uit Site Settings → Invoice & business. Ontbrekende velden vallen terug. */
  seller?:        InvoiceSeller
}

// ── helpers ────────────────────────────────────────────────────────────────────

function euro(n: number): string {
  return `€${n.toFixed(2)}`
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: any; size?: number; color?: any; maxWidth?: number }
) {
  page.drawText(text, {
    x,
    y,
    font:  opts.font,
    size:  opts.size ?? 10,
    color: opts.color ?? rgb(0, 0, 0),
  })
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, width = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: width, color: rgb(0, 0, 0) })
}

// ── main ───────────────────────────────────────────────────────────────────────

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  // Per veld terugvallen, niet per blok: heeft iemand alleen een IBAN
  // ingevuld, dan hoort de rest niet ineens leeg te zijn.
  const SELLER = {
    name:    data.seller?.name    || SELLER_FALLBACK.name,
    attn:    data.seller?.attn    || SELLER_FALLBACK.attn,
    street:  data.seller?.street  || SELLER_FALLBACK.street,
    postal:  data.seller?.postal  || SELLER_FALLBACK.postal,
    country: data.seller?.country || SELLER_FALLBACK.country,
    email:   data.seller?.email   || SELLER_FALLBACK.email,
    iban:    data.seller?.iban    || SELLER_FALLBACK.iban,
    bic:     data.seller?.bic     || SELLER_FALLBACK.bic,
    btw:     data.seller?.btw     || SELLER_FALLBACK.btw,
    kvk:     data.seller?.kvk     || SELLER_FALLBACK.kvk,
  }

  const doc    = await PDFDocument.create()
  const page   = doc.addPage([595.28, 841.89]) // A4
  const { height } = page.getSize()

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)

  const GREY  = rgb(0.45, 0.45, 0.45)
  const BLACK = rgb(0, 0, 0)
  const L     = 56   // left margin
  const R     = 539  // right edge
  const COL_QTY   = 390
  const COL_PRICE = 450
  const COL_TOTAL = 539

  // ── Header ──────────────────────────────────────────────────────────────────
  let y = height - 60

  // Artist name (large)
  page.drawText('SANDER DEKKER', {
    x: L, y,
    font: bold, size: 18, color: BLACK,
  })

  // Invoice label top-right
  page.drawText('INVOICE', {
    x: R - bold.widthOfTextAtSize('INVOICE', 18), y,
    font: bold, size: 18, color: BLACK,
  })

  y -= 22

  // Seller details (small, grey)
  const sellerLines = [
    SELLER.street,
    `${SELLER.postal}, ${SELLER.country}`,
    SELLER.email,
  ]
  for (const line of sellerLines) {
    drawText(page, line, L, y, { font: regular, size: 8.5, color: GREY })
    y -= 13
  }

  // Invoice meta (right-aligned block)
  const metaY = height - 82
  const metaLines: [string, string][] = [
    ['Invoice number', data.invoiceNumber],
    ['Date',           data.issuedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['Order',          data.orderNumber],
  ]
  let metaLineY = metaY
  for (const [label, value] of metaLines) {
    const labelW = regular.widthOfTextAtSize(label, 8.5)
    const valueW = regular.widthOfTextAtSize(value, 8.5)
    drawText(page, label, COL_PRICE - labelW, metaLineY, { font: regular, size: 8.5, color: GREY })
    drawText(page, value, R - valueW,         metaLineY, { font: regular, size: 8.5, color: BLACK })
    metaLineY -= 14
  }

  y = height - 130

  // ── Divider ─────────────────────────────────────────────────────────────────
  drawLine(page, L, y, R, y, 1)
  y -= 24

  // ── Bill to ─────────────────────────────────────────────────────────────────
  drawText(page, 'BILL TO', L, y, { font: bold, size: 8, color: GREY })
  y -= 14

  const a = data.shippingAddress
  const billLines = [
    data.customerName ?? '',
    a?.street ?? '',
    [a?.postalCode, a?.city].filter(Boolean).join('  ') ?? '',
    a?.country ?? '',
    data.customerEmail ?? '',
  ].filter(Boolean)

  for (const line of billLines) {
    drawText(page, line, L, y, { font: regular, size: 9.5 })
    y -= 13
  }

  y -= 16

  // ── Items table header ───────────────────────────────────────────────────────
  drawLine(page, L, y, R, y, 0.4)
  y -= 14

  drawText(page, 'DESCRIPTION',        L,         y, { font: bold, size: 8.5, color: GREY })
  drawText(page, 'QTY',   COL_QTY,     y, { font: bold, size: 8.5, color: GREY })
  drawText(page, 'UNIT PRICE', COL_PRICE - bold.widthOfTextAtSize('UNIT PRICE', 8.5), y, { font: bold, size: 8.5, color: GREY })
  drawText(page, 'TOTAL', R - bold.widthOfTextAtSize('TOTAL', 8.5), y, { font: bold, size: 8.5, color: GREY })

  y -= 8
  drawLine(page, L, y, R, y, 0.4)
  y -= 16

  // ── Items ────────────────────────────────────────────────────────────────────
  for (const item of data.items) {
    const lineTotal = item.price * item.quantity
    const qtyW    = regular.widthOfTextAtSize(String(item.quantity), 9.5)
    const priceW  = regular.widthOfTextAtSize(euro(item.price), 9.5)
    const totalW  = regular.widthOfTextAtSize(euro(lineTotal), 9.5)

    drawText(page, item.title,              L,                     y, { font: regular, size: 9.5 })
    drawText(page, String(item.quantity),   COL_QTY,               y, { font: regular, size: 9.5 })
    drawText(page, euro(item.price),        COL_PRICE - priceW,    y, { font: regular, size: 9.5 })
    drawText(page, euro(lineTotal),         R - totalW,            y, { font: regular, size: 9.5 })

    y -= 18
  }

  // Shipping line (if any)
  if (data.shippingCost && data.shippingCost > 0) {
    const shippingW = regular.widthOfTextAtSize(euro(data.shippingCost), 9.5)
    drawText(page, 'Shipping',                        L,                     y, { font: regular, size: 9.5, color: GREY })
    drawText(page, '1',                               COL_QTY,               y, { font: regular, size: 9.5, color: GREY })
    drawText(page, euro(data.shippingCost),           COL_PRICE - shippingW, y, { font: regular, size: 9.5, color: GREY })
    drawText(page, euro(data.shippingCost),           R - shippingW,         y, { font: regular, size: 9.5, color: GREY })
    y -= 18
  }

  y -= 4
  drawLine(page, COL_PRICE - 60, y, R, y, 0.4)
  y -= 16

  // ── Totals breakdown ─────────────────────────────────────────────────────────
  const vatRate   = 9
  const subtotal  = data.totalAmount / (1 + vatRate / 100)
  const vatAmount = data.totalAmount - subtotal

  const subtotalLabel = `Subtotal excl. BTW`
  const vatLabel      = `BTW ${vatRate}%`

  const subtotalW  = regular.widthOfTextAtSize(euro(subtotal),  9.5)
  const vatAmountW = regular.widthOfTextAtSize(euro(vatAmount), 9.5)

  drawText(page, subtotalLabel, COL_PRICE - 60, y, { font: regular, size: 9.5, color: GREY })
  drawText(page, euro(subtotal), R - subtotalW,  y, { font: regular, size: 9.5, color: GREY })
  y -= 14

  drawText(page, vatLabel,      COL_PRICE - 60, y, { font: regular, size: 9.5, color: GREY })
  drawText(page, euro(vatAmount), R - vatAmountW, y, { font: regular, size: 9.5, color: GREY })
  y -= 8

  drawLine(page, COL_PRICE - 60, y, R, y, 0.4)
  y -= 14

  const totalW = bold.widthOfTextAtSize(euro(data.totalAmount), 11)
  drawText(page, 'TOTAL',               COL_PRICE - 60,    y, { font: bold, size: 10 })
  drawText(page, euro(data.totalAmount), R - totalW,        y, { font: bold, size: 11 })

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = 52
  drawLine(page, L, footerY + 10, R, footerY + 10, 0.4)

  const footerCols = [
    [`IBAN: ${SELLER.iban}`, `BIC: ${SELLER.bic}`],
    [`BTW: ${SELLER.btw}`, `KvK: ${SELLER.kvk}`],
    [`${SELLER.name}`, `${SELLER.attn}`],
  ]

  const colWidth = (R - L) / footerCols.length
  footerCols.forEach((lines, i) => {
    lines.forEach((line, j) => {
      drawText(page, line, L + i * colWidth, footerY - j * 12, { font: regular, size: 7.5, color: GREY })
    })
  })

  return doc.save()
}

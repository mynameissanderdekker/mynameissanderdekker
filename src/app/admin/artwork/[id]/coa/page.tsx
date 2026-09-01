import { createClient } from 'next-sanity'
import { notFound } from 'next/navigation'
import { getSiteIdentity } from '@/lib/siteIdentity'

export const dynamic = 'force-dynamic'

const client = createClient({
  projectId: 'u11u127q',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

function today() {
  return new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function CoAPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cleanId = id.replace(/^drafts\./, '')
  // Naam, website en e-mail kwamen hier hardcoded uit de code.
  const site = await getSiteIdentity(client)

  const artwork = await client.fetch(
    `*[_type == "artwork" && _id == $id][0] {
      _id, title, year, medium, dimensions,
      editionType, editionTotal, editionAP,
      artist,
      "imageUrl": images[0].asset->url,
    }`,
    { id: cleanId }
  )

  if (!artwork) notFound()

  const artistName = artwork.artist ?? 'Sander Dekker'

  // Dimensions string
  const dims = artwork.dimensions
    ? [
        artwork.dimensions.widthCm,
        artwork.dimensions.heightCm,
        artwork.dimensions.depthCm,
      ]
        .filter(Boolean)
        .join(' × ') + ' cm'
    : null

  const editionLine =
    artwork.editionType === 'edition' && artwork.editionTotal
      ? `Edition of ${artwork.editionTotal}${artwork.editionAP ? ` + ${artwork.editionAP} AP` : ''}`
      : 'Unique work'

  const imageUrl = artwork.imageUrl
    ? `${artwork.imageUrl}?w=800&auto=format&q=90`
    : null

  const certText = `This is to certify that the work described above is an original work by ${artistName}, created in ${artwork.year ?? 'the year indicated'}. This certificate of authenticity accompanies the work and confirms its originality and provenance. The artist guarantees the authenticity of this work and its description as stated above. This certificate is an integral part of the artwork and should be kept with it.`

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a1a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }

    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: 52px; background: #111;
      display: flex; align-items: center; gap: 12px; padding: 0 20px;
      font-size: 13px; color: #999;
    }
    .toolbar-title { color: #fff; font-weight: 500; }
    .btn {
      display: inline-flex; align-items: center;
      padding: 6px 14px; border-radius: 3px; border: none;
      font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase; cursor: pointer; text-decoration: none;
    }
    .btn-primary { background: #fff; color: #111; }
    .toolbar-right { margin-left: auto; }

    .canvas {
      margin-top: 52px; padding: 32px 40px;
      display: flex; flex-direction: column; align-items: center; gap: 24px;
    }

    .page {
      width: 210mm; min-height: 297mm;
      background: white;
      padding: 18mm 18mm 14mm;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
    }

    .top-bar {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 5mm; border-bottom: 1.5px solid #111; margin-bottom: 8mm;
    }
    .site-name { font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: #888; margin-bottom: 1mm; }
    .coa-title { font-size: 18pt; font-weight: 700; letter-spacing: -0.02em; color: #111; line-height: 1; }

    .content { display: flex; flex-direction: column; flex: 1; }

    .artwork-image {
      width: 100%; max-height: 100mm;
      object-fit: contain; object-position: left center;
      margin-bottom: 7mm;
      background: #f9f9f9;
    }

    .details-grid {
      display: grid; grid-template-columns: 140px 1fr;
      gap: 1.5mm 4mm;
      margin-bottom: 8mm;
    }
    .detail-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; color: #888; padding-top: 0.3mm; }
    .detail-value { font-size: 8.5pt; color: #111; line-height: 1.35; }
    .detail-value.artist { font-weight: 700; font-size: 10pt; }
    .detail-value.artwork-title { font-style: italic; font-size: 10pt; }

    .divider { border: none; border-top: 0.5px solid #e5e5e5; margin: 6mm 0; }

    .cert-text {
      font-size: 7.5pt; line-height: 1.65; color: #444;
      border-left: 2px solid #111;
      padding-left: 4mm;
      margin-bottom: 10mm;
    }

    .signatures {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8mm; margin-top: auto;
    }
    .sig-block { display: flex; flex-direction: column; }
    .sig-line { border-top: 1px solid #111; padding-top: 2mm; }
    .sig-name { font-size: 7pt; color: #111; font-weight: 600; }
    .sig-sub { font-size: 6.5pt; color: #888; }

    .coa-footer {
      margin-top: 6mm; padding-top: 3mm;
      border-top: 0.5px solid #e5e5e5;
      display: flex; justify-content: space-between;
      font-size: 6pt; color: #bbb;
    }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      .toolbar { display: none; }
      body { background: white; }
      .canvas { background: none; padding: 0; margin: 0; }
      .page { box-shadow: none; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="toolbar">
        <span className="toolbar-title">Certificate of Authenticity</span>
        <span style={{ color: '#444' }}>·</span>
        <span>{artistName} — {artwork.title}</span>
        <div className="toolbar-right">
          <button className="btn btn-primary" id="printBtn">⌘P Print / Save PDF</button>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `document.getElementById('printBtn').onclick=()=>window.print()` }} />

      <div className="canvas">
        <div className="page">

          <div className="top-bar">
            <div>
              <div className="site-name">mynameissanderdekker.com</div>
              <div className="coa-title">Certificate of Authenticity</div>
            </div>
          </div>

          <div className="content">

            {imageUrl && (
              <img src={imageUrl} alt={artwork.title} className="artwork-image" />
            )}

            <div className="details-grid">
              <div className="detail-label">Artist</div>
              <div className="detail-value artist">{artistName}</div>

              <div className="detail-label">Title</div>
              <div className="detail-value artwork-title">{artwork.title ?? '—'}</div>

              {artwork.year && <>
                <div className="detail-label">Year</div>
                <div className="detail-value">{artwork.year}</div>
              </>}

              {artwork.medium && <>
                <div className="detail-label">Medium</div>
                <div className="detail-value">{artwork.medium}</div>
              </>}

              {dims && <>
                <div className="detail-label">Dimensions</div>
                <div className="detail-value">{dims}</div>
              </>}

              <div className="detail-label">Edition</div>
              <div className="detail-value">{editionLine}</div>

              <div className="detail-label">Certificate date</div>
              <div className="detail-value">{today()}</div>
            </div>

            <hr className="divider" />

            <div className="cert-text">{certText}</div>

            <div className="signatures">
              <div className="sig-block">
                <div style={{ height: '18mm' }}></div>
                <div className="sig-line">
                  <div className="sig-name">{artistName}</div>
                  <div className="sig-sub">Artist signature</div>
                </div>
              </div>
              <div className="sig-block">
                <div style={{ height: '18mm' }}></div>
                <div className="sig-line">
                  <div className="sig-name">Date</div>
                  <div className="sig-sub">{today()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="coa-footer">
            <span>{site.website} · {site.email}</span>
            <span>{today()}</span>
          </div>

        </div>
      </div>
    </>
  )
}

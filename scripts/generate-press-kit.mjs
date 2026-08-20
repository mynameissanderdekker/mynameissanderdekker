/**
 * generate-press-kit.mjs
 * Generates public/press-kit.html — open in browser, print to PDF (A4, no margins).
 *
 * Run: node scripts/generate-press-kit.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

function sanityImgUrl(ref, width = 1200) {
  if (!ref) return null
  // ref format: "image-{hash}-{WxH}-{ext}"
  const filename = ref.replace(/^image-/, '').replace(/-([a-z0-9]+)$/i, '.$1')
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${filename}?w=${width}&auto=format`
}

async function main() {
  console.log('Fetching artworks from Sanity...')

  // Fetch artworks with images, ordered by year desc
  const artworks = await client.fetch(`
    *[_type == "artwork" && defined(images) && count(images) > 0]{
      title, year, slug,
      "imgRef": images[0].asset._ref
    } | order(year desc)
  `)

  console.log(`Found ${artworks.length} artworks with images`)

  // Pick a hero (most recent with image) and up to 8 for the grid
  const hero    = artworks[0]
  const grid    = artworks.slice(1, 9)

  const heroUrl   = hero   ? sanityImgUrl(hero.imgRef, 1600)  : null
  const gridItems = grid.map(a => ({
    title: a.title,
    year:  a.year,
    url:   sanityImgUrl(a.imgRef, 800),
  }))

  const html = buildHTML(heroUrl, hero, gridItems)

  const outPath = resolve(process.cwd(), 'public/press-kit.html')
  writeFileSync(outPath, html, 'utf-8')

  console.log('\n✓ Written to public/press-kit.html')
  console.log('  Open in Chrome → Print → Save as PDF')
  console.log('  Settings: A4, No margins (or Minimum), Background graphics: on')
}

function buildHTML(heroUrl, hero, gridItems) {
  const gridHTML = gridItems.map(item => `
    <div class="grid-item">
      <img src="${item.url}" alt="${item.title}" loading="eager" />
      <p class="caption">${item.title}${item.year ? ` — ${item.year}` : ''}</p>
    </div>`).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sander Dekker — Press Kit 2026</title>
<style>
  /* ── Reset ─────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* ── Type ──────────────────────────────────────────────── */
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 9pt;
    color: #111;
    background: #fff;
    line-height: 1.5;
  }

  /* ── Print pages ───────────────────────────────────────── */
  @page { size: A4; margin: 0; }
  .page {
    width: 210mm;
    min-height: 297mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    background: #fff;
  }
  .page:last-child { page-break-after: avoid; }

  /* ─────────────────────────────────────────────────────────
     PAGE 1 — COVER
  ───────────────────────────────────────────────────────── */
  .cover {
    background: #0d0d0d;
    display: grid;
    grid-template-rows: 1fr auto;
    height: 297mm;
  }
  .cover-image {
    width: 100%;
    height: 240mm;
    object-fit: cover;
    object-position: center top;
    display: block;
    filter: brightness(0.88);
  }
  .cover-image-placeholder {
    width: 100%; height: 240mm;
    background: #222;
    display: flex; align-items: center; justify-content: center;
    color: #555; font-size: 11pt; letter-spacing: .1em;
  }
  .cover-footer {
    padding: 14mm 14mm 12mm;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 8mm;
  }
  .cover-name {
    color: #fff;
    font-size: 34pt;
    font-weight: 700;
    letter-spacing: -.02em;
    line-height: 1;
  }
  .cover-sub {
    color: #888;
    font-size: 8pt;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-top: 3mm;
    line-height: 1.6;
  }
  .cover-meta {
    color: #666;
    font-size: 7.5pt;
    text-align: right;
    line-height: 1.8;
    letter-spacing: .04em;
  }
  .cover-meta a { color: #888; text-decoration: none; }

  /* ─────────────────────────────────────────────────────────
     PAGE 2 — BIO + PRESS
  ───────────────────────────────────────────────────────── */
  .bio-page {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 297mm;
  }
  .bio-image-col {
    background: #f0f0f0;
    overflow: hidden;
  }
  .bio-image-col img {
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .bio-image-placeholder {
    width: 100%; height: 100%;
    background: #e8e8e8;
    display: flex; align-items: center; justify-content: center;
    color: #aaa; font-size: 8pt; letter-spacing: .1em;
  }
  .bio-text-col {
    padding: 16mm 12mm 12mm 14mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .section-label {
    font-size: 6.5pt;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 4mm;
  }
  .bio-text {
    font-size: 9.5pt;
    line-height: 1.65;
    color: #222;
    margin-bottom: 6mm;
  }
  .bio-text p + p { margin-top: 3mm; }
  .press-block { margin-top: auto; }
  .press-quote {
    font-size: 8.5pt;
    line-height: 1.55;
    color: #333;
    font-style: italic;
    padding-left: 3mm;
    border-left: 1.5pt solid #111;
    margin-bottom: 5mm;
  }
  .press-source {
    font-size: 7pt;
    color: #999;
    letter-spacing: .06em;
    margin-top: 1.5mm;
    font-style: normal;
  }
  .press-list {
    margin-top: 5mm;
    font-size: 7pt;
    color: #aaa;
    letter-spacing: .05em;
    line-height: 1.7;
    border-top: .5pt solid #e5e5e5;
    padding-top: 4mm;
  }

  /* ─────────────────────────────────────────────────────────
     PAGE 3 — SELECTED WORK
  ───────────────────────────────────────────────────────── */
  .work-page {
    padding: 12mm;
    height: 297mm;
    display: flex;
    flex-direction: column;
  }
  .work-page .section-label { margin-bottom: 6mm; }
  .work-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 3mm;
    flex: 1;
  }
  .grid-item img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    display: block;
    background: #f0f0f0;
  }
  .grid-item .caption {
    font-size: 6.5pt;
    color: #888;
    margin-top: 1.5mm;
    line-height: 1.3;
    letter-spacing: .02em;
  }

  /* ─────────────────────────────────────────────────────────
     PAGE 4 — CV + CONTACT
  ───────────────────────────────────────────────────────── */
  .cv-page {
    padding: 14mm 14mm 12mm;
    height: 297mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    column-gap: 10mm;
    row-gap: 0;
  }
  .cv-page .page-title {
    grid-column: 1 / -1;
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: -.02em;
    margin-bottom: 8mm;
    padding-bottom: 4mm;
    border-bottom: 1pt solid #111;
  }
  .cv-col h3 {
    font-size: 6.5pt;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 3mm;
    margin-top: 5mm;
  }
  .cv-col h3:first-child { margin-top: 0; }
  .cv-row {
    display: grid;
    grid-template-columns: 10mm 1fr;
    gap: 1mm 3mm;
    margin-bottom: 1mm;
    font-size: 8pt;
    line-height: 1.45;
    color: #333;
  }
  .cv-year { color: #aaa; font-variant-numeric: tabular-nums; }
  .cv-page .gallery-block {
    grid-column: 1 / -1;
    margin-top: auto;
    padding-top: 6mm;
    border-top: .5pt solid #e5e5e5;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6mm;
  }
  .gallery-entry { font-size: 7.5pt; line-height: 1.6; color: #444; }
  .gallery-entry strong { display: block; font-size: 8pt; color: #111; margin-bottom: .5mm; }
  .gallery-entry a { color: #aaa; text-decoration: none; }
  .contact-strip {
    grid-column: 1 / -1;
    margin-top: 6mm;
    padding-top: 4mm;
    border-top: .5pt solid #e5e5e5;
    font-size: 7pt;
    color: #aaa;
    letter-spacing: .05em;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<!-- ═══════════════ PAGE 1 — COVER ═══════════════ -->
<div class="page cover">
  ${heroUrl
    ? `<img class="cover-image" src="${heroUrl}" alt="${hero?.title ?? 'Sander Dekker'}" />`
    : `<div class="cover-image-placeholder">[ ARTWORK IMAGE ]</div>`}
  <div class="cover-footer">
    <div>
      <div class="cover-name">Sander<br>Dekker</div>
      <div class="cover-sub">
        Artist · Amsterdam, NL · b. 1980<br>
        Photography · Installation · Publication
      </div>
    </div>
    <div class="cover-meta">
      hello@mynameissanderdekker.com<br>
      mynameissanderdekker.com<br>
      Press Kit 2026
    </div>
  </div>
</div>

<!-- ═══════════════ PAGE 2 — BIO + PRESS ═══════════════ -->
<div class="page bio-page">
  <div class="bio-image-col">
    ${gridItems[0]?.url
      ? `<img src="${gridItems[0].url}" alt="${gridItems[0].title}" />`
      : `<div class="bio-image-placeholder">[ ARTWORK IMAGE ]</div>`}
  </div>
  <div class="bio-text-col">
    <div>
      <div class="section-label">Biography</div>
      <div class="bio-text">
        <p>Sander Dekker (Amsterdam, 1980) is an artist working with photography, installation and self-published books and zines.</p>
        <p>His work centres on how people present themselves — to each other, to cameras, and to the world they build around themselves. The core of his practice is The Social Media Project, a decade-long series of encounters with strangers photographed in their own homes after first contact online. It caught something specific: a brief moment when reaching out to a stranger felt open, easy and charged with possibility. That openness is slowly disappearing. What remains is a document of a particular kind of human behaviour that feels increasingly rare.</p>
        <p>The questions that project raised have continued to drive everything since — through permanent installations, handmade publications, participatory work, and ongoing projects centred on people who push back against external pressure simply by being fully, visibly themselves.</p>
      </div>
    </div>

    <div class="press-block">
      <div class="section-label">Selected Press</div>

      <div class="press-quote">
        "While embracing his own strangeness, he makes a true connection with his models. It's what makes his work so very appealing."
        <div class="press-source">Marloes van Vugt — foreword, My Name Is Sander Dekker Nº.2</div>
      </div>

      <div class="press-quote">
        "What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves."
        <div class="press-source">Flor Linckens — Gallery Viewer</div>
      </div>

      <div class="press-quote">
        "Like Arbus, Clark and Sultan, Sander Dekker is a child of his time."
        <div class="press-source">Edo Dijksterhuis — Het Parool</div>
      </div>

      <div class="press-list">
        NL: Het Parool · de Volkskrant &nbsp;·&nbsp;
        International: Juxtapoz · VICE · Purple France · CODE Magazine · Lodown · BLINK Korea · Snoecks · Le Petit Voyeur &nbsp;·&nbsp;
        Platforms: FOAM · Gallery Viewer
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════ PAGE 3 — SELECTED WORK ═══════════════ -->
<div class="page work-page">
  <div class="section-label">Selected Work</div>
  <div class="work-grid">
    ${gridHTML || '<p style="color:#aaa;font-size:8pt;">No artwork images found — upload images to artworks in Studio first.</p>'}
  </div>
</div>

<!-- ═══════════════ PAGE 4 — CV + CONTACT ═══════════════ -->
<div class="page cv-page">
  <div class="page-title">Exhibitions &amp; Projects</div>

  <div class="cv-col">
    <h3>The Social Media Project — Solo</h3>
    <div class="cv-row"><span class="cv-year">2022</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2020</span><span>Strayfield Gallery, Copenhagen DK</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Amsterdam Central Station NL</span></div>
    <div class="cv-row"><span class="cv-year">2016</span><span>30Works Gallery, Cologne DE</span></div>
    <div class="cv-row"><span class="cv-year">2015</span><span>Walls Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2014</span><span>Majke Hüsstege, Den Bosch NL</span></div>
    <div class="cv-row"><span class="cv-year">2012</span><span>Walls Gallery, Amsterdam NL</span></div>

    <h3>Art Fairs</h3>
    <div class="cv-row"><span class="cv-year">2026</span><span>NAP+, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2024</span><span>NAP+, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2022</span><span>Unseen Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2017</span><span>6voor6 Art Fair, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2015</span><span>KunstRAI, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2014</span><span>PAN Amsterdam NL</span></div>

    <h3>Group Exhibitions</h3>
    <div class="cv-row"><span class="cv-year">2024</span><span>40Y Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2022</span><span>Caesuur &amp; Lípa, Middelburg NL</span></div>
    <div class="cv-row"><span class="cv-year">2022</span><span>Luxfer &amp; Lípa, Česká Skalice CZ</span></div>
    <div class="cv-row"><span class="cv-year">2020</span><span>Strayfield Gallery, Hellerup DK</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Arti et Amicitiae, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2013</span><span>FOAM, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2013</span><span>Nuit Blanche, Amsterdam NL</span></div>
  </div>

  <div class="cv-col">
    <h3>The Social Landscape (TenFifteen) — Permanent</h3>
    <div class="cv-row"><span class="cv-year">2026</span><span>Leica Store, Lisse NL</span></div>
    <div class="cv-row"><span class="cv-year">2020</span><span>Strayfield Gallery, Hellerup DK</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Hotel Not Hotel, Amsterdam NL</span></div>

    <h3>The Social Landscape — Exhibited</h3>
    <div class="cv-row"><span class="cv-year">2026</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2025</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2019</span><span>Former ABN AMRO, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2018</span><span>Amsterdam Central Station NL</span></div>

    <h3>The Zine Project</h3>
    <div class="cv-row"><span class="cv-year">2026</span><span>Studio, by appointment, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2025</span><span>Torch Gallery, Amsterdam NL</span></div>
    <div class="cv-row"><span class="cv-year">2023</span><span>Josilda da Conceição, Amsterdam NL</span></div>

    <h3>Publications</h3>
    <div class="cv-row"><span class="cv-year">2021–25</span><span>The Zine Project — 10 handmade limited-edition zines. All editions sold out.</span></div>
    <div class="cv-row"><span class="cv-year">2016</span><span>My Name Is Sander Dekker Vol. 2 (ISBN 9789082111330)</span></div>
    <div class="cv-row"><span class="cv-year">2015</span><span>My Name Is Sander Dekker Vol. 1.5 (ISBN 9789082111323)</span></div>
    <div class="cv-row"><span class="cv-year">2013</span><span>My Name Is Sander Dekker Vol. 1 (ISBN 9789082111316)</span></div>
  </div>

  <div class="gallery-block">
    <div class="gallery-entry">
      <strong>Mother Gallery</strong>
      Torch Art Gallery<br>
      Amsterdam, NL<br>
      <a href="https://torchgallery.com">torchgallery.com</a>
    </div>
    <div class="gallery-entry">
      <strong>Special Projects</strong>
      Josilda da Conceição Gallery<br>
      Amsterdam, NL<br>
      <a href="https://josildadaconceicao.com">josildadaconceicao.com</a>
    </div>
    <div class="gallery-entry">
      <strong>Denmark</strong>
      Strayfield Gallery<br>
      Hellerup, DK<br>
      <a href="https://strayfield.dk">strayfield.dk</a>
    </div>
  </div>

  <div class="contact-strip">
    <span>Sander Dekker · hello@mynameissanderdekker.com · mynameissanderdekker.com · Amsterdam, NL</span>
    <span>© Sander Dekker 2026 · Press Kit</span>
  </div>
</div>

</body>
</html>`
}

main().catch(err => { console.error(err); process.exit(1) })

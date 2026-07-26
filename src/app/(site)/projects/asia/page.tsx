/* eslint-disable @next/next/no-img-element */
import ZineViewer from '@/components/ZineViewer'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const IMAGES = [
  `${BASE}/2026/05/9.jpg`,
  `${BASE}/2026/05/L1000018-edit.jpg`,
  `${BASE}/2026/05/IMG_0420.jpg`,
]

export default function AsiaPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/05/IMG_2887-Edit.jpg`} alt="A.S.I.A." />
      </div>

      <h1 className="project-title">Zine Nº.9 &#39;A.S.I.A.&#39;</h1>
      <p className="project-date" style={{ fontStyle: 'italic' }}>February 2025 · Edition of 40</p>

      <div className="project-intro">
        <p>60 pages, hand-stitched coptic binding, sleeve cover, 15×21cm. Signed, numbered and with original print.</p>
        <p>A.S.I.A. — Addressing Structural Inequalities in Amsterdam — was born close to home. Despite Amsterdam's reputation for tolerance and openness, racism against people of Asian descent remains a quiet but persistent reality in the Netherlands — one that rarely receives the attention it deserves.</p>
        <p>The project centres on seven individuals with Asian heritage who unapologetically embrace their own identity, using self-expression to challenge stereotypes — directly and indirectly. They are not presented as victims of discrimination, but as people who have turned visibility into a form of resistance.</p>
      </div>

      <ZineViewer pdfUrl="https://mynameissanderdekker.com/wp-content/uploads/2025/07/No9-Asia.pdf" />

      <div className="project-gallery">
        {IMAGES.map((src) => (
          <img key={src} src={src} alt="A.S.I.A." />
        ))}
      </div>
    </>
  )
}

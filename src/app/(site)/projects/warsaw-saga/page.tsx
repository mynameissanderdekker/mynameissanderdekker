/* eslint-disable @next/next/no-img-element */
import ZineViewer from '@/components/ZineViewer'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const IMAGES = [
  `${BASE}/2026/05/IMG_0145-edit.jpg`,
  `${BASE}/2026/05/IMG_0376-edit.jpg`,
  `${BASE}/2026/05/IMG_0162-edit.jpg`,
  `${BASE}/2026/05/IMG_0113-edit.jpg`,
]

export default function WarsawSagaPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/05/DSC04034.jpg`} alt="The Warsaw SAGA" />
      </div>

      <h1 className="project-title">Zine Nº.8 'The Warsaw SAGA'</h1>
      <p className="project-date" style={{ fontStyle: 'italic' }}>June 2024 · Edition of 40</p>

      <div className="project-intro">
        <p>I came across an article that highlighted Poland as the worst country for LGBTQ+ individuals within the EU. It stuck with me, and I couldn't shake it off. While many European countries are progressing towards greater freedom and equality, Poland seems to be moving in the opposite direction.</p>
        <p>Motivated by this, I decided to visit Warsaw and shine a light on the brave people who stay true to themselves despite the hatred around them. I named my project 'THE WARSAW SAGA,' a fitting title that stands for Sexuality And Gender Acceptance and embodies the stories I aim to tell.</p>
        <p>Armed with my camera, I set out to create a photo series showcasing people who embrace their authenticity despite the hostility. Their portraits focus on self-expression, equality, and sexuality, emphasizing joy and liberation. The stories that accompany their portraits not only show the challenges they face, but also the resilience they draw from these challenges to effect change.</p>
        <p>This project is dedicated to breaking down barriers and creating a future where everyone's SAGA is valued, one story at a time.</p>
      </div>

      <ZineViewer pdfUrl="https://mynameissanderdekker.com/wp-content/uploads/2025/08/No8-The-Warsaw-SAGA.pdf" />

      <div className="project-gallery">
        {IMAGES.map((src) => (
          <img key={src} src={src} alt="The Warsaw SAGA" />
        ))}
      </div>
    </>
  )
}

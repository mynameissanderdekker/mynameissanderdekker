/* eslint-disable @next/next/no-img-element */

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

export default function ItIsUsPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/01/Use.jpg`} alt="It Is Us" />
      </div>

      <h1 className="project-title">It Is Us</h1>
      <p className="project-date" style={{ fontStyle: 'italic' }}>A body beyond perfection.</p>

      <div className="project-intro">
        <p>People are invited to anonymously photograph a part of their body they feel strongly about — something they are proud of, or something they usually hide. A scar, a birthmark, an uneven body part, a detail shaped by time or experience. The choice is entirely theirs.</p>
        <p>Nothing is directed, corrected or filtered. The photographs are printed on site and gradually brought together to form collective bodies — each one composed of many individual images, creating a shared presence built from difference. Character emerges through contrast: confidence next to doubt, vulnerability alongside strength.</p>
        <p>The outcome is always a surprise. As the bodies take shape, they often provoke recognition, curiosity and a quiet sense of humour. Not because they are perfect, but because they feel familiar in unexpected ways.</p>
        <p>It Is Us responds to the dominant ideas of perfection that saturate social media — not with an idealised image, but with a body that reflects who we are collectively: marked, uneven, personal and human. Not an image of who we could become, but a recognition of who we already are.</p>
      </div>

      <div className="project-gallery">
        <img src={`${BASE}/2026/01/05.jpg`} alt="It Is Us installation" />
        <img src={`${BASE}/2026/01/ezgif-11bc24516138084f.gif`} alt="It Is Us installation" />
      </div>
    </>
  )
}

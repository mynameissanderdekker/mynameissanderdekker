/* eslint-disable @next/next/no-img-element */
import ZineViewer from '@/components/ZineViewer'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const IMAGES = [
  `${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-cover-e1777915768154.jpg`,
  `${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-01.jpg`,
  `${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-02.jpg`,
  `${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-03.jpg`,
  `${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-04.jpg`,
]

export default function GirlsInParisPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/01/girls-in-paris-%C2%A9sander-dekker-05.jpg`} alt="Girls in Paris" />
      </div>

      <h1 className="project-title">Girls in Paris</h1>
      <p className="project-date">Exhibition · Josilda da Conceição Gallery, Amsterdam · 2022</p>

      <div className="project-intro">
        <p>The exhibition features stories and photographs of eight Girls in Paris, who are challenging the status quo and deconstructing paradigms. Dekker's journey began when he was commissioned to create a feminist calendar in France. To his surprise, he discovered that France still has a significant gap between men and women, with domestic violence against women often downplayed and not taken seriously. This realization prompted him to pack his bags and head back to Paris to meet and photograph women who are part of a new generation — a wave of strong women challenging the status quo and deconstructing paradigms.</p>
        <p>The result of his journey is an exhibition that showcases these women's stories and their struggles for self-expression, equality, and sexuality. The photographs are accompanied by excerpts from the conversations, printed on transparent canvases that shield the works, requiring visitors to read them first before viewing the photos. This presentation is a snapshot of what drives them, the conservative thinking they face, and the controversies that arise from it. Through their beautiful struggle, they are instigating their own kind of French Revolution.</p>
        <p>— This exhibition originated from the Zine project.</p>
      </div>

      <ZineViewer pdfUrl="https://mynameissanderdekker.com/wp-content/uploads/2025/11/Girls-in-Paris-1.pdf" />

      <div className="project-gallery">
        {IMAGES.map((src) => (
          <img key={src} src={src} alt="Girls in Paris" />
        ))}
      </div>
    </>
  )
}

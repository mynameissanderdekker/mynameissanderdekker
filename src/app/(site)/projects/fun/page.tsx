/* eslint-disable @next/next/no-img-element */

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const FEATURED = [
  `${BASE}/2026/03/sander-dekker-fun-024.jpg`,
  `${BASE}/2026/03/sander-dekker-fun-026.jpg`,
  `${BASE}/2026/03/sander-dekker-fun-025.gif`,
]

const GALLERY = [
  `${BASE}/2026/07/sander-dekker-fun-037.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-015.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-027.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-033.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-016.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-017.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-028.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-018.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-022.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-021.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-012.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-023.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-029.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-030.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-031.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-014.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-032.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-013.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-011.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-010.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-009.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-008.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-007.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-006.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-005.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-003.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-002.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-036.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-034.jpg`,
  `${BASE}/2026/07/sander-dekker-fun-035.jpg`,
]

export default function FunPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/07/sander-dekker-fun-001.jpg`} alt="#Fun" />
      </div>

      <h1 className="project-title">#Fun</h1>
      <p className="project-date">2015 – present</p>

      <div className="project-intro">
        <p>The moment a camera appears, something switches. Smiles widen, poses form, joy becomes demonstrable. It happens almost automatically — a Pavlovian reflex so ingrained that most people don't notice they're doing it.</p>
        <p>Dekker notices. And stays put.</p>
        <p>#Fun is a long-term series in which Dekker inserts himself into everyday situations as a completely neutral, expressionless presence. He does not pose. He does not react. While those around him instinctively perform for the lens, Dekker remains still — and in doing so, transforms that instinct into something visible, almost absurd.</p>
        <p>He has since taken the work one step further. Dekker had a mask made of his own deadpan face — complete with his long blond hair — and invites others to wear it. The figure who refuses to perform becomes the role everyone else steps into.</p>
        <p>The series is ongoing.</p>
      </div>

      <div className="project-gallery">
        {FEATURED.map((src) => (
          <img key={src} src={src} alt="#Fun" />
        ))}
      </div>

      <div className="project-gallery">
        {GALLERY.map((src) => (
          <img key={src} src={src} alt="#Fun" />
        ))}
      </div>
    </>
  )
}

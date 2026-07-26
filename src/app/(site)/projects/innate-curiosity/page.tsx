/* eslint-disable @next/next/no-img-element */

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const WORKS = [
  {
    title: 'V1 The Peek',
    subtitle: 'blinds, 2026',
    image: `${BASE}/2026/07/Innate-Curiosity-The-Peek%E2%80%94V1.jpg`,
    text: 'A closed set of aluminium venetian blinds mounted to the wall, with a backlit photograph behind them. To see anything, the viewer has to open the blinds by hand, come closer, find the right angle. The image rewards effort and punishes the casual glance.',
  },
  {
    title: 'V1 The Find',
    subtitle: 'wastebin with Whisper, 2026',
    image: `${BASE}/2026/07/Innate-Curiosity-The-Find%E2%80%94V1-1.jpg`,
    text: 'A Dutch railway wastebin. Inside, among period debris, a brown paper bag contains Whisper — a fictional 1980s adult magazine, entirely handmade by the artist, indistinguishable from the source material of its time. To see it, the viewer must reach into the bin and lift it out.',
  },
  {
    title: 'V1 The Trace',
    subtitle: 'chair with traces, 2026',
    image: `${BASE}/2026/07/Innate-Curiosity-The-Trace%E2%80%94V1.jpg`,
    text: 'A white plastic garden chair with a charging cable resting on the seat. On the floor beside it, a pair of binoculars and a classic plastic tray of fries. Someone was here. He is not anymore.',
  },
]

export default function InnateCuriosityPage() {
  return (
    <>
      <div className="project-hero">
        <img src={`${BASE}/2026/07/Innate-Curiosity.jpg`} alt="Innate Curiosity" />
      </div>

      <h1 className="project-title">Innate Curiosity</h1>
      <p className="project-date">2026 –</p>

      <div className="project-intro">
        <p>Growing up without a phone meant finding your own way to see the world. You had to seek things out. You had to be resourceful. You had to take risks — and sometimes get caught.</p>
        <p>Through the gap in the blinds. Through a steamed-up bathroom window. Through a peephole in a door. These were the instruments of a pre-algorithmic curiosity. Physical, embodied, slightly transgressive. The thrill was inseparable from the effort.</p>
        <p>That impulse — to look, to wonder, to find things out for yourself — is what Innate Curiosity is about. Not nostalgia for a simpler time, but a question about what happens to curiosity when it is no longer necessary. When the algorithm anticipates your interests before you have formed them. When discovery is served rather than earned.</p>
        <p>The works in this series invite the viewer back into that earlier mode. Objects that ask you to lean in, to reach, to look for yourself. The discomfort is part of it. So is the reward.</p>
        <p>Dekker was born in 1980, the last generation to grow up entirely without the internet. He approaches this not as a technophobe but as a witness. What do we lose when we stop looking for ourselves?</p>
      </div>

      <div className="work-grid">
        {WORKS.map((work) => (
          <div key={work.title} className="work-card">
            <img src={work.image} alt={work.title} className="work-card-img" />
            <h3 className="work-card-title">
              {work.title} <em>— {work.subtitle}</em>
            </h3>
            <p className="work-card-desc">{work.text}</p>
          </div>
        ))}
      </div>
    </>
  )
}

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const FEATURED_ZINES = [
  {
    number: 'Nº2',
    title: 'Girls in Paris',
    meta: 'September 2022 · Edition of 35',
    desc: 'Eight women living in Paris, each navigating freedom, self-expression and sexuality on her own terms — and each, in her own way, fighting to challenge the status quo. Their portraits are paired with deeply personal stories about how they look, how they are judged, and how they push back.',
    image: `${BASE}/2026/05/Zine-N02-Girls-in-Paris.jpg`,
    href: '/projects/girls-in-paris',
  },
  {
    number: 'Nº8',
    title: 'The Warsaw SAGA',
    meta: 'June 2024 · Edition of 40',
    desc: 'Poland has been named the worst country in the EU for LGBTQ+ individuals. Dekker went to Warsaw to meet people who stay true to themselves despite the hatred around them — and found joy, resilience and liberation in unexpected places.',
    image: `${BASE}/2026/05/Zine-N08-The-Warsaw-SAGA-1.jpg`,
    href: '/projects/warsaw-saga',
  },
  {
    number: 'Nº9',
    title: 'A.S.I.A.',
    meta: 'February 2025 · Edition of 40',
    desc: 'Amsterdam has a reputation for tolerance. But even here, racism against people of Asian descent is a quiet, persistent reality. For A.S.I.A., Dekker sought out seven individuals who push back — simply by being fully, visibly themselves.',
    image: `${BASE}/2026/05/Zine-N09-ASIA-1.jpg`,
    href: '/projects/asia',
  },
]

const ALL_ZINES = [
  {
    number: 'Nº1',
    title: 'Annemarijn',
    meta: 'September 2021 · Edition of 25',
    desc: "It began with red wine, old rock songs and a trip together. Her Instagram tagline — 'fruit-eating forest fairy' — turned out to be surprisingly accurate.",
    image: `${BASE}/2026/05/Zine-N01-Annemarijn.jpg`,
  },
  {
    number: 'Nº3',
    title: 'Janna',
    meta: 'September 2022 · Edition of 35',
    desc: 'Janna is a performer who explores what it means to feel vulnerable, weird and sensual — all at once. She takes femininity fully into her own hands, turning it into a source of power.',
    image: `${BASE}/2026/05/Zine-N03-Janna.jpg`,
  },
  {
    number: 'Nº4',
    title: 'Cats & Dogs',
    meta: 'December 2022 · Edition of 35',
    desc: 'During The Social Media Project, Dekker met not only remarkable people but also their cats and dogs. This zine is a tribute to those furry co-stars and the unconditional love they offer us humans.',
    image: `${BASE}/2026/05/Zine-N04-Cats-Dogs.jpg`,
  },
  {
    number: 'Nº5',
    title: 'Mexico',
    meta: 'April 2023 · Edition of 35',
    desc: "A tribute to Mexico's culture, its colours and the fleeting moments of happiness found along the way — shared with two of his closest friends and one local whose energy was made for the camera.",
    image: `${BASE}/2026/05/Zine-N05-Mexico.jpg`,
  },
  {
    number: 'Nº6',
    title: 'Claudia',
    meta: 'September 2023 · Edition of 35',
    desc: 'Claudia lives like she belongs in another era. Built from paper, foil, handwritten notes and aluminium sheets — with peepholes — this zine places Dekker in the role of the curious observer.',
    image: `${BASE}/2026/05/Zine-N06-Claudia.jpg`,
  },
  {
    number: 'Nº7',
    title: '12.5Y Anniversary',
    meta: 'December 2023 · Edition of 50',
    desc: '12.5 years ago, Dekker moved to Amsterdam — unknowingly kickstarting his life as an artist. This zine is his tribute to the city, or more precisely, to the people who make it so beautiful.',
    image: `${BASE}/2026/05/Zine-N07-Anniversary-1.jpg`,
  },
  {
    number: 'Nº10',
    title: 'TenFifteen',
    meta: 'April 2025 · Edition of 150',
    desc: 'This zine pulls a selection of images from the TenFifteen installation and puts them in your hands — each one with the story behind it. Includes a unique TenFifteen print to frame and hang at home.',
    image: `${BASE}/2026/05/Zine-N10-TenFifteen-1.jpg`,
  },
  {
    number: '',
    title: 'The Collectors Box',
    meta: 'May 2025',
    desc: 'As a final gesture, a limited collectors box was produced — designed to house all ten zines. Made for those who had followed and collected the series from the very beginning.',
    image: `${BASE}/2026/05/Box.jpg`,
  },
]

const GALLERY = [
  `${BASE}/2025/04/DSC06719.jpg`,
  `${BASE}/2025/04/DSC01221.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-09.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-07.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-10.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-11.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-03.jpg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-13.jpg`,
]

export default function ZineProjectPage() {
  return (
    <>
      {/* Top video */}
      <div className="project-video">
        <video controls playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <source src={`${BASE}/2026/05/C0190-3.mp4`} type="video/mp4" />
        </video>
      </div>

      <h1 className="project-title">The Zine Project</h1>
      <p className="project-date">2021 – 2025</p>

      <div className="project-intro">
        <p>Like The Social Media Project before it, The Zine Project began on social media — but where that project was driven by the surprise of the encounter, the gap between who people appeared to be online and who they turned out to be in person, the zines went deeper. Each one was a sustained, intimate exploration of a single person, place or theme, built on trust, time and close collaboration.</p>
        <p>Between 2021 and 2025, Dekker developed ten completely handmade zines, each published in a very limited edition. The subjects range widely — from intimate portraits and personal tributes to projects rooted in social urgency. From a vacation in Mexico to LGBTQ+ lives under pressure in Warsaw. From cats and dogs to racism in the Netherlands. Each project found its own form, its own tone, its own reason to exist.</p>
        <p>Each zine had sold out within minutes of release. The series concluded in 2025 with an exhibition at TORCH Gallery Amsterdam that brought the entire project together for the first time.</p>
      </div>

      {/* Featured zines with links */}
      <div className="zine-grid">
        {FEATURED_ZINES.map((zine) => (
          <Link key={zine.title} href={zine.href} className="zine-card zine-card-link">
            <img src={zine.image} alt={zine.title} className="zine-card-img" />
            <div className="zine-card-body">
              <h3 className="zine-card-title">{zine.number} {zine.title}</h3>
              <p className="zine-card-meta">{zine.meta}</p>
              <p className="zine-card-desc">{zine.desc}</p>
              <span className="zine-read-link">Read the zine →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* All other zines */}
      <div className="zine-grid zine-grid-all">
        {ALL_ZINES.map((zine) => (
          <div key={zine.title} className="zine-card">
            <img src={zine.image} alt={zine.title} className="zine-card-img" />
            <div className="zine-card-body">
              <h3 className="zine-card-title">{zine.number ? `${zine.number} ` : ''}{zine.title}</h3>
              <p className="zine-card-meta">{zine.meta}</p>
              <p className="zine-card-desc">{zine.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Exhibition gallery */}
      <div className="project-gallery" style={{ marginTop: '64px' }}>
        {GALLERY.map((src) => (
          <img key={src} src={src} alt="The Zine Project exhibition" />
        ))}
      </div>

      {/* Closing video */}
      <div className="project-video" style={{ marginTop: '48px' }}>
        <video controls playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <source src={`${BASE}/2026/06/Final-2K.mp4`} type="video/mp4" />
        </video>
      </div>
    </>
  )
}

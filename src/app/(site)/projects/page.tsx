import Link from 'next/link'

const PROJECTS = [
  {
    title: 'The Social Media Project',
    date: '2011 – 2021',
    desc: 'A decade of portraits made with strangers first met online, photographed in their own homes.',
    slug: 'the-social-media-project',
  },
  {
    title: 'TenFifteen — The Social Landscape',
    date: '2014 – present',
    desc: 'Thousands of 10×15cm black-and-white photographs forming an ever-expanding installation.',
    slug: 'tenfifteen',
  },
  {
    title: 'The Zine Project',
    date: '2021 – 2025',
    desc: 'Ten handmade publications, each a sustained exploration of a person, place or theme.',
    slug: 'the-zine-project',
  },
  {
    title: '#Fun',
    date: '2015 – present',
    desc: 'An ongoing series exploring the automatic performance triggered by the presence of a camera.',
    slug: 'fun',
  },
  {
    title: 'It Is Us',
    date: 'ongoing',
    desc: 'Participatory work in which anonymous body photographs form collective, composite bodies.',
    slug: 'it-is-us',
  },
  {
    title: 'Innate Curiosity',
    date: '2026 –',
    desc: 'Installation works that ask viewers to lean in, reach, and look for themselves.',
    slug: 'innate-curiosity',
  },
  {
    title: 'Girls in Paris',
    date: '2022',
    desc: 'Eight women in Paris navigating freedom, self-expression and sexuality on their own terms.',
    slug: 'girls-in-paris',
  },
  {
    title: 'The Warsaw SAGA',
    date: '2024',
    desc: 'Portraits of LGBTQ+ individuals in Warsaw — a city moving against the European tide.',
    slug: 'warsaw-saga',
  },
  {
    title: 'A.S.I.A.',
    date: '2025',
    desc: 'Seven individuals with Asian heritage in Amsterdam who make visibility an act of resistance.',
    slug: 'asia',
  },
]

export default function ProjectsPage() {
  return (
    <>
      <h1 className="page-title">Projects</h1>

      <div className="projects-list">
        {PROJECTS.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className="projects-item">
            <span className="projects-date">{project.date}</span>
            <div className="projects-info">
              <h2 className="projects-name">{project.title}</h2>
              <p className="projects-desc">{project.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

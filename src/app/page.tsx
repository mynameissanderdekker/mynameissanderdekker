import Nav from '@/components/Nav'
import MindmapHomepage from '@/components/MindmapHomepage'

const personSchema = {
  '@context': 'https://schema.org',
  '@type': ['Person', 'Artist'],
  name: 'Sander Dekker',
  url: 'https://www.mynameissanderdekker.com',
  email: 'hello@mynameissanderdekker.com',
  jobTitle: 'Photographer',
  description: 'Amsterdam-based documentary photographer working on identity, self-expression and social acceptance — through zines, exhibitions and limited editions.',
  address: { '@type': 'PostalAddress', addressLocality: 'Amsterdam', addressCountry: 'NL' },
  sameAs: [
    'https://www.instagram.com/mynameissanderdekker',
    'https://www.mynameissanderdekker.com',
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <Nav />
      <MindmapHomepage />
    </>
  )
}

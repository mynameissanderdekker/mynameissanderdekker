import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import MindmapHomepage from '@/components/MindmapHomepage'

const BASE_URL = 'https://www.mynameissanderdekker.com'

export const metadata: Metadata = {
  description: 'Sander Dekker is an Amsterdam-based artist working with photography, installation and publications. His work explores identity, self-expression and how people present themselves in an age of social media.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'My name is Sander Dekker',
    description: 'Sander Dekker is an Amsterdam-based artist working with photography, installation and publications. His work explores identity, self-expression and how people present themselves in an age of social media.',
    url: BASE_URL,
    siteName: 'Sander Dekker',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My name is Sander Dekker',
    description: 'Sander Dekker is an Amsterdam-based artist working with photography, installation and publications. His work explores identity, self-expression and how people present themselves in an age of social media.',
  },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sander Dekker',
  birthDate: '1980',
  jobTitle: 'Artist',
  url: BASE_URL,
  email: 'hello@mynameissanderdekker.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Amsterdam',
    addressCountry: 'NL',
  },
  description: 'Amsterdam-based artist working with photography, installation, video and publications. His work documents how people present themselves — to each other, to cameras, and to the world they construct around themselves.',
  sameAs: [
    'https://www.instagram.com/mynameissanderdekker',
    'https://www.linkedin.com/in/mynameissanderdekker',
  ],
  affiliation: [
    {
      '@type': 'Organization',
      name: 'Torch Art Gallery',
      url: 'https://www.torchgallery.com',
    },
    {
      '@type': 'Organization',
      name: 'Josilda da Conceição Gallery',
      url: 'https://www.josildadaconceicao.com',
    },
    {
      '@type': 'Organization',
      name: 'Strayfield Gallery',
      url: 'https://www.strayfield.dk',
    },
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

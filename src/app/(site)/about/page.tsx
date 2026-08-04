import type { Metadata } from 'next'
import AboutPageClient from './AboutPageClient'

const BASE_URL = 'https://www.mynameissanderdekker.com'

export const metadata: Metadata = {
  title: 'About',
  description: 'Sander Dekker (1980) — biography, selected exhibitions, press and publications. Amsterdam-based artist represented by Torch Art Gallery.',
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: 'About — Sander Dekker',
    description: 'Sander Dekker (1980) — biography, selected exhibitions, press and publications. Amsterdam-based artist represented by Torch Art Gallery.',
    url: `${BASE_URL}/about`,
    siteName: 'Sander Dekker',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — Sander Dekker',
    description: 'Sander Dekker (1980) — biography, selected exhibitions, press and publications. Amsterdam-based artist represented by Torch Art Gallery.',
  },
}

const profilePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: 'Sander Dekker',
    description: 'Amsterdam-based artist working with photography, installation, video and publications.',
    url: `${BASE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
      />
      <AboutPageClient />
    </>
  )
}

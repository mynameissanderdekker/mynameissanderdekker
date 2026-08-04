import type { Metadata } from 'next'
import ContactPageClient from './ContactPageClient'

const BASE_URL = 'https://www.mynameissanderdekker.com'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Sander Dekker — for artwork enquiries, exhibition proposals, press and collaborations.',
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact — Sander Dekker',
    description: 'Get in touch with Sander Dekker — for artwork enquiries, exhibition proposals, press and collaborations.',
    url: `${BASE_URL}/contact`,
    siteName: 'Sander Dekker',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact — Sander Dekker',
    description: 'Get in touch with Sander Dekker — for artwork enquiries, exhibition proposals, press and collaborations.',
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}

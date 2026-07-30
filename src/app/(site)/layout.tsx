import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { client } from '@/sanity/lib/client'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await client.fetch<{ googleSiteVerification?: string }>(
    `*[_type == "siteSettings"][0]{ googleSiteVerification }`,
    {},
    { next: { revalidate: 3600 } }
  ).catch(() => null)

  if (!settings?.googleSiteVerification) return {}

  return {
    verification: {
      google: settings.googleSiteVerification,
    },
  }
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main className="site-main">
        {children}
      </main>
      <Footer />
    </>
  )
}

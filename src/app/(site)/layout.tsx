import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ExhibitionAnnouncement, { type AnnouncedExhibition } from '@/components/ExhibitionAnnouncement'
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

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // De pop-up heeft een eigen periode, los van de expositiedatums: je kondigt
  // meestal eerder aan dan de opening, en haalt hem eerder weg dan de expositie
  // voorbij is. Beide velden mogen leeg — dan begint hij meteen, of blijft hij
  // tot je het vinkje uitzet.
  const today = new Date().toISOString().slice(0, 10)
  const announced = await client
    .fetch<AnnouncedExhibition | null>(
      `*[_type == "exhibition" && showOnHomepage == true
         && (!defined(announceFrom)  || announceFrom  <= $today)
         && (!defined(announceUntil) || announceUntil >= $today)]
       | order(coalesce(announceFrom, startDate) desc)[0]{
        _id, title, hasPage, startDate, endDate,
        "slug": slug.current,
        "venueName": coalesce(venue.name, gallery),
        "imageUrl": image.asset->url
      }`,
      { today },
      { next: { revalidate: 300 } }
    )
    .catch(() => null)

  return (
    <>
      <ExhibitionAnnouncement exhibition={announced} />
      <Nav />
      <main className="site-main">
        {children}
      </main>
      <Footer />
    </>
  )
}

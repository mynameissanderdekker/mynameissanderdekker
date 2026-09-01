import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import ProposalPage from './ProposalPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: 'noindex, nofollow' }

const sanityRead = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [proposal, settings] = await Promise.all([
    sanityRead.fetch(
      `*[_type == "proposal" && _id in [$id, "drafts." + $id]][0] {
        _id,
        title,
        status,
        expiryDate,
        message,
        language,
        clientLocation,
        "_createdAt": _createdAt,
        "contact": contact->{
          firstName, lastName, company, vatNumber,
          email, phone, street, postalCode, city, country
        },
        "items": items[] {
          showPrice,
          priceOverride,
          note,
          "artwork": artwork-> {
            _id,
            title,
            year,
            "imageUrl": images[0].asset->url,
            "allImages": images[].asset->url,
            "widthCm": dimensions.widthCm,
            "heightCm": dimensions.heightCm,
            "depthCm": dimensions.depthCm,
            medium,
            editionType,
            editionTotal,
            editionAP,
            priceIncVat,
            vatRate
          }
        }
      }`,
      { id }
    ),
    sanityRead.fetch(`*[_type == "siteSettings"][0]{
      siteName,
      email,
      "logoUrl": logo.asset->url
    }`),
  ])

  if (!proposal) notFound()
  return <ProposalPage proposal={proposal} settings={settings} />
}

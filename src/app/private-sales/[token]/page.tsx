import { notFound } from 'next/navigation'
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import PrivateSaleClient from './PrivateSaleClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const builder = imageUrlBuilder(client)
function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PrivateSalePage({ params }: Props) {
  const { token } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sale = await (client.fetch as any)(
    `*[_type == "privateSale" && token == $token && isActive == true][0]{
      _id,
      title,
      recipientName,
      // Geen wachtwoord en geen werken in deze projectie: beide gingen naar
      // de browser, waar het wachtwoord werd vergeleken — de prijslijst stond
      // dus in de paginabron van iedereen die de link had. De werken komen nu
      // via /api/private-sale, ná controle op de server.
      "heeftWachtwoord": defined(password),
      expiresAt,
      introText,
      footerText,
      // Stond wel in het schema maar werd nooit gelezen: elke prijslijst toonde
      // Nederlandse BTW, ook aan een koper in Duitsland of daarbuiten.
      clientLocation,
    }`,
    { token }
  )

  if (!sale) notFound()

  // Check expiry
  if (sale.expiresAt && new Date(sale.expiresAt) < new Date()) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 14, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>This selection has expired</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>Please contact the gallery for an updated link.</p>
        </div>
      </main>
    )
  }

  return (
    <PrivateSaleClient
      sale={sale}
      token={token}
      requiresPassword={sale.heeftWachtwoord === true}
    />
  )
}

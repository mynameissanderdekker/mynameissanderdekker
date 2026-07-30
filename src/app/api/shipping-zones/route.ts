import { getSanityReadClient } from '@/lib/sanityClient'

export const revalidate = 3600

export async function GET() {
  const client = getSanityReadClient()
  const zones = await client.fetch(
    `*[_type == "shippingZone" && active == true]{
      _id, zoneName, regions, active,
      shippingMethods[]{ methodType, title, cost, freeShippingMinimum }
    }`
  )
  return Response.json(zones)
}

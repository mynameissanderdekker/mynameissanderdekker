import { createClient } from '@sanity/client'

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn:     true,
})

export const revalidate = 3600

export async function GET() {
  const zones = await client.fetch(
    `*[_type == "shippingZone" && active == true]{
      _id, zoneName, regions, active,
      shippingMethods[]{ methodType, title, cost, freeShippingMinimum }
    }`
  )
  return Response.json(zones)
}

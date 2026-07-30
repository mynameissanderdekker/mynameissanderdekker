import { createClient, type SanityClient } from '@sanity/client'

const clients = new Map<string, SanityClient>()

function getClient(apiVersion: string, useCdn: boolean, withToken: boolean): SanityClient {
  const key = `${apiVersion}|${useCdn}|${withToken}`
  let client = clients.get(key)
  if (!client) {
    client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion,
      token: withToken ? process.env.SANITY_WRITE_TOKEN : undefined,
      useCdn,
    })
    clients.set(key, client)
  }
  return client
}

/** Server-side client with write token, no CDN caching. */
export function getSanityWriteClient(apiVersion = '2024-01-01'): SanityClient {
  return getClient(apiVersion, false, true)
}

/** Read-only client, CDN-cached, no token. */
export function getSanityReadClient(apiVersion = '2024-01-01'): SanityClient {
  return getClient(apiVersion, true, false)
}

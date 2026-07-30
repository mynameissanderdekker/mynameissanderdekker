import { client } from '@/sanity/lib/client'
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mynameissanderdekker.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, exhibitions, artFairs, artworks] = await Promise.all([
    client.fetch<{ slug: string; updatedAt?: string }[]>(
      `*[_type == "project" && isPage == true && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`
    ),
    client.fetch<{ slug: string; updatedAt?: string }[]>(
      `*[_type == "exhibition" && hasPage == true && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`
    ),
    client.fetch<{ slug: string; updatedAt?: string }[]>(
      `*[_type == "artFair" && hasPage == true && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`
    ),
    client.fetch<{ slug: string; updatedAt?: string }[]>(
      `*[_type == "artwork" && defined(slug.current)]{ "slug": slug.current, "updatedAt": _updatedAt }`
    ),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE_URL}/cv`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE_URL}/works`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), priority: 0.9 },
  ]

  const dynamicPages: MetadataRoute.Sitemap = [
    ...projects.map(p => ({
      url: `${BASE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      priority: 0.8,
    })),
    ...exhibitions.map(e => ({
      url: `${BASE_URL}/exhibitions/${e.slug}`,
      lastModified: e.updatedAt ? new Date(e.updatedAt) : new Date(),
      priority: 0.7,
    })),
    ...artFairs.map(f => ({
      url: `${BASE_URL}/art-fairs/${f.slug}`,
      lastModified: f.updatedAt ? new Date(f.updatedAt) : new Date(),
      priority: 0.7,
    })),
    ...artworks.map(a => ({
      url: `${BASE_URL}/works/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      priority: 0.6,
    })),
  ]

  return [...staticPages, ...dynamicPages]
}

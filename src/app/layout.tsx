import type { Metadata } from "next";
import "./globals.css";
import { client } from '@/sanity/lib/client'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mynameissanderdekker.com'

interface SiteSettings {
  siteName?: string
  siteDescription?: string
  googleSiteVerification?: string
}

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    return await client.fetch<SiteSettings>(
      `*[_type == "siteSettings"][0]{ siteName, siteDescription, googleSiteVerification }`,
      {},
      { next: { revalidate: 3600 } }
    ) ?? {}
  } catch {
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteName = settings.siteName ?? 'My name is Sander Dekker'
  const description = settings.siteDescription ?? 'Amsterdam-based photographer. The Zine Project, The Social Media Project, and more.'

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: siteName,
      template: `%s — Sander Dekker`,
    },
    description,
    openGraph: {
      siteName: 'Sander Dekker',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    ...(settings.googleSiteVerification
      ? { verification: { google: settings.googleSiteVerification } }
      : {}),
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

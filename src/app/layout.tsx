import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mynameissanderdekker.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'My name is Sander Dekker',
    template: '%s — Sander Dekker',
  },
  description: 'Amsterdam-based photographer. Documentary projects on identity, self-expression and social acceptance — through zines, exhibitions and editions.',
  openGraph: {
    siteName: 'Sander Dekker',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

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

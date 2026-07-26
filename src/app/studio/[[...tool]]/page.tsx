import StudioClient from './studio-client'

export const dynamic = 'force-dynamic'
export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  // StudioClient applies the React.useEffectEvent polyfill before NextStudio
  // renders, fixing the Sanity 5.31.x / Next.js 15 incompatibility.
  return <StudioClient />
}

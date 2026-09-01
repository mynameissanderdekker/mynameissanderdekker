'use client'

import { useParams } from 'next/navigation'
import AutoRoomPage from '@/app/room/AutoRoomPage'

export default function ArtFairRoomPage() {
  const params = useParams()
  const slug = params.slug as string
  return <AutoRoomPage apiPath={`/api/room/artfair/${slug}`} />
}

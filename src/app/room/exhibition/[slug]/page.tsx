'use client'

import { useParams } from 'next/navigation'
import AutoRoomPage from '@/app/room/AutoRoomPage'

export default function ExhibitionRoomPage() {
  const params = useParams()
  const slug = params.slug as string
  return <AutoRoomPage apiPath={`/api/room/exhibition/${slug}`} />
}

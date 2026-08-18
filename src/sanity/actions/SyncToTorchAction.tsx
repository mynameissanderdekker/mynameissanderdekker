'use client'

import { useState } from 'react'
import { useToast } from '@sanity/ui'
import { useClient } from 'sanity'
import type { DocumentActionProps } from 'sanity'

const TorchIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C8 6 6 10 8 14c1 2 3 3 4 4-1-2-1-4 0-5 1 2 3 3 4 2-2-2-3-5-2-8 1 2 3 4 5 4-2-2-3-5-3-9z"/>
  </svg>
)

export function SyncToTorchAction(props: DocumentActionProps) {
  const { id, type, published } = props
  const [syncing, setSyncing] = useState(false)
  const toast = useToast()
  const client = useClient({ apiVersion: '2024-01-01' })

  if (type !== 'artwork') return null

  return {
    label: syncing ? 'Sending…' : '→ Torch',
    icon: TorchIcon,
    disabled: syncing || !published,
    title: !published ? 'Publish the artwork first before syncing to Torch' : 'Send this artwork to Torch Gallery',
    onHandle: async () => {
      setSyncing(true)
      try {
        const sanityToken = (client as any).config?.()?.token ?? ''
        const res = await fetch('/api/sync-to-torch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sanity-token': sanityToken,
          },
          body: JSON.stringify({ artworkIds: [id] }),
        })
        const data = await res.json()
        if (data.success) {
          toast.push({
            status: 'success',
            title: 'Sent to Torch Gallery!',
            description: `Torch ID: ${data.torchId}`,
            duration: 6000,
          })
        } else {
          toast.push({
            status: 'error',
            title: 'Sync failed',
            description: data.error ?? 'Unknown error',
          })
        }
      } catch (err: unknown) {
        toast.push({
          status: 'error',
          title: 'Sync failed',
          description: err instanceof Error ? err.message : 'Network error',
        })
      } finally {
        setSyncing(false)
      }
    },
  }
}

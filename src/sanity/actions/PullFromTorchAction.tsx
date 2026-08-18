'use client'

import { useState } from 'react'
import { useToast, Stack, Text, Box, Flex, Badge, Card, Spinner } from '@sanity/ui'
import type { DocumentActionProps } from 'sanity'
import { useClient, useFormValue } from 'sanity'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TorchBuyer {
  firstName: string
  lastName: string
  email: string
  purchases: Array<{
    copyNumber?: string
    soldVia?: string
    editionNumber?: string
    price?: number
  }>
}

interface TorchResult {
  artwork: {
    _id: string
    title: string
    status: string
    editionType: string
    editionTotal?: number
    editionAP?: number
    priceIncVat?: number
    vatRate?: string
  }
  buyers: TorchBuyer[]
  soldCount: number
  available: number | null
}

// ── Icon ──────────────────────────────────────────────────────────────────────

const PullIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v12M7 10l5 5 5-5M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/>
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHANNEL: Record<string, string> = {
  webshop: 'Webshop',
  direct:  'Direct',
  gallery: 'Gallery',
  artfair: 'Art Fair',
  other:   'Other',
}

const STATUS_LABEL: Record<string, string> = {
  available:    'Available',
  sold_out:     'Sold Out',
  on_loan:      'On Loan',
  not_for_sale: 'Not for Sale',
  enquire:      'Enquire',
}

const STATUS_TONE: Record<string, 'positive' | 'caution' | 'critical' | 'default'> = {
  available:    'positive',
  sold_out:     'critical',
  on_loan:      'caution',
  not_for_sale: 'default',
  enquire:      'caution',
}

// ── Action ────────────────────────────────────────────────────────────────────

export function PullFromTorchAction(props: DocumentActionProps) {
  const { id, type, published } = props
  const torchId = useFormValue(['torchId']) as string | undefined
  const client = useClient({ apiVersion: '2024-01-01' })

  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [data, setData]       = useState<TorchResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const toast = useToast()

  if (type !== 'artwork') return null
  if (!published) return null
  if (!torchId) return null   // Only show after artwork has been pushed to Torch

  async function fetchFromTorch() {
    setLoading(true)
    setError(null)
    setData(null)
    setOpen(true)
    try {
      const sanityToken = (client as any).config?.()?.token ?? ''
      const res  = await fetch('/api/pull-from-torch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sanity-token': sanityToken },
        body: JSON.stringify({ torchId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      setData(json as TorchResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch from Torch')
    } finally {
      setLoading(false)
    }
  }

  async function applyStatus() {
    if (!data) return
    setApplying(true)
    try {
      const sanityToken = (client as any).config?.()?.token ?? ''
      const res = await fetch('/api/sync-to-torch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-sanity-token': sanityToken },
        body: JSON.stringify({ artworkId: id, patch: { status: data.artwork.status } }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Patch failed')
      toast.push({ status: 'success', title: 'Status updated from Torch', duration: 4000 })
      setOpen(false)
    } catch (err: unknown) {
      toast.push({ status: 'error', title: 'Could not apply status', description: err instanceof Error ? err.message : '' })
    } finally {
      setApplying(false)
    }
  }

  // ── Dialog content ─────────────────────────────────────────────────────────

  const dialogContent = (
    <Box padding={4} style={{ minWidth: 360, maxWidth: 560 }}>
      {loading && (
        <Flex align="center" gap={3} padding={2}>
          <Spinner muted />
          <Text muted size={1}>Fetching from Torch Gallery…</Text>
        </Flex>
      )}

      {error && (
        <Card tone="critical" padding={3} radius={2}>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      {data && !loading && (
        <Stack space={4}>

          {/* Edition status bar */}
          {data.artwork.editionType === 'edition' && data.artwork.editionTotal != null && (
            <Card padding={3} radius={2} tone={data.available === 0 ? 'critical' : 'positive'}>
              <Flex gap={3} align="center" wrap="wrap">
                <Text size={2} weight="semibold">
                  {data.available}/{data.artwork.editionTotal} available in Torch
                </Text>
                {data.artwork.editionAP != null && data.artwork.editionAP > 0 && (
                  <Text muted size={1}>+ {data.artwork.editionAP} AP</Text>
                )}
                {data.soldCount > 0 && (
                  <Badge tone="critical" fontSize={0} padding={2}>
                    {data.soldCount} sold
                  </Badge>
                )}
              </Flex>
            </Card>
          )}

          {/* Status */}
          <Flex align="center" gap={3}>
            <Text size={1} muted style={{ minWidth: 80 }}>Status</Text>
            <Badge tone={STATUS_TONE[data.artwork.status] ?? 'default'} fontSize={0} padding={2}>
              {STATUS_LABEL[data.artwork.status] ?? data.artwork.status}
            </Badge>
          </Flex>

          {/* Buyers table */}
          {data.buyers.length > 0 ? (
            <Stack space={2}>
              <Text size={0} weight="semibold" muted style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Buyers at Torch
              </Text>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5e5', textAlign: 'left' }}>
                    <th style={{ padding: '4px 8px 6px 0', fontWeight: 600, color: '#555', fontSize: 12 }}>Name</th>
                    <th style={{ padding: '4px 8px 6px', fontWeight: 600, color: '#555', fontSize: 12 }}>Copy</th>
                    <th style={{ padding: '4px 8px 6px', fontWeight: 600, color: '#555', fontSize: 12 }}>Via</th>
                    <th style={{ padding: '4px 0 6px 8px', fontWeight: 600, color: '#555', fontSize: 12, textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buyers.map((b, i) =>
                    b.purchases.map((p, j) => (
                      <tr key={`${i}-${j}`} style={{ borderBottom: '1px solid #f4f4f4' }}>
                        <td style={{ padding: '5px 8px 5px 0', color: '#222', fontSize: 13 }}>
                          {[b.firstName, b.lastName].filter(Boolean).join(' ') || b.email}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#555', fontSize: 13 }}>
                          {p.copyNumber ?? p.editionNumber ?? '—'}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#777', fontSize: 12 }}>
                          {p.soldVia ? (CHANNEL[p.soldVia] ?? p.soldVia) : '—'}
                        </td>
                        <td style={{ padding: '5px 0 5px 8px', color: '#444', fontSize: 13, textAlign: 'right' }}>
                          {p.price != null
                            ? `€${p.price.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Stack>
          ) : (
            <Text muted size={1}>No buyers recorded in Torch yet.</Text>
          )}

          {/* Apply status button */}
          <Box style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16 }}>
            <Text size={1} muted style={{ marginBottom: 10 }}>
              Apply Torch status to this artwork on MNSDK:
            </Text>
            <button
              onClick={applyStatus}
              disabled={applying}
              style={{
                padding: '8px 16px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                cursor: applying ? 'default' : 'pointer',
                opacity: applying ? 0.6 : 1,
              }}
            >
              {applying ? 'Applying…' : `Apply "${STATUS_LABEL[data.artwork.status] ?? data.artwork.status}"`}
            </button>
          </Box>

        </Stack>
      )}
    </Box>
  )

  return {
    label: '← Torch',
    icon: PullIcon,
    title: 'Pull edition status and sales from Torch Gallery',
    onHandle: fetchFromTorch,
    dialog: open ? {
      type: 'dialog' as const,
      id: 'pull-from-torch-dialog',
      header: `Torch: ${data?.artwork.title ?? 'Loading…'}`,
      onClose: () => { setOpen(false); setData(null); setError(null) },
      content: dialogContent,
    } : undefined,
  }
}

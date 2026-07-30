import { useState, useCallback } from 'react'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'

// ── Preview / Print ────────────────────────────────────────────────────────────

export const PressReleasePreviewAction: DocumentActionComponent = (props: DocumentActionProps) => {
  if (!props.id) return null
  return {
    label: 'Preview / Print',
    icon: () => '🖨',
    onHandle: () => {
      window.open(`/admin/press/${props.id}`, '_blank')
    },
  }
}

// ── Send as press email ────────────────────────────────────────────────────────

export const SendPressReleaseAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [state, setState] = useState<'idle' | 'checking' | 'ready' | 'sending' | 'sent' | 'error'>('idle')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = props.draft ?? props.published as any
  const alreadySent = Boolean(doc?.emailSentAt)

  const openDialog = useCallback(async () => {
    setDialogOpen(true)
    setState('checking')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/press/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SANITY_WRITE_TOKEN ?? ''}`,
        },
        body: JSON.stringify({ pressReleaseId: props.id, dryRun: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setRecipientCount(data.recipientCount)
      setState('ready')
    } catch (e) {
      setErrorMsg(String(e))
      setState('error')
    }
  }, [props.id])

  const send = useCallback(async () => {
    setState('sending')
    try {
      const res = await fetch('/api/press/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SANITY_WRITE_TOKEN ?? ''}`,
        },
        body: JSON.stringify({ pressReleaseId: props.id, dryRun: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setState('sent')
      setRecipientCount(data.sent)
    } catch (e) {
      setErrorMsg(String(e))
      setState('error')
    }
  }, [props.id])

  if (!props.id) return null

  const label = alreadySent
    ? `✉️ Sent (${doc.emailRecipientCount ?? '?'})`
    : '✉️ Send as press email'

  return {
    label,
    disabled: alreadySent,
    icon: () => '✉️',
    onHandle: openDialog,
    dialog: dialogOpen
      ? {
          type: 'confirm' as const,
          tone: state === 'ready' ? 'caution' : 'default',
          title:
            state === 'checking' ? 'Checking recipients…'
            : state === 'ready'  ? `Send to ${recipientCount} press contacts?`
            : state === 'sending'? 'Sending…'
            : state === 'sent'   ? `✅ Sent to ${recipientCount} contacts`
            : state === 'error'  ? '❌ Error'
            : '',
          message:
            state === 'checking' ? 'Counting journalists and galleries in your contacts…'
            : state === 'ready'  ? `This will send the press release email to all ${recipientCount} contacts of type journalist or gallery. This cannot be undone.`
            : state === 'sending'? 'Sending emails via Resend…'
            : state === 'sent'   ? 'The press release has been sent. You can close this dialog.'
            : state === 'error'  ? (errorMsg ?? 'Something went wrong.')
            : '',
          onConfirm: state === 'ready' ? send : () => setDialogOpen(false),
          onCancel: () => {
            setDialogOpen(false)
            setState('idle')
          },
        }
      : undefined,
  }
}

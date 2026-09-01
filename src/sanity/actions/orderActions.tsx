import { useCurrentUser, useDocumentOperation } from 'sanity'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'

interface OrderDoc {
  status?: string
  fulfilment?: string
  trackingNumber?: string
  shippingEmailSentAt?: string
}

function buildEntry(status: string, changedBy: string, note?: string) {
  return {
    _key: crypto.randomUUID(),
    _type: 'statusHistoryEntry',
    status,
    changedAt: new Date().toISOString(),
    changedBy,
    ...(note ? { note } : {}),
  }
}

/** Stuurt een verzend-email zodra fulfilment → 'shipped' met een track & trace nummer */
export function withShippedNotification(
  originalAction: DocumentActionComponent
): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const original = originalAction(props)
    if (!original) return original

    const draft     = props.draft as OrderDoc | null
    const published = props.published as OrderDoc | null
    const next      = draft ?? published
    const willTrigger =
      next?.fulfilment === 'shipped' &&
      !!next?.trackingNumber &&
      published?.fulfilment !== 'shipped' &&
      !next?.shippingEmailSentAt

    return {
      ...original,
      onHandle: () => {
        if (willTrigger) {
          fetch('/api/orders/notify-shipped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: props.id }),
          }).catch(console.error)
        }
        original.onHandle?.()
      },
    }
  }
  Wrapped.action = originalAction.action
  return Wrapped
}

/** Legt automatisch elke statuswijziging vast in de statusHistory */
export function withStatusHistory(
  originalAction: DocumentActionComponent
): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const currentUser = useCurrentUser()
    const { patch }   = useDocumentOperation(props.id, props.type)
    const original    = originalAction(props)
    if (!original) return original

    const draft     = props.draft as OrderDoc | null
    const published = props.published as OrderDoc | null
    const next      = draft ?? published
    const statusChanged = !!next?.status && next.status !== published?.status

    return {
      ...original,
      onHandle: () => {
        if (statusChanged && next?.status) {
          const entry = buildEntry(next.status, currentUser?.name || 'systeem')
          patch.execute([
            { setIfMissing: { statusHistory: [] } },
            { insert: { before: 'statusHistory[0]', items: [entry] } },
          ])
        }
        original.onHandle?.()
      },
    }
  }
  Wrapped.action = originalAction.action
  return Wrapped
}

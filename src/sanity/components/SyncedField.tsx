import React from 'react'
import type { FieldProps } from 'sanity'
import { useFormValue } from 'sanity'

// Wraps a field and prepends ⮂ to its title when the artwork is synced to Torch.
// Usage in schema: components: { field: SyncedField }
export function SyncedField(props: FieldProps) {
  const torchId = useFormValue(['torchId']) as string | undefined
  const isSynced = Boolean(torchId)

  return props.renderDefault({
    ...props,
    title: isSynced ? `⮂ ${props.title ?? ''}` : (props.title ?? ''),
  })
}

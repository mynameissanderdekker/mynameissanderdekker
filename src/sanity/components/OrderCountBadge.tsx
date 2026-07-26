'use client'
import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function OrderCountBadge() {
  const client = useClient({ apiVersion: '2024-01-01' }).withConfig({ perspective: 'drafts' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchCount = () => {
      client
        .fetch<number>(`count(*[_type == "order" && status == "new"])`)
        .then(n => { if (mounted) setCount(n) })
    }

    fetchCount()

    const subscription = client
      .listen(`*[_type == "order"]`, {}, { visibility: 'query' })
      .subscribe(fetchCount)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [client])

  if (!count) return null

  return (
    <span
      title={`${count} new order${count === 1 ? '' : 's'}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, fontSize: 11 }}
    >
      <span className="orders-badge-pulse">🔴</span>
    </span>
  )
}

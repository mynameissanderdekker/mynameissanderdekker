'use client'

/**
 * EditionPickerInput
 * Custom input for the `copyNumber` (renamed "Edition") field inside purchases[].
 * Reads the sibling `artwork` reference, fetches editionTotal + editionAP,
 * and renders a dropdown of available slots (e.g. 1/7 … 7/7, 1/2 AP, 2/2 AP).
 * Falls back to a plain text input when no artwork is selected or artwork has no edition.
 */

import React, { useEffect, useState } from 'react'
import { set, unset, useFormValue } from 'sanity'
import { useListClient } from './useListClient'
import type { StringInputProps } from 'sanity'

export function EditionPickerInput(props: StringInputProps) {
  const { value, onChange, path } = props
  const client = useListClient()

  // path = [..., 'copyNumber'] — go up one level to get the purchase object, then read artwork
  const parentPath  = path.slice(0, -1)
  const artworkPath = [...parentPath, 'artwork']

  const artworkRef = useFormValue(artworkPath) as { _ref?: string } | undefined

  const [editions, setEditions] = useState<string[]>([])

  useEffect(() => {
    if (!artworkRef?._ref) { setEditions([]); return }

    let cancelled = false
    client
      .fetch<{ editionTotal?: number; editionAP?: number }>(
        `*[_id == $id][0]{ editionTotal, editionAP }`,
        { id: artworkRef._ref }
      )
      .then(artwork => {
        if (cancelled || !artwork) return
        const total = artwork.editionTotal ?? 0
        const ap    = artwork.editionAP    ?? 0
        const opts: string[] = []
        for (let i = 1; i <= total; i++) opts.push(`${i}/${total}`)
        for (let i = 1; i <= ap; i++)    opts.push(`${i}/${ap} AP`)
        setEditions(opts)
      })

    return () => { cancelled = true }
  }, [artworkRef?._ref, client])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const v = e.target.value
    onChange(v ? set(v) : unset())
  }

  // No artwork or no edition info → plain text field
  if (editions.length === 0) {
    return (
      <input
        type="text"
        value={value ?? ''}
        onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder={artworkRef?._ref ? 'No edition — leave blank for publications' : 'Select a work first'}
        style={{
          width: '100%', padding: '6px 8px',
          border: '1px solid #ccc', borderRadius: 3,
          fontSize: 14, fontFamily: 'inherit',
        }}
      />
    )
  }

  return (
    <select
      value={value ?? ''}
      onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
      style={{
        width: '100%', padding: '6px 8px',
        border: '1px solid #ccc', borderRadius: 3,
        fontSize: 14, fontFamily: 'inherit', background: '#fff',
      }}
    >
      <option value="">— select edition —</option>
      {editions.map(e => (
        <option key={e} value={e}>{e}</option>
      ))}
    </select>
  )
}

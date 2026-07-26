'use client'

/**
 * Polyfill React.useEffectEvent for Sanity Studio compatibility with Next.js 15.
 *
 * Sanity 5.31.x calls React.useEffectEvent internally (structureTool.js:8658).
 * Next.js 15's webpack bundler resolves `react` to an internal build that omits
 * this experimental hook from its exports. We patch it here — at module load time
 * in the browser — before Sanity's DocumentPaneInner component ever renders.
 *
 * The polyfill returns a stable callback via useRef + useCallback, matching the
 * semantics of the real hook closely enough for Sanity's internal usage.
 */

import React, { useRef, useLayoutEffect, useCallback } from 'react'

type AnyFn = (...args: unknown[]) => unknown

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const R = React as any

if (typeof window !== 'undefined' && !R.useEffectEvent) {
  R.useEffectEvent = function useEffectEvent<T extends AnyFn>(fn: T): T {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef<T>(fn)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      ref.current = fn
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback((...args: unknown[]) => ref.current(...args), []) as unknown as T
  }
}

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioClient() {
  return <NextStudio config={config} />
}

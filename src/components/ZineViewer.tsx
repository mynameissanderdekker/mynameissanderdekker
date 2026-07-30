// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LOCKED — DO NOT MODIFY THIS FILE                                       ║
// ║  The PDF viewer is tuned and working. Any change to rendering logic,    ║
// ║  DPI scaling, spread layout, gutter, or controls has been approved by   ║
// ║  the owner. Leave this file alone unless explicitly instructed.         ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

const PDFJS_VERSION = '3.11.174'
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`
const GUTTER_WIDTH = 1

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Already loaded?
    const existing = (window as any)['pdfjs-dist/build/pdf'] ?? (window as any).pdfjsLib
    if (existing) { resolve(existing); return }

    const src = `${CDN}/pdf.min.js`
    let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)

    const onLoad = () => {
      const lib = (window as any)['pdfjs-dist/build/pdf'] ?? (window as any).pdfjsLib
      lib ? resolve(lib) : reject(new Error('pdf.js niet gevonden'))
    }
    const onError = () => reject(new Error('Kon pdf.js niet laden'))

    if (!script) {
      script = document.createElement('script')
      script.src = src
      document.head.appendChild(script)
    }
    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
  })
}

function proxied(url: string) {
  if (url.startsWith('/')) return url
  return `/api/pdf-proxy?url=${encodeURIComponent(url)}`
}

// ── Spreads ───────────────────────────────────────────────────────────────────
// Page 1 (cover) stands alone on the right, with a blank left half — like an
// open book. Interior pages pair up (2-3, 4-5, …). If a page is left over at
// the end it stands alone on the left (back cover), blank on the right.
type Spread = { left: number | null; right: number | null }

function buildSpreads(numPages: number): Spread[] {
  if (numPages <= 0) return []
  const spreads: Spread[] = [{ left: null, right: 1 }]
  let p = 2
  while (p <= numPages) {
    if (p === numPages) {
      spreads.push({ left: p, right: null })
      p++
    } else {
      spreads.push({ left: p, right: p + 1 })
      p += 2
    }
  }
  return spreads
}

function spreadLabel({ left, right }: Spread) {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (left && right) return `${pad(left)}–${pad(right)}`
  return pad((left ?? right) as number)
}

// singlePage: PDF was exported as spreads (each PDF page = 2 book pages).
// Show one PDF page at a time instead of pairing pages into spreads.
type Props = { pdfUrl: string; singlePage?: boolean }

export default function ZineViewer({ pdfUrl, singlePage = false }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const docRef = useRef<any>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const renderTasksRef = useRef<Record<'left' | 'right', any>>({ left: null, right: null })

  const spreads = useMemo(
    () => singlePage
      ? Array.from({ length: numPages }, (_, i) => ({ left: null, right: i + 1 }) as Spread)
      : buildSpreads(numPages),
    [numPages, singlePage]
  )
  const spread = spreads[spreadIndex]

  useEffect(() => {
    async function init() {
      try {
        const pdfjsLib = await loadPdfJs()
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`
        const pdf = await pdfjsLib.getDocument(proxied(pdfUrl)).promise
        docRef.current = pdf
        setNumPages(pdf.numPages)
        setReady(true)
      } catch (err: any) {
        setError(err?.message ?? 'Kon PDF niet laden')
      }
    }
    init()
  }, [pdfUrl])

  // Each page slot is always a fixed half-width unit, whether or not the
  // opposite slot is occupied — that's what keeps a lone cover/back-cover
  // page from ballooning to full spread width.
  const renderSlot = useCallback(async (side: 'left' | 'right', pageNum: number | null, slotWidth: number) => {
    const canvas = side === 'left' ? leftCanvasRef.current : rightCanvasRef.current
    if (!canvas) return
    if (renderTasksRef.current[side]) {
      try { renderTasksRef.current[side].cancel() } catch (_) {}
    }
    if (pageNum == null || !docRef.current) {
      canvas.width = 0
      canvas.height = 0
      return
    }
    const page = await docRef.current.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const dpr = window.devicePixelRatio ?? 1
    const scale = Math.min(slotWidth / viewport.width, 2.5) * dpr
    const scaledViewport = page.getViewport({ scale })
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    canvas.style.width = `${scaledViewport.width / dpr}px`
    canvas.style.height = `${scaledViewport.height / dpr}px`
    const ctx = canvas.getContext('2d')!
    const task = page.render({ canvasContext: ctx, viewport: scaledViewport })
    renderTasksRef.current[side] = task
    try { await task.promise } catch (_) {}
  }, [])

  const renderSpread = useCallback(async (s: Spread) => {
    const stageWidth = stageRef.current?.clientWidth ?? 800
    const slotWidth = (stageWidth - GUTTER_WIDTH) / 2
    await Promise.all([
      renderSlot('left', s.left, slotWidth),
      renderSlot('right', s.right, slotWidth),
    ])
  }, [renderSlot])

  useEffect(() => {
    if (ready && spread) renderSpread(spread)
  }, [ready, spread, renderSpread])

  // Re-render current spread on resize so scale stays correct.
  useEffect(() => {
    if (!ready) return
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => spread && renderSpread(spread))
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, spreadIndex])

  const prev = () => setSpreadIndex(i => Math.max(0, i - 1))
  const next = () => setSpreadIndex(i => Math.min(spreads.length - 1, i + 1))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreads.length])

  const showLeft = !!spread?.left
  const showRight = !!spread?.right
  const isLoneSpread = showLeft !== showRight // cover or back-cover: only one side has a page

  return (
    <div className="zine-viewer">
      {!ready && !error && <div className="zine-viewer-loading">Zine wordt geladen…</div>}
      {error && <div className="zine-viewer-error">{error}</div>}
      <div ref={stageRef} className="zine-spread" style={{ display: ready ? 'flex' : 'none' }}>
        <div className="zine-page-slot">
          {showLeft && (
            <canvas
              ref={leftCanvasRef}
              className={`zine-viewer-canvas${isLoneSpread ? ' zine-viewer-canvas--cover' : ''}`}
            />
          )}
        </div>
        <div className="zine-spread-gutter" />
        <div className="zine-page-slot">
          {showRight && (
            <canvas
              ref={rightCanvasRef}
              className={`zine-viewer-canvas${isLoneSpread ? ' zine-viewer-canvas--cover' : ''}`}
            />
          )}
        </div>
      </div>
      {ready && (
        <div className="zine-viewer-controls">
          <button className="zine-viewer-btn" onClick={prev} disabled={spreadIndex <= 0} aria-label="Vorige pagina">←</button>
          <span className="zine-viewer-page-num">{spread ? spreadLabel(spread) : ''}</span>
          <button className="zine-viewer-btn" onClick={next} disabled={spreadIndex >= spreads.length - 1} aria-label="Volgende pagina">→</button>
        </div>
      )}
    </div>
  )
}

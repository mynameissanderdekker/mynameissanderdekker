'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const PDFJS_VERSION = '3.11.174'
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

type Props = { pdfUrl: string }

export default function ZineViewer({ pdfUrl }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [ready, setReady] = useState(false)
  const docRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      try {
        await loadScript(`${CDN}/pdf.min.js`)
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'] ?? (window as any).pdfjsLib
        if (!pdfjsLib) { console.error('pdfjs-dist not found on window'); return }
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        docRef.current = pdf
        setNumPages(pdf.numPages)
        setReady(true)
      } catch (err) {
        console.error('ZineViewer init error', err)
      }
    }
    init()
  }, [pdfUrl])

  const renderPage = useCallback(async (num: number) => {
    if (!docRef.current || !canvasRef.current) return
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch (_) {}
    }
    const page = await docRef.current.getPage(num)
    const canvas = canvasRef.current
    const containerWidth = canvas.parentElement?.clientWidth ?? 800
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min((containerWidth - 48) / viewport.width, 2)
    const scaledViewport = page.getViewport({ scale })
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    const ctx = canvas.getContext('2d')!
    renderTaskRef.current = page.render({ canvasContext: ctx, viewport: scaledViewport })
    try {
      await renderTaskRef.current.promise
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (ready) renderPage(pageNumber)
  }, [ready, pageNumber, renderPage])

  const prev = () => setPageNumber(p => Math.max(1, p - 1))
  const next = () => setPageNumber(p => Math.min(numPages, p + 1))

  return (
    <div className="zine-viewer">
      {!ready && <div className="zine-viewer-loading">Loading zine…</div>}
      <canvas ref={canvasRef} className="zine-viewer-canvas" style={{ display: ready ? 'block' : 'none' }} />
      {ready && (
        <div className="zine-viewer-controls">
          <button className="zine-viewer-btn" onClick={prev} disabled={pageNumber <= 1} aria-label="Previous page">←</button>
          <span className="zine-viewer-page-num">{pageNumber} / {numPages}</span>
          <button className="zine-viewer-btn" onClick={next} disabled={pageNumber >= numPages} aria-label="Next page">→</button>
          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer" className="zine-viewer-download">↓ Download</a>
        </div>
      )}
    </div>
  )
}

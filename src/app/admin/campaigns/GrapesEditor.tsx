'use client'
import { useEffect, useRef } from 'react'
import 'grapesjs/dist/css/grapes.min.css'

const LIGHT_OVERRIDES = `
  /* ── Blocks panel ── */
  .gjs-block {
    background: #ededeb !important;
    border: 1px solid #848484 !important;
    border-radius: 4px !important;
    box-shadow: none !important;
    color: #444 !important;
    padding: 10px 6px 8px !important;
  }
  .gjs-block:hover {
    background: #e4e4e2 !important;
    border-color: #666 !important;
    box-shadow: none !important;
  }
  .gjs-block svg {
    fill: #444 !important;
    stroke: none !important;
    width: 40px !important;
    height: 40px !important;
  }
  .gjs-block__media {
    color: #444 !important;
    line-height: 1 !important;
  }
  .gjs-block__label {
    color: #444 !important;
    font-size: 11px !important;
    font-weight: 400 !important;
    letter-spacing: 0.3px !important;
  }
  .gjs-block-category__title {
    background: #ededeb !important;
    color: #888 !important;
    border: none !important;
    font-size: 10px !important;
    letter-spacing: 1.5px !important;
    text-transform: uppercase !important;
    font-weight: 400 !important;
    padding: 8px 12px !important;
  }
  .gjs-block-categories {
    background: #ededeb !important;
  }
  /* ── Toolbar (top bar icons) ── */
  .gjs-toolbar {
    background: #ededeb !important;
    border-bottom: none !important;
  }
  .gjs-toolbar-item {
    color: #555 !important;
  }
  .gjs-toolbar-item:hover, .gjs-toolbar-item.gjs-toolbar-item--active {
    color: #111 !important;
    background: #dededc !important;
  }
  /* ── Panels ── */
  .gjs-pn-panel {
    background: #ededeb !important;
    border: none !important;
  }
  .gjs-pn-btn {
    color: #555 !important;
  }
  .gjs-pn-btn:hover, .gjs-pn-btn.gjs-pn-active {
    color: #111 !important;
    background: #dededc !important;
  }
  /* ── Style manager ── */
  .gjs-sm-sector-title {
    background: #e4e4e2 !important;
    color: #666 !important;
    border: none !important;
    font-size: 10px !important;
    letter-spacing: 1.5px !important;
    font-weight: 400 !important;
  }
  .gjs-sm-property {
    color: #555 !important;
    font-size: 12px !important;
  }
  .gjs-sm-label {
    color: #777 !important;
    font-size: 11px !important;
    font-weight: 400 !important;
  }
  .gjs-sm-input-holder input,
  .gjs-sm-input-holder select {
    background: #fff !important;
    border: 1px solid #848484 !important;
    color: #333 !important;
  }
  /* ── Canvas wrapper ── */
  .gjs-cv-canvas {
    background: #ededeb !important;
  }
  /* ── Selected element highlight ── */
  .gjs-selected {
    outline: 2px solid #848484 !important;
  }
  /* ── Traits ── */
  .gjs-trt-trait__label {
    color: #777 !important;
    font-size: 11px !important;
    font-weight: 400 !important;
  }
  .gjs-trt-trait input,
  .gjs-trt-trait select {
    background: #fff !important;
    border: 1px solid #848484 !important;
    color: #333 !important;
  }
  /* ── Remove all dark divider lines ── */
  .gjs-block-category,
  .gjs-blocks-c,
  [class*="gjs-"] {
    border-color: transparent !important;
  }
  .gjs-block {
    border-color: #848484 !important;
  }
  /* ── Override GrapesJS dark base color #373d49 → white ── */
  .gjs-editor,
  .gjs-editor-cont,
  .gjs-pn-panels,
  .gjs-pn-panel.gjs-pn-views-container,
  .gjs-pn-panel.gjs-pn-views,
  .gjs-pn-panel.gjs-pn-options,
  .gjs-pn-panel.gjs-pn-commands,
  .gjs-layer,
  .gjs-layer-move,
  .gjs-layer-count,
  .gjs-layer-caret {
    background-color: #fff !important;
    color: #333 !important;
  }
  /* Catch-all for any remaining #373d49 dark surfaces */
  .gjs-one-bg,
  .gjs-two-color {
    background-color: #fff !important;
    color: #333 !important;
  }
  .gjs-four-color,
  .gjs-four-color-h:hover {
    color: #333 !important;
  }
  .gjs-three-bg {
    background-color: #ededeb !important;
    color: #333 !important;
  }
`

interface Props {
  onReady: (getHtml: () => string) => void
}

export default function GrapesEditor({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return

    let cancelled = false

    async function init() {
      const grapesjs = (await import('grapesjs')).default
      const newsletter = (await import('grapesjs-preset-newsletter')).default

      if (cancelled || !containerRef.current) return

      const editor = grapesjs.init({
        container: containerRef.current,
        fromElement: false,
        plugins: [newsletter],
        pluginsOpts: { [newsletter as unknown as string]: {} },
        storageManager: false,
        height: '100%',
        width: 'auto',
        panels: { defaults: [] }, // verwijder alle default toolbars
        blockManager: { appendTo: '#gjs-blocks' },
        styleManager: { appendTo: '#gjs-styles' },
        layerManager: { appendTo: undefined },
        traitManager: { appendTo: '#gjs-traits' },
      })

      editorRef.current = editor

      // Inject light theme overrides
      const styleEl = document.createElement('style')
      styleEl.id = 'gjs-light-theme'
      styleEl.textContent = LIGHT_OVERRIDES
      document.head.appendChild(styleEl)

      // Expose getHtml to parent
      onReady(() => {
        try {
          return editor.runCommand('gjs-get-inlined-html') as string
        } catch {
          return editor.getHtml()
        }
      })
    }

    init()

    return () => {
      cancelled = true
      document.getElementById('gjs-light-theme')?.remove()
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [onReady])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#ededeb' }}>

      {/* Blocks */}
      <div style={{
        width: 180, flexShrink: 0, background: '#ededeb',
        borderRight: '1px solid #848484', overflowY: 'auto',
      }}>
        <p style={{
          margin: 0, padding: '10px 12px', fontSize: 10, letterSpacing: 2,
          textTransform: 'uppercase', color: '#aaa', borderBottom: '1px solid #eee',
        }}>
          Blokken
        </p>
        <div id="gjs-blocks" />
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ flex: 1, height: '100%', overflow: 'hidden' }}
      />

      {/* Styles + traits */}
      <div style={{
        width: 220, flexShrink: 0, background: '#ededeb',
        borderLeft: '1px solid #848484', overflowY: 'auto',
      }}>
        <p style={{
          margin: 0, padding: '10px 12px', fontSize: 10, letterSpacing: 2,
          textTransform: 'uppercase', color: '#aaa', borderBottom: '1px solid #eee',
        }}>
          Stijlen
        </p>
        <div id="gjs-traits" />
        <div id="gjs-styles" />
      </div>

    </div>
  )
}

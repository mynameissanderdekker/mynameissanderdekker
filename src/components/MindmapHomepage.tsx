'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapItem {
  title: string
  displayTitle?: string
  panelTitle?: string
  image: string
  text: string
  cta: string
  url: string
  x: number
  y: number
  r: number
  xMobile?: number
  yMobile?: number
  rMobile?: number
  color: string
  opacity: number
  fontSize?: number
  fontWeight?: number
}

interface PanelContent {
  title: string
  text: string
  image: string
  hint: string
  url: string
  ctaLabel: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MAP_ITEMS: MapItem[] = [
  {
    title: 'The Social Media Project',
    image: 'https://cdn.sanity.io/images/u11u127q/production/1f4655b7aebacc40ff292fbae0781428bc1899d7-1250x1000.jpg',
    text: 'A stranger online. A saved profile. A message, a plane ticket, a knock on the door. What happened next was never planned — and that was exactly the point.',
    cta: 'Discover the project',
    url: '/projects/the-social-media-project/',
    x: 320, y: 420, r: 420, xMobile: 400, yMobile: 500, rMobile: 350,
    color: '#F6B8B8', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'TenFifteen — The Social Landscape',
    displayTitle: 'The Social Landscape',
    image: 'https://cdn.sanity.io/images/u11u127q/production/7dfd41e27bcf2accf420d14b38ab12944f481967-1400x788.jpg',
    text: 'A wall of photographs, each ten by fifteen centimetres — hence the name. Intimate and personal up close. Overwhelming together — like the endless stream of images we scroll through every day.',
    cta: 'Discover the project',
    url: '/projects/the-social-landscape/',
    x: 210, y: 230, r: 180, xMobile: 450, yMobile: 250, rMobile: 180,
    color: '#F7D7C4', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: '#fun',
    image: 'https://cdn.sanity.io/images/u11u127q/production/f777374742cce85552a15b35bfbdf3b83d123149-1500x1001.jpg',
    text: "The moment a camera appears, something switches. Smiles widen, poses form, joy becomes demonstrable. It happens almost automatically — a Pavlovian reflex so ingrained that most people don't notice they're doing it. Dekker notices. And stays put.",
    cta: 'Discover the project',
    url: '/projects/fun/',
    x: 40, y: 110, r: 90, xMobile: 400, yMobile: 100, rMobile: 90,
    color: '#F6E7A8', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'Innate Curiosity',
    image: 'https://cdn.sanity.io/images/u11u127q/production/746715dfc485a2365ac98b0b24611f9160d73942-1400x933.jpg',
    text: 'Innate Curiosity sits at the heart of what came before — the impulse to seek, to wonder, to find things out for yourself. Before the algorithm decided what you were curious about, curiosity was something you had to act on.',
    cta: 'Discover the project',
    url: '/projects/innate-curiosity/',
    x: 20, y: 680, r: 135, xMobile: 100, yMobile: 420, rMobile: 135,
    color: '#CFE8D6', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'It Is Us',
    image: 'https://cdn.sanity.io/images/u11u127q/production/4ebb3c17ee4226a117d56d5c961eb9e04081537d-1200x675.jpg',
    text: 'A scar. A birthmark. A body part usually kept hidden. Strangers photograph themselves anonymously, and together their images form something unexpected — collective, human and quietly funny.',
    cta: 'Discover the project',
    url: '/projects/it-is-us/',
    x: 580, y: 120, r: 90, xMobile: 700, yMobile: 420, rMobile: 90,
    color: '#CFE8D6', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'The Zine Project',
    image: 'https://cdn.sanity.io/images/u11u127q/production/eeb6a3a91cbb48efaa280d0fd519682717f37cd8-1400x788.jpg',
    text: 'Ten handmade zines. Four years. Each one a deep dive into a single person, place or theme — from intimate portraits to projects rooted in social urgency. All sold out within minutes of release.',
    cta: 'Discover the project',
    url: '/projects/the-zine-project/',
    x: 620, y: 520, r: 220, xMobile: 380, yMobile: 720, rMobile: 200,
    color: '#F4C6A5', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'Zine No2 Girls in Paris',
    panelTitle: 'Zine Nº.2 - Girls in Paris',
    image: 'https://cdn.sanity.io/images/u11u127q/production/bcb2521ced49d1cd924e00616a4792225d651a7e-1200x800.jpg',
    text: "Eight women living in Paris, each navigating freedom, self-expression and sexuality on her own terms. The gap between France's progressive image and everyday reality turns out to be wider than expected.",
    cta: 'Read the zine',
    url: '/projects/girls-in-paris/',
    x: 860, y: 440, r: 135, xMobile: 620, yMobile: 780, rMobile: 130,
    color: '#D99A9A', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'Zine No9 A.S.I.A.',
    panelTitle: 'Zine Nº.9 - A.S.I.A.',
    image: 'https://cdn.sanity.io/images/u11u127q/production/e202d5934809a60a466bddf52f995dca1a639129-800x533.jpg',
    text: 'Amsterdam has a reputation for tolerance. But even here, racism against people of Asian descent is a quiet, persistent reality. Seven individuals push back — simply by being fully, visibly themselves.',
    cta: 'Read the zine',
    url: '/projects/asia/',
    x: 760, y: 640, r: 120, xMobile: 420, yMobile: 880, rMobile: 110,
    color: '#D99A9A', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
  {
    title: 'Zine No8 Warsaw SAGA',
    panelTitle: 'Zine Nº.8 - The Warsaw SAGA',
    image: 'https://cdn.sanity.io/images/u11u127q/production/75619c191a810f73640b9ccfd21ee54b384d68a1-1200x800.jpg',
    text: 'Poland has been named the worst country in the EU for LGBTQ+ individuals. Dekker went to Warsaw to meet the people who stay true to themselves anyway — and found joy, resilience and liberation.',
    cta: 'Read the zine',
    url: '/projects/warsaw-saga/',
    x: 580, y: 730, r: 120, xMobile: 220, yMobile: 880, rMobile: 110,
    color: '#D99A9A', opacity: 0.60, fontSize: 30, fontWeight: 700,
  },
]

const RELATIONS: Record<string, Array<{ name: string; delay: number }>> = {
  'The Social Media Project': [
    { name: 'TenFifteen — The Social Landscape', delay: 800 },
    { name: 'The Zine Project', delay: 2500 },
    { name: 'It Is Us', delay: 4000 },
    { name: 'Innate Curiosity', delay: 5500 },
  ],
  'TenFifteen — The Social Landscape': [{ name: '#fun', delay: 3500 }],
  'The Zine Project': [
    { name: 'Zine No8 Warsaw SAGA', delay: 2200 },
    { name: 'Zine No2 Girls in Paris', delay: 2500 },
    { name: 'Zine No9 A.S.I.A.', delay: 2500 },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Exact production CSS (mynameissanderdekker.com):
// .node:nth-child(1) circle            { fill: #FF1F1F; opacity: .55; }
// .node:nth-child(2), :nth-child(6)    { fill: #C63F3F; opacity: .50; }
// .node:nth-child(3-5,7-9)             { fill: #D99A9A; opacity: .45; }
function getCircleStyle(index: number): { fill: string; opacity: number } {
  if (index === 0)                    return { fill: '#FF1F1F', opacity: 0.55 }
  if (index === 1 || index === 5)     return { fill: '#C63F3F', opacity: 0.50 }
  return                                     { fill: '#D99A9A', opacity: 0.45 }
}

const BREATHE_DURATIONS = ['5s', '7s', '8s', '9s', '6.5s', '7.5s', '8.5s', '10s', '6s']
const BREATHE_NAMES = ['breathe1', 'breathe2', 'breathe3', 'breathe2', 'breathe1', 'breathe3', 'breathe2', 'breathe1', 'breathe3']

function SvgTitle({ item, isMobile }: { item: MapItem; isMobile: boolean }) {
  const x = isMobile ? (item.xMobile ?? item.x) : item.x
  const y = isMobile ? (item.yMobile ?? item.y) : item.y
  const displayTitle = item.displayTitle || item.title
  const fs = isMobile ? 30 : (item.fontSize || 26)

  if (displayTitle === 'The Social Landscape') {
    return (
      <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
        <tspan x={x} dy="-0.55em" fontSize={fs}>The Social</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>Landscape</tspan>
      </text>
    )
  }
  if (item.title === 'Innate Curiosity') {
    return (
      <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
        <tspan x={x} dy="-0.4em" fontSize={fs}>Innate</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>Curiosity</tspan>
      </text>
    )
  }
  if (item.title === 'Zine No2 Girls in Paris') {
    return (
      <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
        <tspan x={x} dy="-0.4em" fontSize={fs}>Zine Nº.2</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>Girls in Paris</tspan>
      </text>
    )
  }
  if (item.title === 'Zine No9 A.S.I.A.') {
    return (
      <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
        <tspan x={x} dy="-0.4em" fontSize={fs}>Zine Nº.9</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>A.S.I.A.</tspan>
      </text>
    )
  }
  if (item.title === 'Zine No8 Warsaw SAGA') {
    return (
      <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
        <tspan x={x} dy="-1.1em" fontSize={fs}>Zine Nº.8</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>The Warsaw</tspan>
        <tspan x={x} dy="1.1em" fontSize={fs}>SAGA</tspan>
      </text>
    )
  }
  return (
    <text x={x} y={y} fill="#000" fontWeight={item.fontWeight || 700} className="node-text">
      <tspan x={x} dy="0.35em" fontSize={fs}>{displayTitle}</tspan>
    </text>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MindmapHomepage() {
  const [panel, setPanel] = useState<PanelContent | null>(null)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [wavingNodes, setWavingNodes] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const floatRefs = useRef<(SVGGElement | null)[]>([])
  const rippleLayerRef = useRef<SVGGElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Detect mobile ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Preload images ──
  useEffect(() => {
    MAP_ITEMS.forEach(item => {
      const img = new Image()
      img.src = item.image
    })
  }, [])

  // ── Ripple hit propagation ──
  const rippleHit = useCallback((title: string, visited = new Set<string>()) => {
    if (visited.has(title)) return
    visited.add(title)

    setWavingNodes(prev => new Set([...prev, title]))
    setTimeout(() => {
      setWavingNodes(prev => {
        const next = new Set(prev)
        next.delete(title)
        return next
      })
    }, 2000)

    const rels = RELATIONS[title]
    if (rels) {
      rels.forEach(rel => {
        setTimeout(() => rippleHit(rel.name, visited), rel.delay)
      })
    }
  }, [])

  // ── Core ripple animation ──
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>
    let timeoutId: ReturnType<typeof setTimeout>
    let currentRipple: SVGCircleElement | null = null

    const createCoreRipple = () => {
      const layer = rippleLayerRef.current
      if (!layer) return

      const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      ripple.setAttribute('cx', '320')
      ripple.setAttribute('cy', '420')
      ripple.setAttribute('r', '8')
      ripple.setAttribute('class', 'core-ripple')
      ripple.setAttribute('opacity', '0.15')
      layer.appendChild(ripple)
      currentRipple = ripple

      let size = 8
      intervalId = setInterval(() => {
        size += 2
        ripple.setAttribute('r', String(size))
        const opacity = Math.max(0, 1 - (size / 380) * 2) * 0.15
        ripple.setAttribute('opacity', String(opacity))
        if (size > 380) {
          clearInterval(intervalId)
          ripple.remove()
          currentRipple = null
          timeoutId = setTimeout(createCoreRipple, 3000)
        }
      }, 70)

      rippleHit('The Social Media Project')
    }

    createCoreRipple()
    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      currentRipple?.remove()
    }
  }, [rippleHit])

  // ── Panel helpers ──
  const showPanel = useCallback((item: MapItem) => {
    clearTimeout(hideTimeoutRef.current)
    const hint =
      item.cta === 'Read the zine' ? 'Click the circle to read the zine.' :
      item.cta === 'Project in progress' ? 'Project in progress.' :
      'Click the circle to discover the project.'

    setActiveNode(item.title)
    setPanel({
      title: item.panelTitle || item.displayTitle || item.title,
      text: item.text,
      image: item.image,
      hint,
      url: item.url,
      ctaLabel: item.cta === 'Read the zine' ? 'Read the zine' : 'Learn More',
    })
  }, [])

  const hidePanel = useCallback((floatEl?: SVGGElement | null) => {
    if (floatEl) {
      floatEl.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      floatEl.style.transform = 'translate(0px, 0px)'
    }
    hideTimeoutRef.current = setTimeout(() => {
      setActiveNode(null)
      setPanel(null)
    }, 200)
  }, [])

  const closePanel = useCallback(() => {
    setActiveNode(null)
    setPanel(null)
  }, [])

  // ── Node event handlers ──
  const handleMouseEnter = useCallback((item: MapItem) => {
    showPanel(item)
  }, [showPanel])

  const handleMouseLeave = useCallback((item: MapItem, index: number) => {
    hidePanel(floatRefs.current[index])
  }, [hidePanel])

  const handleMouseMove = useCallback((
    e: React.MouseEvent<SVGGElement>,
    item: MapItem,
    index: number
  ) => {
    if (isMobile || !svgRef.current) return
    const floatEl = floatRefs.current[index]
    if (!floatEl) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const cx = item.x
    const cy = item.y
    const vb = svg.viewBox.baseVal
    const worldX = (e.clientX - rect.left) * (vb.width / rect.width) + vb.x
    const worldY = (e.clientY - rect.top) * (vb.height / rect.height) + vb.y
    const max = 6
    const dx = Math.max(-max, Math.min(max, (worldX - cx) * 0.018))
    const dy = Math.max(-max, Math.min(max, (worldY - cy) * 0.018))

    floatEl.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    floatEl.style.transform = `translate(${dx}px, ${dy}px)`
  }, [isMobile])

  const handleClick = useCallback((item: MapItem) => {
    if (!isMobile && item.url && item.url !== '#') {
      window.location.href = item.url
    }
  }, [isMobile])

  const handleTouch = useCallback((e: React.TouchEvent, item: MapItem) => {
    e.preventDefault()
    if (panel && activeNode === item.title) {
      if (item.url && item.url !== '#') window.location.href = item.url
    } else {
      showPanel(item)
    }
  }, [panel, activeNode, showPanel])

  const viewBox = isMobile ? '0 0 800 1300' : '-450 -30 1500 950'

  return (
    <>
      {/* Mobile header */}
      <div id="mm-mobile-header">
        <h3>Every encounter shines a light on something new — a person, a place, an identity. Each one carries the seeds of the next.</h3>
        <p><strong>Click the projects to explore.</strong></p>
      </div>
      <div id="mm-mobile-avatar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hoofd-roze.png" alt="Sander Dekker" />
      </div>

      {/* Layout */}
      <div id="mm-layout">
        {/* Panel */}
        <div id="mm-panel" className={panel ? 'is-hovered' : ''}>
          {/* Default state */}
          <div className="mm-panel-default">
            <h3>Every encounter shines a light on something new — a person, a place, an identity. Each one carries the seeds of the next.</h3>
            <p style={{ marginTop: 12, fontStyle: 'italic' }}><strong>Hover to explore.</strong></p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hoofd-roze.png"
              alt="Sander Dekker"
              style={{ width: '100%', marginTop: 20 }}
            />
          </div>
          {/* Hover state */}
          <div className="mm-panel-hover">
            <button className="mm-panel-close" onClick={closePanel}>✕</button>
            <div
              className="mm-panel-image"
              style={panel ? {
                backgroundImage: `url(${panel.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : { background: '#111' }}
            />
            <p className="mm-panel-title">{panel?.title}</p>
            <p className="mm-panel-text">{panel?.text}</p>
            <p className="mm-panel-hint">{panel?.hint}</p>
            <a className="mm-panel-cta" href={panel?.url || '#'}>
              {panel?.ctaLabel || 'Learn More'}
            </a>
          </div>
        </div>

        {/* Map */}
        <div id="mm-map" className={activeNode ? 'focus-active' : ''}>
          <svg
            ref={svgRef}
            id="mm-svg"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMin meet"
          >
            {MAP_ITEMS.map((item, index) => {
              const x = isMobile ? (item.xMobile ?? item.x) : item.x
              const y = isMobile ? (item.yMobile ?? item.y) : item.y
              const r = isMobile ? (item.rMobile ?? item.r) : item.r
              const { fill, opacity } = getCircleStyle(index)
              const isActive = activeNode === item.title
              const isWaving = wavingNodes.has(item.title)

              return (
                <g
                  key={item.title}
                  className={[
                    'mm-node',
                    isActive ? 'active' : '',
                    isWaving ? 'wave-hit' : '',
                  ].join(' ').trim()}
                  style={{ cursor: item.url && item.url !== '#' ? 'pointer' : 'default' }}
                  onClick={() => handleClick(item)}
                  onMouseEnter={() => handleMouseEnter(item)}
                  onMouseLeave={() => handleMouseLeave(item, index)}
                  onMouseMove={(e) => handleMouseMove(e, item, index)}
                  onTouchStart={(e) => handleTouch(e, item)}
                >
                  <g
                    className="mm-float"
                    ref={(el) => { floatRefs.current[index] = el }}
                  >
                    <circle
                      className="mm-pulse"
                      cx={x}
                      cy={y}
                      r={r}
                      fill={fill}
                      fillOpacity={0.60}
                      opacity={opacity}
                      style={{
                        '--breathe-anim': BREATHE_NAMES[index],
                        '--breathe-dur': BREATHE_DURATIONS[index],
                      } as React.CSSProperties}
                    />
                    <SvgTitle item={item} isMobile={isMobile} />
                  </g>
                </g>
              )
            })}
            <g ref={rippleLayerRef} />
          </svg>
        </div>
      </div>
    </>
  )
}

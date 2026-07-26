'use client'

import { useEffect, useRef } from 'react'

interface Props {
  imageUrl: string
  title: string
  widthCm?: number
  onClose: () => void
}

/**
 * Wall.jpg = 1125 × 1500px (ratio 3:4)
 *
 * Kalibratie: de foto is 275cm breed.
 * - artWPct = (widthCm / 275) × 100  →  breedte als % van de foto
 * - Hoogte via CSS aspect-ratio (widthCm : heightCm)  →  geen PHOTO_H_CM nodig
 *
 * widthCm/heightCm komen uit framedDimensions (incl. lijst + passe-partout).
 */
export default function ViewInRoomModal({ imageUrl, title, widthCm, heightCm, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  const PHOTO_W_CM = 275

  // Breedte als % van de fotobreedte — PNG bepaalt zelf de hoogte via zijn eigen verhouding
  const artWPct = widthCm ? (widthCm / PHOTO_W_CM) * 100 : 20

  // Wall.jpg: 1125 × 1500px → hoogte = 133.33% van breedte
  const PADDING_BOTTOM = (1500 / 1125) * 100

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="relative overflow-hidden bg-black"
        style={{ width: 'min(95vw, 780px)', borderRadius: 2 }}
      >
        {/* Sluitknop */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-20 text-xs tracking-widest uppercase text-white/60 hover:text-white transition-colors"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          ✕
        </button>

        {/* Kamer foto — padding-bottom forceert correcte hoogte voor absolute children */}
        <div
          className="relative w-full"
          style={{ paddingBottom: `${PADDING_BOTTOM}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/room-bg.jpg"
            alt="Galerij ruimte"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Kunstwerk — breedte als % van de foto, hoogte volgt uit de PNG zelf */}
          <div
            className="absolute"
            style={{
              width: `${artWPct}%`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '4px 4px 14px rgba(0,0,0,0.35)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

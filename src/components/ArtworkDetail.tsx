'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { urlFor } from '@/sanity/lib/image'
import EnquirePanel from '@/components/EnquirePanel'
import ViewInRoomModal from '@/components/ViewInRoomModal'
import { useCartStore } from '@/store/cart'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export interface ArtworkData {
  _id: string
  title: string
  year?: number
  medium?: string
  dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number }
  images?: Array<{ asset?: { _ref: string; _id?: string; url?: string }; hotspot?: object; crop?: object }>
  roomImageUrl?: string
  showViewInRoom?: boolean
  framedDimensions?: { widthCm?: number }
  priceExclVAT?: number
  vatRate?: number
  status?: string
  showInWebshop?: boolean
  buyUrl?: string
  editionTotal?: number
  editionAP?: number
  slug?: { current: string }
  description?: Array<{ children?: Array<{ text?: string }> }>
}

function imgUrl(img: SanityImageSource, width: number) {
  return urlFor(img).width(width).auto('format').quality(85).url()
}

function formatDimensions(d?: { widthCm?: number; heightCm?: number; depthCm?: number }) {
  if (!d) return null
  const wh = [d.widthCm, d.heightCm].filter(Boolean)
  if (!wh.length) return null
  const base = wh.join(' × ') + ' cm'
  return d.depthCm ? `${base} × ${d.depthCm} cm` : base
}

function formatPrice(excl: number, vatRate = 9) {
  const incl = excl * (1 + vatRate / 100)
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(incl)
}

function blockText(blocks?: Array<{ children?: Array<{ text?: string }> }>) {
  return blocks?.map(b => b.children?.map(c => c.text).join('')).filter(Boolean).join('\n\n') ?? null
}

export default function ArtworkDetail({ artwork }: { artwork: ArtworkData }) {
  const images = artwork.images ?? []
  const [activeIdx, setActiveIdx] = useState(0)
  const [enquireOpen, setEnquireOpen] = useState(false)
  const [roomOpen, setRoomOpen] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const activeImg = images[activeIdx]
  const mainUrl   = activeImg?.asset?.url
    ? `${activeImg.asset.url}?w=1400&auto=format&q=85`
    : activeImg ? imgUrl(activeImg as SanityImageSource, 1400) : null
  const thumbMain = activeImg?.asset?.url
    ? `${activeImg.asset.url}?w=400&auto=format&q=85`
    : activeImg ? imgUrl(activeImg as SanityImageSource, 400) : null

  const dims    = formatDimensions(artwork.dimensions)
  const edition = [
    artwork.editionTotal ? `${artwork.editionTotal}` : null,
    artwork.editionAP    ? `+ ${artwork.editionAP} AP` : null,
  ].filter(Boolean).join(' ')

  const isSoldOut       = artwork.status === 'sold_out'
  const sellInWebshop   = artwork.showInWebshop === true
  const descText        = blockText(artwork.description)

  // EnquirePanel expects this shape
  const enquireArtwork = {
    _id:   artwork._id,
    title: artwork.title,
    year:  artwork.year ?? 0,
    image: thumbMain ?? undefined,
    slug:  artwork.slug?.current,
  }

  return (
    <>
      {/* artwork-detail class triggers .site-main:has(.artwork-detail) CSS override → full bleed */}
      <div className="artwork-detail flex flex-col lg:flex-row" style={{ minHeight: '85vh' }}>

        {/* ── Image column: fixed frame, always the same size ── */}
        <div
          className="flex-1 min-w-0 bg-[#f0eeeb] flex items-center justify-center"
          style={{ minHeight: '85vh', padding: '60px' }}
        >
          {mainUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainUrl}
              alt={artwork.title}
              className="object-contain"
              style={{ maxWidth: '100%', maxHeight: '75vh' }}
              fetchPriority="high"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>

        {/* ── Info panel: right column, scrollable ── */}
        <div
          className="lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col overflow-y-auto border-l border-gray-100 bg-white"
          style={{ padding: '40px 36px', minHeight: '85vh' }}
        >
          {/* Back link — top of panel */}
          <Link
            href="/works"
            className="text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors mb-8 self-start"
          >
            ← Works
          </Link>

          {/* Title + year */}
          <h1 className="text-2xl font-normal leading-snug mb-1">{artwork.title}</h1>
          {artwork.year && (
            <p className="text-sm text-gray-400 mb-8 italic">{artwork.year}</p>
          )}

          {/* Details */}
          <dl className="space-y-3 text-sm border-t border-gray-100 pt-6">
            {artwork.medium && (
              <div className="flex gap-4">
                <dt className="text-gray-400 w-20 shrink-0">Medium</dt>
                <dd className="text-gray-800 leading-snug">{artwork.medium}</dd>
              </div>
            )}
            {dims && (
              <div className="flex gap-4">
                <dt className="text-gray-400 w-20 shrink-0">Size</dt>
                <dd className="text-gray-800">{dims}</dd>
              </div>
            )}
            {edition && (
              <div className="flex gap-4">
                <dt className="text-gray-400 w-20 shrink-0">Edition</dt>
                <dd className="text-gray-800">{edition}</dd>
              </div>
            )}
          </dl>

          {descText && (
            <p className="mt-6 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{descText}</p>
          )}

          {/* Price + CTAs — direct onder de tekst */}
          <div className="mt-8 flex flex-col gap-3">
            {isSoldOut && (
              <p className="text-xs tracking-widest uppercase text-gray-400">Sold out</p>
            )}

            {!isSoldOut && artwork.priceExclVAT && (
              <p className="text-xl font-medium">
                {formatPrice(artwork.priceExclVAT, artwork.vatRate)}
              </p>
            )}

            {/* Buy — showInWebshop aan → voeg toe aan cart en ga naar /cart */}
            {!isSoldOut && sellInWebshop && (
              <button
                onClick={() => {
                  addItem({
                    id: artwork._id,
                    slug: artwork.slug?.current ?? '',
                    title: artwork.title,
                    priceIncl: artwork.priceExclVAT
                      ? artwork.priceExclVAT * (1 + (artwork.vatRate ?? 9) / 100)
                      : 0,
                    imageUrl: thumbMain ?? undefined,
                  })
                  router.push('/cart')
                }}
                className="border border-black px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors duration-150"
              >
                Buy
              </button>
            )}

            {/* Enquire — showInWebshop uit → slide-in contactformulier */}
            {!isSoldOut && !sellInWebshop && (
              <button
                onClick={() => setEnquireOpen(true)}
                className="border border-black px-6 py-3 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-colors duration-150"
              >
                Enquire
              </button>
            )}

            {artwork.showViewInRoom && mainUrl && (
              <button
                onClick={() => setRoomOpen(true)}
                className="border border-gray-300 px-6 py-3 text-xs tracking-widest uppercase font-medium text-gray-500 hover:border-gray-500 hover:text-gray-800 transition-colors duration-150"
              >
                View on wall
              </button>
            )}
          </div>

          {/* Thumbnails — onderaan het panel */}
          {images.length > 1 && (
            <div className="mt-auto pt-8 flex flex-row flex-wrap gap-2">
              {images.map((img, i) => {
                const thumbUrl = img?.asset?.url
                  ? `${img.asset.url}?w=300&auto=format&q=80`
                  : imgUrl(img as SanityImageSource, 300)
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`w-20 h-20 overflow-hidden border transition-colors duration-150 bg-[#f0eeeb] ${
                      i === activeIdx ? 'border-black' : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl}
                      alt={`${artwork.title} — ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {enquireOpen && (
        <EnquirePanel
          artwork={enquireArtwork}
          onClose={() => setEnquireOpen(false)}
        />
      )}

      {roomOpen && mainUrl && (
        <ViewInRoomModal
          imageUrl={artwork.roomImageUrl ?? mainUrl}
          title={artwork.title}
          widthCm={artwork.framedDimensions?.widthCm ?? artwork.dimensions?.widthCm}
          onClose={() => setRoomOpen(false)}
        />
      )}
    </>
  )
}

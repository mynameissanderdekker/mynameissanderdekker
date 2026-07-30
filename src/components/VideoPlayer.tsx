'use client'

import { useState } from 'react'

interface Props {
  /** Vimeo/YouTube embed URL (for videoEmbed blocks) */
  embedUrl?: string
  /** MP4 direct URL (for heroVideo blocks) */
  mp4Url?: string
  /** Optional poster image shown before the video loads */
  posterUrl?: string
}

function PlayIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.55)" />
      <polygon points="26,20 50,32 26,44" fill="#fff" />
    </svg>
  )
}

export default function VideoPlayer({ embedUrl, mp4Url, posterUrl }: Props) {
  const [playing, setPlaying] = useState(false)

  // If no poster, go straight to the player (original behaviour)
  if (!posterUrl) {
    return (
      <div className="project-video">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : mp4Url ? (
          <video
            controls
            playsInline
            preload="metadata"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <source src={mp4Url} type="video/mp4" />
          </video>
        ) : null}
      </div>
    )
  }

  return (
    <div className="project-video">
      {playing ? (
        embedUrl ? (
          <iframe
            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : mp4Url ? (
          <video
            controls
            autoPlay
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <source src={mp4Url} type="video/mp4" />
          </video>
        ) : null
      ) : (
        <button
          onClick={() => setPlaying(true)}
          aria-label="Play video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <span style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PlayIcon />
          </span>
        </button>
      )}
    </div>
  )
}

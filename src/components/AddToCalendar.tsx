'use client'

import { useEffect, useRef, useState } from 'react'

export interface AddToCalendarProps {
  title: string
  startDate: string    // 'YYYY-MM-DD'
  endDate?: string     // 'YYYY-MM-DD' — defaults to startDate
  startTime?: string   // 'HH:MM' — omit for all-day
  endTime?: string     // 'HH:MM' — omit for all-day
  location?: string
  description?: string
  url?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(date: string, time?: string): string {
  // Returns YYYYMMDDTHHmmss (local, no Z) or YYYYMMDD for all-day
  const d = date.replace(/-/g, '')
  if (!time) return d
  const t = time.replace(':', '') + '00'
  return `${d}T${t}`
}

function buildGoogleUrl(props: AddToCalendarProps): string {
  const { title, startDate, endDate, startTime, endTime, location, description, url } = props
  const start = toDateStr(startDate, startTime)
  const end = toDateStr(endDate ?? startDate, endTime ?? startTime)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    ...(location ? { location } : {}),
    ...(description || url
      ? { details: [description, url].filter(Boolean).join('\n\n') }
      : {}),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildICS(props: AddToCalendarProps): string {
  const { title, startDate, endDate, startTime, endTime, location, description, url } = props
  const dtstart = toDateStr(startDate, startTime)
  const dtend = toDateStr(endDate ?? startDate, endTime ?? startTime)
  const allDay = !startTime

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mynameissanderdekker.com//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    allDay ? `DTSTART;VALUE=DATE:${dtstart}` : `DTSTART:${dtstart}`,
    allDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`,
    ...(location ? [`LOCATION:${location}`] : []),
    ...(description ? [`DESCRIPTION:${description.replace(/\n/g, '\\n')}`] : []),
    ...(url ? [`URL:${url}`] : []),
    `DTSTAMP:${toDateStr(new Date().toISOString().split('T')[0], new Date().toTimeString().slice(0, 5))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

function downloadICS(props: AddToCalendarProps, filename: string) {
  const content = buildICS(props)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

function isFuture(startDate: string, startTime?: string): boolean {
  const dateStr = startTime ? `${startDate}T${startTime}` : `${startDate}T23:59:59`
  return new Date(dateStr) > new Date()
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="2.5" width="14" height="12.5" rx="1.5" />
      <line x1="1" y1="6.5" x2="15" y2="6.5" />
      <line x1="5" y1="1" x2="5" y2="4" />
      <line x1="11" y1="1" x2="11" y2="4" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
    >
      <polyline points="2,3.5 5,6.5 8,3.5" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddToCalendar(props: AddToCalendarProps) {
  const { title, startDate, startTime } = props
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Hide if event is in the past
  if (!isFuture(startDate, startTime)) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const options = [
    {
      label: 'Google Calendar',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21.805 10.023H12v4.05h5.65c-.244 1.265-.98 2.336-2.086 3.055v2.54h3.378c1.977-1.82 3.117-4.505 3.117-7.685 0-.488-.04-.965-.117-1.41-.043-.27-.098-.427-.137-.55z" fill="#4285F4" />
          <path d="M12 22c2.835 0 5.213-.94 6.95-2.547l-3.378-2.54c-.939.63-2.14 1.004-3.572 1.004-2.743 0-5.068-1.852-5.9-4.34H2.605v2.622C4.335 19.988 7.965 22 12 22z" fill="#34A853" />
          <path d="M6.1 13.577A5.96 5.96 0 0 1 5.762 12c0-.548.094-1.08.238-1.577V7.8H2.605A9.996 9.996 0 0 0 2 12c0 1.614.387 3.14 1.07 4.491L6.1 13.577z" fill="#FBBC05" />
          <path d="M12 6.083c1.545 0 2.93.53 4.02 1.573l3.013-3.014C17.208 2.932 14.832 2 12 2 7.965 2 4.335 4.012 2.605 7.8L6.1 10.423C6.932 7.935 9.257 6.083 12 6.083z" fill="#EA4335" />
        </svg>
      ),
      action: () => window.open(buildGoogleUrl(props), '_blank', 'noopener'),
    },
    {
      label: 'Apple Calendar',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
      action: () => downloadICS(props, `${slug}.ics`),
    },
    {
      label: 'Outlook',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* merkkleur: Outlook — geen thema-kleur, hoort bij het icoon */}
          <rect x="2" y="6" width="12" height="12" rx="1" fill="#0078D4" />
          <text x="8" y="15" textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="bold">O</text>
          <path d="M14 9h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6" stroke="#0078D4" strokeWidth="1.2" />
          <polyline points="14,9 17,12 14,15" fill="none" stroke="#0078D4" strokeWidth="1.2" />
        </svg>
      ),
      action: () => downloadICS(props, `${slug}-outlook.ics`),
    },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 14px',
          fontSize: 13,
          fontFamily: 'inherit',
          color: 'var(--tone-800)',
          background: 'transparent',
          border: '1px solid var(--tone-300)',
          borderRadius: 4,
          cursor: 'pointer',
          letterSpacing: '0.02em',
          transition: 'border-color 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--tone-500)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--tone-900)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--tone-300)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--tone-800)'
        }}
      >
        <CalendarIcon />
        Add to calendar
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 180,
            background: 'var(--tone-paper)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {options.map(({ label, icon, action }) => (
            <button
              key={label}
              role="option"
              aria-selected={false}
              onClick={() => { action(); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                fontFamily: 'inherit',
                color: 'var(--tone-800)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useListClient } from './useListClient'
import { useLang } from '../hooks/useLang'
import { HELP_FAQS } from '../helpContent'

// ── Quick Action options ──────────────────────────────────────────────────────

const QUICK_ACTION_OPTIONS = [
  { value: 'add-artwork',      labelEn: 'Add artwork',              labelNl: 'Artwork toevoegen',            icon: '🖼️', href: '/studio/intent/create/type=artwork' },
  { value: 'artwork-sold',     labelEn: 'Artwork sold / reserved',  labelNl: 'Werk verkocht / gereserveerd', icon: '🎨', modal: 'artwork' as const },
  { value: 'add-contact',      labelEn: 'Add contact',              labelNl: 'Contact toevoegen',            icon: '👤', modal: 'contact' as const },
  { value: 'new-exhibition',   labelEn: 'New exhibition',           labelNl: 'Nieuwe tentoonstelling',       icon: '🏛️', href: '/studio/intent/create/type=exhibition' },
  { value: 'new-artfair',      labelEn: 'New art fair',             labelNl: 'Nieuwe art fair',              icon: '🎪', href: '/studio/intent/create/type=artFair' },
  { value: 'open-orders',      labelEn: 'Open orders',              labelNl: 'Bestellingen',                 icon: '📦', href: '/studio/structure/order' },
  { value: 'open-crm',         labelEn: 'Open CRM',                 labelNl: 'CRM / contacten',              icon: '🗂️', href: '/studio/structure/contact' },
  { value: 'open-webshop',     labelEn: 'Webshop settings',         labelNl: 'Webshop instellingen',         icon: '🛒', href: '/studio/structure/shopSettings' },
  { value: 'add-press',        labelEn: 'Add press item',           labelNl: 'Persitem toevoegen',           icon: '📰', href: '/studio/intent/create/type=press' },
]

const DEFAULT_QUICK_ACTIONS = ['artwork-sold', 'add-contact', 'add-artwork']

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewOrder {
  _id: string
  orderNumber: string
  customerName?: string
  customerEmail?: string
  createdAt?: string
}

interface UpcomingEvent {
  _id: string
  title: string
  dateFrom: string
  artworkCount: number
  type: 'exhibition' | 'artFair'
}

interface NudgeItem { id: string; label: string }
interface SmartNudge {
  id: string
  labelEn?: string; hintEn?: string
  label: string; hint: string
  items?: NudgeItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function daysFromNow(iso: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(iso); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}

function getGreeting(lang: 'nl' | 'en'): string {
  const h = new Date().getHours()
  if (lang === 'nl') {
    if (h < 12) return 'Goedemorgen'
    if (h < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>{title}</h2>
      {count > 0 && (
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1, padding: '3px 7px', borderRadius: 999, background: color, color: '#fff' }}>{count}</span>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 16 }}>✓</span> {label}
    </div>
  )
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ padding: '12px 16px', background: '#fff', border: `1px solid ${accent ?? '#e5e7eb'}`, borderLeft: `3px solid ${accent ?? '#e5e7eb'}`, borderRadius: 8, fontSize: 14 }}>
      {children}
    </div>
  )
}

function NudgeCard({ nudge, lang }: { nudge: SmartNudge; lang: 'en' | 'nl' }) {
  const [open, setOpen] = useState(false)
  const hasItems = nudge.items && nudge.items.length > 0
  const label = lang === 'en' && nudge.labelEn ? nudge.labelEn : nudge.label
  const hint  = lang === 'en' && nudge.hintEn  ? nudge.hintEn  : nudge.hint

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b', borderRadius: 8, fontSize: 14, overflow: 'hidden' }}>
      <div
        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: hasItems ? 'pointer' : 'default' }}
        onClick={() => hasItems && setOpen(o => !o)}
      >
        <div>
          <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#92400e' }}>{hint}</div>
        </div>
        {hasItems && <span style={{ color: '#92400e', fontSize: 14, marginLeft: 12, flexShrink: 0, marginTop: 2 }}>{open ? '▲' : '▼'}</span>}
      </div>
      {open && nudge.items && (
        <div style={{ borderTop: '1px solid #fde68a', padding: '8px 16px', background: '#fef9c3' }}>
          {nudge.items.map((item, i) => (
            <a
              key={item.id}
              href={`/studio/intent/edit/id=${item.id};type=artwork`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', fontSize: 13, color: '#92400e', padding: '5px 0', borderBottom: i < nudge.items!.length - 1 ? '1px solid #fde68a' : 'none', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#111')}
              onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
            >{item.label} ↗</a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Help Widget ───────────────────────────────────────────────────────────────

type FAQ = typeof HELP_FAQS[number]

const AVATAR_URL = '/hoofd-roze.png'

const PANEL_FAQ_IDS = ['add-artwork', 'set-price', 'register-sale', 'exhibition', 'contact', 'webshop', 'coupon']
const PANEL_FAQS = PANEL_FAQ_IDS.map(id => HELP_FAQS.find(f => f.id === id)!).filter(Boolean)

function getRelevantFaqIds(nudges: SmartNudge[], hasOrders: boolean): string[] {
  const ids: string[] = []
  const nudgeIds = nudges.map(n => n.id)
  if (nudgeIds.includes('no-events'))  ids.push('exhibition')
  if (nudgeIds.includes('no-price'))   ids.push('set-price')
  if (nudgeIds.includes('no-category')) ids.push('add-artwork')
  if (hasOrders) ids.push('register-sale')
  const deduped = Array.from(new Set(ids))
  const rest = PANEL_FAQS.map(f => f.id).filter(id => !deduped.includes(id))
  return [...deduped, ...rest]
}

function FaqItem({ faq, lang, activeId, setActiveId, highlight }: { faq: FAQ; lang: 'nl' | 'en'; activeId: string | null; setActiveId: (id: string | null) => void; highlight?: boolean }) {
  const { q, a } = faq[lang]
  const isActive = activeId === faq.id
  return (
    <div>
      <button
        onClick={() => setActiveId(isActive ? null : faq.id)}
        style={{ width: '100%', textAlign: 'left', background: isActive ? '#f0f9ff' : highlight ? '#f9fafb' : 'none', border: highlight ? `1px solid ${isActive ? '#bae6fd' : '#f0f0f0'}` : 'none', borderRadius: isActive ? '6px 6px 0 0' : 6, padding: highlight ? '8px 10px' : '5px 0', fontSize: 13, fontWeight: highlight ? 500 : 400, color: '#111', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>{q}</span>
        <span style={{ color: '#9ca3af', fontSize: 10, flexShrink: 0, marginLeft: 8 }}>{isActive ? '▲' : '▼'}</span>
      </button>
      {isActive && (
        <div style={{ fontSize: 12, color: '#374151', background: highlight ? '#f0f9ff' : '#f9fafb', borderRadius: highlight ? '0 0 6px 6px' : 6, padding: '8px 10px', lineHeight: 1.6, border: highlight ? '1px solid #bae6fd' : 'none', borderTop: 'none', marginBottom: 2 }}>{a}</div>
      )}
    </div>
  )
}

function HelpWidget({ nudges, hasOrders, lang, setLang }: { nudges: SmartNudge[]; hasOrders: boolean; lang: 'en' | 'nl'; setLang: (l: 'en' | 'nl') => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'faq' | 'contact'>('faq')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [search, setSearch] = useState('')
  const isNl = lang === 'nl'

  const orderedIds = getRelevantFaqIds(nudges, hasOrders)
  const orderedFaqs = orderedIds.map(id => PANEL_FAQS.find(f => f.id === id)!).filter(Boolean)
  const suggested = orderedFaqs.slice(0, 2)
  const rest = orderedFaqs.slice(2)

  const searchTerm = search.trim().toLowerCase()
  const searchResults = searchTerm.length > 1
    ? HELP_FAQS.filter(f => {
        const { q, a } = f[lang]
        return q.toLowerCase().includes(searchTerm) || a.toLowerCase().includes(searchTerm)
      }).slice(0, 6)
    : []

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      <style>{`@keyframes gb-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,0,0,0.16); } 50% { transform: scale(1.05); box-shadow: 0 6px 28px rgba(0,0,0,0.22); } }`}</style>

      {open && (
        <div style={{ width: 340, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#111', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{getGreeting(lang)}, Sander! 👋</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', background: '#2a2a2a', borderRadius: 6, overflow: 'hidden', border: '1px solid #3a3a3a' }}>
                {(['nl', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 9px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', background: lang === l ? '#fff' : 'transparent', color: lang === l ? '#111' : '#6b7280', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' }}>{l}</button>
                ))}
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
            {(['faq', 'contact'] as const).map(t2 => (
              <button key={t2} onClick={() => setTab(t2)} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: tab === t2 ? 600 : 400, color: tab === t2 ? '#111' : '#6b7280', background: 'none', border: 'none', borderBottom: tab === t2 ? '2px solid #111' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t2 === 'faq' ? 'FAQ' : 'Contact'}
              </button>
            ))}
          </div>

          {tab === 'faq' && (
            <div style={{ padding: '12px 14px', maxHeight: 480, overflowY: 'auto' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
                {isNl ? 'Misschien handige vragen:' : 'These might help:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suggested.map(faq => <FaqItem key={faq.id} faq={faq} lang={lang} activeId={activeId} setActiveId={setActiveId} highlight />)}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setShowMore(m => !m)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {showMore ? (isNl ? 'Verberg' : 'Hide') : (isNl ? `Meer vragen (${rest.length})` : `More questions (${rest.length})`)} {showMore ? '▲' : '▼'}
                </button>
                {showMore && (
                  <div style={{ marginTop: 6, borderTop: '1px solid #f3f4f6', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rest.map(faq => <FaqItem key={faq.id} faq={faq} lang={lang} activeId={activeId} setActiveId={setActiveId} />)}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#374151' }}>{isNl ? 'Iets anders?' : 'Something else?'}</p>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={isNl ? 'Zoek in alle vragen...' : 'Search all questions...'}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
                {searchTerm.length > 1 && searchResults.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {searchResults.map(faq => <FaqItem key={faq.id} faq={faq} lang={lang} activeId={activeId} setActiveId={setActiveId} />)}
                  </div>
                )}
                {searchTerm.length > 1 && searchResults.length === 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    {isNl ? 'Niets gevonden. ' : 'Nothing found. '}
                    <button onClick={() => setTab('contact')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                      {isNl ? 'Stel je vraag direct.' : 'Ask directly.'}
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div style={{ padding: '16px 14px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                {isNl ? 'Mis je iets of wil je iets veranderd? Stuur een berichtje.' : 'Missing something or want something changed? Send a message.'}
              </p>
              <a href="mailto:hello@mynameissanderdekker.com" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', background: '#111', color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span>→</span><span>hello@mynameissanderdekker.com</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        {!open && (
          <div style={{ position: 'relative', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '9px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111', fontStyle: 'italic', lineHeight: 1.3, display: 'inline-block' }}>Need help?<br />I've got answers!</span>
            <div style={{ position: 'absolute', right: -8, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '8px solid #e5e7eb' }} />
            <div style={{ position: 'absolute', right: -7, bottom: 16, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '8px solid #fff' }} />
          </div>
        )}
        <img src={AVATAR_URL} alt="Sander" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `3px solid ${open ? '#111' : '#fff'}`, animation: open ? 'none' : 'gb-pulse 3s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardTool() {
  const client = useListClient()
  const { lang, setLang } = useLang()
  const isNl = lang === 'nl'

  const [orders, setOrders]     = useState<NewOrder[]>([])
  const [events, setEvents]     = useState<UpcomingEvent[]>([])
  const [nudges, setNudges]     = useState<SmartNudge[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Quick Actions
  const [quickActions, setQuickActions] = useState<string[]>(DEFAULT_QUICK_ACTIONS)
  const [settingsId, setSettingsId]     = useState<string | null>(null)
  const [editingSlot, setEditingSlot]   = useState<number | null>(null)
  const editingRef = useRef<HTMLDivElement | null>(null)

  // Modals
  const [contactModal, setContactModal] = useState(false)
  const [cFirst, setCFirst] = useState(''); const [cLast, setCLast] = useState(''); const [cEmail, setCEmail] = useState('')
  const [cType, setCType] = useState('collector'); const [cNote, setCNote] = useState(''); const [cNewsletter, setCNewsletter] = useState(false)
  const [cStatus, setCStatus] = useState<'idle'|'saving'|'done'|'error'>('idle')

  const [artworkModal, setArtworkModal] = useState(false)
  const [awSearch, setAwSearch] = useState(''); const [awResults, setAwResults] = useState<{_id:string;title:string}[]>([])
  const [awSelected, setAwSelected] = useState<{_id:string;title:string}|null>(null)
  const [awNewStatus, setAwNewStatus] = useState<'sold'|'reserved'>('sold')
  const [awSaving, setAwSaving] = useState(false); const [awDone, setAwDone] = useState(false)

  const today        = new Date().toISOString().slice(0, 10)
  const inNinetyDays = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ord, exh, fairs, noPriceWorks, noCatWorks, settings] = await Promise.all([

        client.fetch<NewOrder[]>(
          `*[_type == "order" && status == "new" && !(_id in path("drafts.**"))] | order(createdAt desc) [0..19] { _id, orderNumber, customerName, customerEmail, createdAt }`
        ),

        client.fetch<Omit<UpcomingEvent, 'type'>[]>(
          `*[_type == "exhibition" && startDate >= $today && startDate <= $inNinetyDays && !(_id in path("drafts.**"))] | order(startDate asc) [0..9] {
            _id, title, "dateFrom": startDate,
            "artworkCount": count(*[_type == "artwork" && ^._id in exhibitions[]._ref && !(_id in path("drafts.**"))])
          }`,
          { today, inNinetyDays } as any
        ),

        client.fetch<Omit<UpcomingEvent, 'type'>[]>(
          `*[_type == "artFair" && startDate >= $today && startDate <= $inNinetyDays && !(_id in path("drafts.**"))] | order(startDate asc) [0..9] {
            _id, title, "dateFrom": startDate,
            "artworkCount": count(*[_type == "artwork" && ^._id in artFairs[]._ref && !(_id in path("drafts.**"))])
          }`,
          { today, inNinetyDays } as any
        ),

        // Artworks available without price and not on-request
        client.fetch<Array<{ _id: string; title: string }>>(
          `*[_type == "artwork" && status == "available" && !defined(priceIncVat) && !(category in ["Zine","book"]) && !(_id in path("drafts.**"))] | order(title asc) [0..49] { _id, title }`
        ),

        // Artworks without category
        client.fetch<Array<{ _id: string; title: string }>>(
          `*[_type == "artwork" && (!defined(category) || category == "") && !(_id in path("drafts.**"))] | order(title asc) [0..49] { _id, title }`
        ),

        client.fetch<{ _id: string; quickActions?: string[] } | null>(
          `*[_type == "siteSettings"][0]{ _id, quickActions }`
        ),
      ])

      setOrders(ord)

      const allEvents: UpcomingEvent[] = [
        ...exh.map(e => ({ ...e, type: 'exhibition' as const })),
        ...fairs.map(e => ({ ...e, type: 'artFair' as const })),
      ].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
      setEvents(allEvents)

      // Build nudges
      const newNudges: SmartNudge[] = []

      if (allEvents.length === 0) {
        newNudges.push({
          id: 'no-events',
          label: 'Geen aankomende tentoonstellingen of art fairs',
          labelEn: 'No upcoming exhibitions or art fairs',
          hint: 'Voeg een tentoonstelling of art fair toe.',
          hintEn: 'Add an exhibition or art fair.',
        })
      }

      allEvents.forEach(e => {
        if (e.artworkCount === 0) {
          const days = daysFromNow(e.dateFrom)
          const typeLabel = e.type === 'artFair' ? 'Art fair' : 'Tentoonstelling'
          const typeLabelEn = e.type === 'artFair' ? 'Art fair' : 'Exhibition'
          newNudges.push({
            id: `event-no-works-${e._id}`,
            label: `${typeLabel} "${e.title}" heeft nog geen werken`,
            labelEn: `${typeLabelEn} "${e.title}" has no works linked yet`,
            hint: days <= 30
              ? `Opent over ${days} dag${days !== 1 ? 'en' : ''} — koppel werken via de Gallery-tab.`
              : 'Koppel werken via de Gallery-tab van het artwork.',
            hintEn: days <= 30
              ? `Opens in ${days} day${days !== 1 ? 's' : ''} — link works via the Gallery tab.`
              : 'Link works via the artwork\'s Gallery tab.',
          })
        }
      })

      if (noPriceWorks.length > 0) {
        newNudges.push({
          id: 'no-price',
          label: `${noPriceWorks.length} beschikbaar werk${noPriceWorks.length !== 1 ? 'en' : ''} zonder prijs`,
          labelEn: `${noPriceWorks.length} available work${noPriceWorks.length !== 1 ? 's' : ''} without a price`,
          hint: 'Klik om uit te vouwen — stel een prijs in of zet op "Price on request".',
          hintEn: 'Click to expand — set a price or enable "Price on request".',
          items: noPriceWorks.map(w => ({ id: w._id, label: w.title })),
        })
      }

      if (noCatWorks.length > 0) {
        newNudges.push({
          id: 'no-category',
          label: `${noCatWorks.length} werk${noCatWorks.length !== 1 ? 'en' : ''} zonder categorie`,
          labelEn: `${noCatWorks.length} work${noCatWorks.length !== 1 ? 's' : ''} without a category`,
          hint: 'Klik om uit te vouwen — categorie is nodig voor filters op de website.',
          hintEn: 'Click to expand — category is needed for filters on the website.',
          items: noCatWorks.map(w => ({ id: w._id, label: w.title })),
        })
      }

      setNudges(newNudges)

      if (settings) {
        setSettingsId(settings._id)
        if (settings.quickActions && settings.quickActions.length > 0) {
          setQuickActions([...settings.quickActions, '', '', ''].slice(0, 3))
        }
      }

    } catch (err) {
      console.error('Dashboard load error', err)
    }
    setLoading(false)
    setLastRefresh(new Date())
  }, [client, today, inNinetyDays])

  async function saveQuickAction(slot: number, value: string) {
    const updated = [...quickActions]; updated[slot] = value
    setQuickActions(updated); setEditingSlot(null)
    if (settingsId) {
      try { await client.patch(settingsId).set({ quickActions: updated.filter(Boolean) }).commit() }
      catch (e) { console.error('saveQuickAction', e) }
    }
  }

  // Artwork search
  useEffect(() => {
    if (!awSearch.trim() || awSearch.length < 2) { setAwResults([]); return }
    const t = setTimeout(async () => {
      const results = await client.fetch<{_id:string;title:string}[]>(
        `*[_type=="artwork" && title match $q && !(_id in path("drafts.**"))] | order(title asc)[0..9]{_id,title}`,
        { q: `${awSearch}*` } as any
      )
      setAwResults(results)
    }, 280)
    return () => clearTimeout(t)
  }, [awSearch, client])

  useEffect(() => {
    if (editingSlot === null) return
    function handler(e: MouseEvent) {
      if (editingRef.current && !editingRef.current.contains(e.target as Node)) setEditingSlot(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editingSlot])

  function openAction(value: string) {
    const opt = QUICK_ACTION_OPTIONS.find(o => o.value === value)
    if (!opt) return
    if (opt.modal === 'contact') { resetContact(); setContactModal(true) }
    else if (opt.modal === 'artwork') { resetArtwork(); setArtworkModal(true) }
    else if (opt.href) window.location.href = opt.href
  }

  function resetContact() { setCFirst(''); setCLast(''); setCEmail(''); setCType('collector'); setCNote(''); setCNewsletter(false); setCStatus('idle') }
  function resetArtwork() { setAwSearch(''); setAwResults([]); setAwSelected(null); setAwNewStatus('sold'); setAwSaving(false); setAwDone(false) }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault()
    setCStatus('saving')
    try {
      await client.create({ _type: 'contact', firstName: cFirst, lastName: cLast || undefined, email: cEmail || undefined, type: cType, notes: cNote || undefined, newsletterSubscribed: cNewsletter || undefined })
      setCStatus('done')
    } catch { setCStatus('error') }
  }

  async function submitArtworkStatus() {
    if (!awSelected) return
    setAwSaving(true)
    try { await client.patch(awSelected._id).set({ status: awNewStatus }).commit(); setAwDone(true) }
    catch { /* silent */ }
    setAwSaving(false)
  }

  useEffect(() => { load() }, [load])

  const totalAlerts = orders.length + nudges.length

  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }
  const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 32px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
            {new Date().toLocaleDateString(isNl ? 'nl-NL' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!loading && totalAlerts === 0 && (
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{isNl ? 'Alles op orde ✓' : 'All good ✓'}</span>
          )}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
            {(['nl', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', background: lang === l ? '#111' : '#fff', color: lang === l ? '#fff' : '#9ca3af', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', lineHeight: 1.4 }}>{l}</button>
            ))}
          </div>
          <button onClick={load} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: loading ? '#9ca3af' : '#374151', fontSize: 13, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            {loading ? (isNl ? 'Laden...' : 'Loading...') : (isNl ? '↻ Vernieuwen' : '↻ Refresh')}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
          {isNl ? 'Snelle acties' : 'Quick actions'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[0, 1, 2].map(slot => {
            const value = quickActions[slot] ?? ''
            const opt = QUICK_ACTION_OPTIONS.find(o => o.value === value)
            return (
              <div key={slot} style={{ position: 'relative' }}>
                <button
                  onClick={() => opt ? openAction(value) : setEditingSlot(slot)}
                  style={{ width: '100%', padding: '10px 14px', background: opt ? '#fff' : '#f9fafb', border: `1.5px solid ${opt ? '#e5e7eb' : '#d1d5db'}`, borderStyle: opt ? 'solid' : 'dashed', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#111'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = opt ? '#e5e7eb' : '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
                >
                  {opt
                    ? <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{isNl ? opt.labelNl : opt.labelEn}</div>
                    : <div style={{ fontSize: 15, color: '#9ca3af' }}>{isNl ? '+ Shortcut toevoegen' : '+ Add shortcut'}</div>
                  }
                </button>
                {opt && (
                  <button onClick={e => { e.stopPropagation(); setEditingSlot(editingSlot === slot ? null : slot) }} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9ca3af', padding: 4, lineHeight: 1 }}>✎</button>
                )}
                {editingSlot === slot && (
                  <div ref={editingRef} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                    {QUICK_ACTION_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => saveQuickAction(slot, o.value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: value === o.value ? '#f3f4f6' : '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = value === o.value ? '#f3f4f6' : '#fff'}
                      >
                        <span style={{ color: '#111' }}>{isNl ? o.labelNl : o.labelEn}</span>
                        {value === o.value && <span style={{ color: '#10b981', fontSize: 12 }}>✓</span>}
                      </button>
                    ))}
                    {value && (
                      <button onClick={() => saveQuickAction(slot, '')} style={{ display: 'flex', width: '100%', padding: '10px 14px', background: '#fff', border: 'none', borderTop: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontFamily: 'inherit' }}>
                        {isNl ? '✕ Verwijder shortcut' : '✕ Remove shortcut'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>{isNl ? 'Laden...' : 'Loading...'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Nudges */}
          {nudges.length > 0 && (
            <div>
              <SectionHeader title={isNl ? 'Aandachtspunten' : 'Action required'} count={nudges.length} color="#6b7280" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nudges.map(n => <NudgeCard key={n.id} nudge={n} lang={lang} />)}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          {events.length > 0 && (
            <div>
              <SectionHeader title={isNl ? 'Aankomende tentoonstellingen & art fairs' : 'Upcoming exhibitions & art fairs'} count={0} color="#10b981" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.map(e => {
                  const days = daysFromNow(e.dateFrom)
                  return (
                    <Card key={e._id} accent={e.artworkCount === 0 ? '#fca5a5' : '#a7f3d0'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 600 }}>{e.title}</span>
                            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: e.type === 'artFair' ? '#e0e7ff' : '#f3f4f6', color: e.type === 'artFair' ? '#4338ca' : '#6b7280', fontWeight: 500 }}>
                              {e.type === 'artFair' ? 'Art Fair' : 'Expo'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {e.artworkCount === 0
                              ? (isNl ? 'Nog geen werken gekoppeld' : 'No works linked yet')
                              : isNl ? `${e.artworkCount} werk${e.artworkCount !== 1 ? 'en' : ''} gekoppeld` : `${e.artworkCount} work${e.artworkCount !== 1 ? 's' : ''} linked`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(e.dateFrom)}</div>
                          <div style={{ fontSize: 11, color: days <= 14 ? '#dc2626' : '#9ca3af', marginTop: 2 }}>
                            {days === 0 ? (isNl ? 'Vandaag' : 'Today') : isNl ? `over ${days} dag${days !== 1 ? 'en' : ''}` : `in ${days} day${days !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Orders */}
          <div>
            <SectionHeader title={isNl ? 'Nieuwe bestellingen' : 'New orders'} count={orders.length} color="#ef4444" />
            {orders.length === 0 ? (
              <EmptyState label={isNl ? 'Geen nieuwe bestellingen' : 'No new orders'} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orders.map(o => (
                  <a key={o._id} href={`/studio/intent/edit/id=${o._id};type=order`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <Card accent="#fca5a5">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>#{o.orderNumber}</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{o.customerName ?? o.customerEmail ?? (isNl ? 'Onbekend' : 'Unknown')}</div>
                        </div>
                        {o.createdAt && <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(o.createdAt)}</span>}
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {!loading && (
        <p style={{ fontSize: 11, color: '#d1d5db', margin: '16px 0 0', textAlign: 'right' }}>
          {isNl ? 'Bijgewerkt om' : 'Updated at'} {lastRefresh.toLocaleTimeString(isNl ? 'nl-NL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <HelpWidget nudges={nudges} hasOrders={orders.length > 0} lang={lang} setLang={setLang} />

      {/* Add Contact Modal */}
      {contactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }} onClick={() => setContactModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{isNl ? 'Contact toevoegen' : 'Add contact'}</h2>
              <button onClick={() => setContactModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
            </div>
            {cStatus === 'done' ? (
              <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <p style={{ color: '#374151', margin: '0 0 16px' }}>{isNl ? `${cFirst} ${cLast} toegevoegd!` : `${cFirst} ${cLast} added!`}</p>
                <button onClick={resetContact} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isNl ? 'Nog een contact' : 'Add another'}
                </button>
              </div>
            ) : (
              <form onSubmit={submitContact} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={lbl}>{isNl ? 'Voornaam *' : 'First name *'}</label><input required autoFocus value={cFirst} onChange={e => setCFirst(e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>{isNl ? 'Achternaam' : 'Last name'}</label><input value={cLast} onChange={e => setCLast(e.target.value)} style={inp} /></div>
                </div>
                <div><label style={lbl}>Email</label><input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} style={{ ...inp, fontSize: 16 }} /></div>
                <div>
                  <label style={lbl}>{isNl ? 'Type contact' : 'Contact type'}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {[
                      { value: 'collector',   labelNl: 'Collector',  labelEn: 'Collector' },
                      { value: 'gallery',     labelNl: 'Galerie',    labelEn: 'Gallery' },
                      { value: 'press',       labelNl: 'Pers',       labelEn: 'Press' },
                      { value: 'institution', labelNl: 'Instelling', labelEn: 'Institution' },
                      { value: 'other',       labelNl: 'Anders',     labelEn: 'Other' },
                    ].map(t => (
                      <button key={t.value} type="button" onClick={() => setCType(t.value)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: `1.5px solid ${cType === t.value ? '#111' : '#e5e7eb'}`, background: cType === t.value ? '#111' : '#fff', color: cType === t.value ? '#fff' : '#374151' }}>
                        {isNl ? t.labelNl : t.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label style={lbl}>{isNl ? 'Notities' : 'Notes'}</label><textarea value={cNote} onChange={e => setCNote(e.target.value)} rows={2} style={{ ...inp, resize: 'none' }} /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={cNewsletter} onChange={e => setCNewsletter(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#111' }} />
                  <span>{isNl ? 'Aangemeld voor nieuwsbrief' : 'Newsletter subscriber'}</span>
                </label>
                {cStatus === 'error' && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{isNl ? 'Opslaan mislukt.' : 'Save failed.'}</p>}
                <button type="submit" disabled={cStatus === 'saving' || !cFirst.trim()} style={{ padding: '12px 0', background: cStatus === 'saving' || !cFirst.trim() ? '#f3f4f6' : '#111', color: cStatus === 'saving' || !cFirst.trim() ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {cStatus === 'saving' ? (isNl ? 'Opslaan...' : 'Saving…') : (isNl ? 'Contact opslaan' : 'Save contact')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Artwork Sold / Reserved Modal */}
      {artworkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setArtworkModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 440, padding: 28, boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{isNl ? 'Werk verkopen / reserveren' : 'Sell / reserve artwork'}</h2>
              <button onClick={() => setArtworkModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
            </div>
            {awDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <p style={{ color: '#374151', margin: '0 0 16px' }}>
                  {isNl ? `"${awSelected?.title}" is nu ${awNewStatus === 'sold' ? 'verkocht' : 'gereserveerd'}.` : `"${awSelected?.title}" is now ${awNewStatus}.`}
                </p>
                <button onClick={resetArtwork} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isNl ? 'Nog een werk' : 'Another artwork'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!awSelected ? (
                  <div>
                    <label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{isNl ? 'Zoek artwork' : 'Search artwork'}</label>
                    <input autoFocus value={awSearch} onChange={e => setAwSearch(e.target.value)} placeholder={isNl ? 'Titel...' : 'Title...'} style={{ display: 'block', width: '100%', marginTop: 4, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                    {awResults.length > 0 && (
                      <div style={{ marginTop: 6, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                        {awResults.map(r => (
                          <button key={r._id} onClick={() => setAwSelected(r)} style={{ display: 'block', width: '100%', padding: '10px 14px', background: '#fff', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#111' }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
                          >{r.title}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{awSelected.title}</div>
                      <button onClick={() => setAwSelected(null)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', cursor: 'pointer', fontFamily: 'inherit' }}>{isNl ? 'Wijzig' : 'Change'}</button>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>{isNl ? 'Nieuwe status' : 'New status'}</label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {(['sold', 'reserved'] as const).map(s => (
                          <button key={s} onClick={() => setAwNewStatus(s)} style={{ flex: 1, padding: '10px 0', background: awNewStatus === s ? '#111' : '#fff', color: awNewStatus === s ? '#fff' : '#374151', border: `1.5px solid ${awNewStatus === s ? '#111' : '#e5e7eb'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {isNl ? (s === 'sold' ? 'Verkocht' : 'Gereserveerd') : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={submitArtworkStatus} disabled={awSaving} style={{ padding: '12px 0', background: awSaving ? '#f3f4f6' : '#111', color: awSaving ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {awSaving ? (isNl ? 'Opslaan...' : 'Saving…') : (isNl ? 'Status bijwerken' : 'Update status')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export function DashboardIcon() {
  return React.createElement('span', { style: { fontSize: 16 } }, '⚡')
}

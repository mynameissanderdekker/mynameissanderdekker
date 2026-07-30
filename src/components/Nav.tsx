'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useCartStore } from '@/store/cart'
import { client } from '@/sanity/lib/client'

interface ProjectNav {
  _id: string
  title: string
  slug: { current: string }
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function CartIconShop() {
  const items = useCartStore((s) => s.items)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const count = mounted ? items.length : 0

  return (
    <Link href="/cart" aria-label="Winkelmandje" className="nav-shop-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      {count > 0 && (
        <span className="nav-cart-badge">{count}</span>
      )}
    </Link>
  )
}

function ProjectsDropdown({ projects, onClose }: { projects: ProjectNav[]; onClose: () => void }) {
  if (projects.length === 0) return null
  return (
    <div className="nav-dropdown" onMouseLeave={onClose}>
      {projects.map(p => (
        <Link
          key={p._id}
          href={`/projects/${p.slug.current}`}
          className="nav-dropdown-item"
          onClick={onClose}
        >
          {p.title}
        </Link>
      ))}
    </div>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const isShop = pathname === '/works' || pathname.startsWith('/works/')
  const isHome = pathname === '/'
  const [projects, setProjects] = useState<ProjectNav[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    client.fetch<ProjectNav[]>(
      `*[_type == "project" && isPage == true && hideFromNav != true && !(_id in path("drafts.**"))] | order(order asc) { _id, title, slug }`,
      {},
      { cache: 'no-store' }
    ).then(setProjects).catch(() => {})
  }, [])

  function openDropdown() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setDropdownOpen(true)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  return (
    <nav className="site-nav">
      {/* Logo — hidden on homepage */}
      {!isHome && (
        <Link href="/" className="nav-logo" aria-label="Homepage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://mynameissanderdekker.com/wp-content/uploads/2026/04/Mindmap-button.png"
            alt="Mindmap"
            className="nav-logo-img"
          />
        </Link>
      )}

      {/* Nav links */}
      <div className="nav-links">
        <Link
          href="/about"
          className={`nav-link${pathname === '/about' ? ' active' : ''}`}
        >
          ABOUT
        </Link>

        {/* PROJECTS with dropdown — not a link itself, only opens dropdown */}
        <div
          className="nav-link-wrap"
          onMouseEnter={openDropdown}
          onMouseLeave={scheduleClose}
        >
          <span
            className={`nav-link nav-link--no-href${pathname === '/projects' || pathname.startsWith('/projects/') ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setDropdownOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            PROJECTS
          </span>
          {dropdownOpen && projects.length > 0 && (
            <ProjectsDropdown
              projects={projects}
              onClose={() => setDropdownOpen(false)}
            />
          )}
        </div>

        <Link
          href="/cv"
          className={`nav-link${pathname === '/cv' ? ' active' : ''}`}
        >
          CV
        </Link>

        <Link
          href="/works"
          className={`nav-link${pathname === '/works' || pathname.startsWith('/works/') ? ' active' : ''}`}
        >
          WORKS
        </Link>

        <Link
          href="/contact"
          className={`nav-link${pathname === '/contact' ? ' active' : ''}`}
        >
          CONTACT
        </Link>
      </div>

      {/* Right side — shop icons only on /works pages */}
      <div className="nav-actions">
        {isShop && (
          <>
            <button className="nav-shop-icon" aria-label="Zoeken">
              <SearchIcon />
            </button>
            <Link href="/account" className="nav-shop-icon" aria-label="Account">
              <AccountIcon />
            </Link>
            <span className="nav-divider" aria-hidden="true" />
            <CartIconShop />
          </>
        )}
      </div>
    </nav>
  )
}

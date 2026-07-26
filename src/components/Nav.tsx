'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CartIcon from '@/components/CartIcon'

const NAV_LINKS = [
  { label: 'ABOUT', href: '/about' },
  { label: 'PROJECTS', href: '/projects' },
  { label: 'CV', href: '/cv' },
  { label: 'WORKS', href: '/works' },
]

export default function Nav() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <nav className="site-nav">
      {/* Logo — links naar homepage mindmap */}
      <Link href="/" className="nav-logo" aria-label="Homepage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mynameissanderdekker.com/wp-content/uploads/2026/04/Mindmap-button.png"
          alt="Mindmap"
          className="nav-logo-img"
        />
      </Link>

      {/* Links + cart */}
      <div className="nav-links">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link${pathname === href || pathname.startsWith(href + '/') ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
        <CartIcon />
      </div>
    </nav>
  )
}

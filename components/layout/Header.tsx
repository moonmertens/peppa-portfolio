'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CartIcon } from '@/components/cart/CartIcon'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface HeaderProps {
  artistName: string
  shopUrl?: string
}

const NAV_LINKS = [
  { label: 'Work', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'CV', href: '/cv' },
  { label: 'Shop', href: '/shop' },
  { label: 'Contact', href: '/contact' },
]

export function Header({ artistName, shopUrl: _shopUrl }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])
  /* eslint-enable react-hooks/set-state-in-effect */

  const closeMobile = () => setMobileOpen(false)

  const navLinkClass =
    'font-sans text-sm tracking-wide uppercase hover:text-[var(--color-warm-accent)] transition-colors duration-200'

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'rgba(250, 246, 240, 0.95)',
          backdropFilter: 'blur(4px)',
          borderColor: 'var(--color-muted)',
        }}
      >
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight hover:opacity-75 transition-opacity duration-200"
            style={{ color: 'var(--color-ink)' }}
          >
            {artistName}
          </Link>

          <nav>
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className={navLinkClass} style={{ color: 'var(--color-ink)' }}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <CartIcon />
              </li>
            </ul>
          </nav>
        </div>

        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight"
            style={{ color: 'var(--color-ink)' }}
            onClick={closeMobile}
          >
            {artistName}
          </Link>

          <div className="flex items-center gap-3">
            <CartIcon />

            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="p-2"
              style={{ color: 'var(--color-ink)' }}
            >
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <nav id="mobile-nav" className="md:hidden border-t" style={{ borderColor: 'var(--color-muted)' }}>
            <ul className="flex flex-col px-4 py-6 gap-6">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-sans text-base tracking-wide uppercase hover:text-[var(--color-warm-accent)] transition-colors duration-200"
                    style={{ color: 'var(--color-ink)' }}
                    onClick={closeMobile}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <CartDrawer />
    </>
  )
}

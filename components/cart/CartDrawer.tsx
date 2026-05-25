'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import Link from 'next/link'
import { useCartContext } from '@/lib/cart/CartContext'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, total } = useCartContext()

  // Hydration guard — mirrors the pattern in Lightbox.tsx
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  // shouldRender stays true until the slide-out transition finishes so the
  // animation can play before the portal is removed from the DOM.
  const [shouldRender, setShouldRender] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // Smooth open/close transition via double-rAF — mirrors Lightbox.tsx.
  // On open: mount the portal (shouldRender=true) in the first frame, then set
  // visible=true in the next so the CSS transition has a rendered node to run on.
  // On close: set visible=false; portal stays mounted until onTransitionEnd clears it.
  useEffect(() => {
    let id1: number
    let id2: number
    if (isOpen) {
      id1 = requestAnimationFrame(() => {
        setShouldRender(true)
        id2 = requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      id1 = requestAnimationFrame(() => {
        setVisible(false)
        // If reduced motion is active, onTransitionEnd never fires, so clear directly.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setShouldRender(false)
        }
      })
    }
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [isOpen])

  // Store the element that triggered the drawer open so we can return focus
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus()
    }
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [isOpen])

  // Body scroll lock while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap — same pattern as Lightbox.tsx
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      closeCart()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [closeCart])

  const handleCheckout = async () => {
    setLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Checkout unavailable. Please try again.')
        setLoading(false)
        return
      }
      const parsed = new URL(data.url)
      if (!parsed.hostname.endsWith('stripe.com')) throw new Error('Unexpected redirect')
      window.location.href = data.url
    } catch {
      setCheckoutError('Checkout unavailable. Please try again.')
      setLoading(false)
    }
  }

  if (!mounted) return null
  if (!shouldRender) return null

  // Safe to read window here — only runs client-side after mounted
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const content = (
    <>
      {/* Backdrop overlay */}
      {visible && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(26, 23, 20, 0.5)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        onTransitionEnd={() => {
          // Once the slide-out transition finishes, unmount the portal
          if (!isOpen) {
            setShouldRender(false)
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 61,
          width: '400px',
          maxWidth: '100vw',
          backgroundColor: 'var(--color-cream)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(26, 23, 20, 0.12)',
          transition: prefersReduced ? 'none' : 'transform 200ms ease',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-muted)',
            flexShrink: 0,
          }}
        >
          <h2
            className="font-serif"
            style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-ink)' }}
          >
            Your Cart
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-ink)',
              fontSize: '1.5rem',
              lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                paddingTop: '2rem',
                textAlign: 'center',
              }}
            >
              <p
                className="font-sans"
                style={{ color: 'var(--color-warm-gray)', fontSize: '0.875rem' }}
              >
                Your cart is empty.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="font-sans text-xs uppercase tracking-widest"
                style={{ color: 'var(--color-warm-accent)', textDecoration: 'underline' }}
              >
                Browse the Shop
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--color-muted)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      className="font-serif"
                      style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-ink)', lineHeight: 1.3 }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="font-sans"
                      style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-warm-accent)' }}
                    >
                      ${item.price}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title}`}
                    onClick={() => removeItem(item.id)}
                    className="font-sans"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--color-warm-gray)',
                      textDecoration: 'underline',
                      flexShrink: 0,
                      padding: '0.125rem 0',
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sticky footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--color-muted)',
              padding: '1.25rem 1.5rem',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                className="font-sans text-sm uppercase tracking-widest"
                style={{ color: 'var(--color-ink)' }}
              >
                Total
              </span>
              <span
                className="font-serif"
                style={{ fontSize: '1.125rem', color: 'var(--color-ink)' }}
              >
                ${total.toFixed(2)}
              </span>
            </div>

            {checkoutError && (
              <p
                role="alert"
                className="font-sans text-xs"
                style={{ color: '#ef4444', margin: 0 }}
              >
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="font-sans text-xs uppercase tracking-widest"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: loading ? 'var(--color-warm-gray)' : 'var(--color-ink)',
                color: 'var(--color-cream)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Redirecting…' : 'Checkout'}
            </button>

            <button
              type="button"
              onClick={closeCart}
              className="font-sans text-xs uppercase tracking-widest"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-warm-gray)',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )

  return ReactDOM.createPortal(content, document.body)
}

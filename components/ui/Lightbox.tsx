'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import ReactDOM from 'react-dom'
import Image from 'next/image'
import type { Piece } from '@/lib/types'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import type { CartItem } from '@/lib/cart/types'

interface LightboxProps {
  pieces: Piece[]
  imageUrls: string[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  projectId: string
}

function isNumericPrice(price: string): boolean {
  const n = parseFloat(price)
  return isFinite(n) && n > 0
}

function buildCartItem(piece: Piece, projectId: string, imageUrl: string): CartItem {
  return {
    id: `${projectId}__${piece._key}`,
    projectId,
    pieceKey: piece._key,
    title: piece.title,
    price: parseFloat(piece.price!),
    imageUrl,
  }
}

function AvailabilityBadge({ availability }: { availability?: Piece['availability'] }) {
  if (!availability || availability === 'available') {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest"
        style={{ color: 'var(--color-ink)' }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#4ade80',
            display: 'inline-block',
          }}
        />
        Available
      </span>
    )
  }
  if (availability === 'sold') {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest"
        style={{ color: 'var(--color-warm-gray)', textDecoration: 'line-through' }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'inline-block',
          }}
        />
        Sold
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest"
      style={{ color: 'var(--color-warm-gray)' }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'var(--color-muted)',
          display: 'inline-block',
        }}
      />
      Not for sale
    </span>
  )
}

export function Lightbox({
  pieces,
  imageUrls,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  projectId,
}: LightboxProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  // shouldRender stays true until the close transition finishes so the
  // fade-out animation can play before the portal is removed from the DOM.
  const [shouldRender, setShouldRender] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const isOpen = currentIndex >= 0

  // Hydration guard — schedule into a callback to satisfy lint rule
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // Store the element that triggered the lightbox so we can return focus
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Smooth open/close transition via double-rAF.
  // On open: mount the portal (shouldRender=true) in the first frame, then set
  // visible=true in the next so the CSS transition has a rendered node to run on.
  // On close: set visible=false; the portal stays mounted (shouldRender stays
  // true) until onTransitionEnd fires and clears it.
  useEffect(() => {
    let id1: number
    let id2: number
    if (isOpen) {
      // First frame: mount
      id1 = requestAnimationFrame(() => {
        setShouldRender(true)
        // Second frame: trigger transition now that the node exists in the DOM
        id2 = requestAnimationFrame(() => {
          setVisible(true)
        })
      })
    } else {
      id1 = requestAnimationFrame(() => {
        setVisible(false)
        // If reduced motion is active, onTransitionEnd never fires (transition: 'none'),
        // so we must clear shouldRender here directly to avoid a portal deadlock.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setShouldRender(false)
        }
        // Otherwise shouldRender is cleared by the onTransitionEnd handler below
      })
    }
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onPrev, onNext, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus()
    }
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [isOpen])

  // Focus trap
  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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
  }, [])

  if (!mounted) return null
  if (!shouldRender) return null

  // Safe to read window here — component only renders after mounted=true (client only)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // When the lightbox is closed, currentIndex is -1 — use the last valid index
  // so the outgoing content remains visible during the fade-out transition.
  const safeIndex = currentIndex >= 0 ? currentIndex : pieces.length > 0 ? 0 : 0
  const piece = pieces[isOpen ? currentIndex : safeIndex]
  const imageUrl = imageUrls[isOpen ? currentIndex : safeIndex]
  const showInquire =
    piece?.availability !== 'sold' && piece?.availability !== 'not for sale'

  const imgWidth = piece?.image?.asset?.metadata?.dimensions?.width ?? 1200
  const imgHeight = piece?.image?.asset?.metadata?.dimensions?.height ?? 900

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(26, 23, 20, 0.95)',
      }}
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={piece?.title ?? 'Lightbox'}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={() => {
          // Once the fade-out transition finishes, unmount the portal
          if (!isOpen) {
            setShouldRender(false)
          }
        }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          transition: prefersReduced ? 'none' : 'opacity 200ms ease, transform 200ms ease',
          opacity: visible ? 1 : 0,
          transform: prefersReduced ? 'none' : (visible ? 'scale(1)' : 'scale(0.97)'),
          outline: 'none',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close lightbox"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-cream)',
            fontSize: '1.75rem',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '0.5rem',
            zIndex: 10,
          }}
        >
          ×
        </button>

        {/* Prev arrow */}
        {currentIndex > 0 && (
          <button
            type="button"
            aria-label="Previous piece"
            onClick={onPrev}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--color-cream)',
              fontSize: '2rem',
              cursor: 'pointer',
              padding: '0.5rem',
              zIndex: 10,
            }}
          >
            ←
          </button>
        )}

        {/* Next arrow */}
        {currentIndex < pieces.length - 1 && (
          <button
            type="button"
            aria-label="Next piece"
            onClick={onNext}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--color-cream)',
              fontSize: '2rem',
              cursor: 'pointer',
              padding: '0.5rem',
              zIndex: 10,
            }}
          >
            →
          </button>
        )}

        {/* Content: image + metadata */}
        <div
          className="max-w-7xl mx-auto w-full flex flex-col md:flex-row"
          style={{ gap: '2rem', maxHeight: '90vh' }}
        >
          {/* Image area */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              maxHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={piece?.title ?? ''}
                width={imgWidth}
                height={imgHeight}
                sizes="(max-width: 768px) 100vw, 60vw"
                style={{
                  objectFit: 'contain',
                  maxHeight: '80vh',
                  width: '100%',
                  height: 'auto',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  paddingBottom: '75%',
                  backgroundColor: 'var(--color-muted)',
                }}
              />
            )}
          </div>

          {/* Metadata panel */}
          <div
            className="w-full md:w-80 md:flex-shrink-0"
            style={{
              color: 'var(--color-cream)',
              overflowY: 'auto',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {piece?.title && (
              <h2
                className="font-serif"
                style={{ fontSize: '1.5rem', lineHeight: 1.2, margin: 0 }}
              >
                {piece.title}
              </h2>
            )}

            {(piece?.year || piece?.medium) && (
              <p
                className="font-sans text-sm"
                style={{ color: 'rgba(250,246,240,0.7)', margin: 0 }}
              >
                {[piece.year, piece.medium].filter(Boolean).join(' · ')}
              </p>
            )}

            {piece?.dimensions && (
              <p
                className="font-sans text-sm"
                style={{ color: 'rgba(250,246,240,0.7)', margin: 0 }}
              >
                {piece.dimensions}
              </p>
            )}

            {piece?.description && (
              <p
                className="font-sans text-sm"
                style={{
                  lineHeight: 1.6,
                  color: 'rgba(250,246,240,0.85)',
                  margin: 0,
                }}
              >
                {piece.description}
              </p>
            )}

            {piece?.price && (
              <p
                className="font-sans text-base"
                style={{ color: 'var(--color-cream)', margin: 0 }}
              >
                {piece.price}
              </p>
            )}

            {piece?.availability !== undefined && (
              <AvailabilityBadge availability={piece.availability} />
            )}

            {showInquire && piece?.title && (
              <a
                href={`/contact?subject=${encodeURIComponent(piece.title)}`}
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  border: '1px solid var(--color-warm-accent)',
                  color: 'var(--color-warm-accent)',
                  fontFamily: 'var(--font-family-sans)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-warm-accent)'
                  e.currentTarget.style.color = 'var(--color-ink)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--color-warm-accent)'
                }}
              >
                Inquire
              </a>
            )}

            {piece?.availability === 'available' && piece?.price && isNumericPrice(piece.price) && (
              <AddToCartButton item={buildCartItem(piece, projectId, imageUrl)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}

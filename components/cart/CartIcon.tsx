'use client'

import { useCartContext } from '@/lib/cart/CartContext'

export function CartIcon() {
  const { itemCount, openCart, isHydrated } = useCartContext()

  return (
    <button
      type="button"
      aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
      onClick={openCart}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-ink)',
        padding: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Shopping bag icon — stroke-based, 24×24 */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {/* Badge — only rendered when hydrated and itemCount > 0 */}
      {isHydrated && itemCount > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-warm-accent)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '0.625rem',
            fontWeight: 600,
            lineHeight: '16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {itemCount}
        </span>
      )}
    </button>
  )
}

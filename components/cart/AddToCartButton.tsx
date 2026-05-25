'use client'

import { useCartContext } from '@/lib/cart/CartContext'
import type { CartItem } from '@/lib/cart/types'

interface AddToCartButtonProps {
  item: CartItem
}

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const { items, addItem, openCart, isHydrated } = useCartContext()
  const isInCart = items.some((i) => i.id === item.id)

  if (!isHydrated) {
    return (
      <button
        type="button"
        disabled
        className="font-sans text-xs uppercase tracking-widest px-6 py-3 border"
        style={{
          borderColor: 'var(--color-muted)',
          color: 'transparent',
          cursor: 'default',
        }}
        aria-hidden="true"
      >
        ...
      </button>
    )
  }

  if (isInCart) {
    return (
      <button
        type="button"
        disabled
        className="font-sans text-xs uppercase tracking-widest px-6 py-3 border"
        style={{
          borderColor: 'var(--color-muted)',
          color: 'var(--color-warm-gray)',
          cursor: 'not-allowed',
        }}
      >
        In Cart
      </button>
    )
  }

  return (
    <button
      type="button"
      className="font-sans text-xs uppercase tracking-widest px-6 py-3 border"
      style={{
        borderColor: 'var(--color-warm-accent)',
        color: 'var(--color-warm-accent)',
        transition: 'background-color 150ms ease, color 150ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-warm-accent)'
        e.currentTarget.style.color = 'var(--color-ink)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = 'var(--color-warm-accent)'
      }}
      onClick={() => {
        addItem(item)
        openCart()
      }}
    >
      Add to Cart
    </button>
  )
}

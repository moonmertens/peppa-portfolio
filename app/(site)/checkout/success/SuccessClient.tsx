'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCartContext } from '@/lib/cart/CartContext'

export function SuccessClient() {
  const { clearCart } = useCartContext()

  useEffect(() => {
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main id="main-content">
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ backgroundColor: 'var(--color-cream)' }}
      >
        <h1
          className="font-serif text-4xl md:text-5xl mb-6"
          style={{ color: 'var(--color-ink)' }}
        >
          Thank you for your purchase
        </h1>

        <p
          className="font-sans text-base max-w-md mb-10"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          Your order has been placed. The artist will be in touch with shipping
          details.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/"
            className="font-sans text-sm uppercase tracking-widest underline underline-offset-4"
            style={{ color: 'var(--color-ink)' }}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="font-sans text-sm uppercase tracking-widest underline underline-offset-4"
            style={{ color: 'var(--color-warm-accent)' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}

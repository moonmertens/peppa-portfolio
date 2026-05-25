import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Order Cancelled',
}

export default function CheckoutCancelledPage() {
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
          Checkout Cancelled
        </h1>

        <p
          className="font-sans text-base max-w-md mb-10"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          No payment was taken. Your cart is still saved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/shop"
            className="font-sans text-sm uppercase tracking-widest underline underline-offset-4"
            style={{ color: 'var(--color-warm-accent)' }}
          >
            Return to Shop
          </Link>
          <Link
            href="/"
            className="font-sans text-sm uppercase tracking-widest underline underline-offset-4"
            style={{ color: 'var(--color-ink)' }}
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}

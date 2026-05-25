'use client'

import { useState } from 'react'
import type { SubscriptionTier } from '@/lib/types'

interface SubscriptionTierCardProps {
  tier: SubscriptionTier
}

export function SubscriptionTierCard({ tier }: SubscriptionTierCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tier.stripePriceId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Subscription unavailable. Please try again.')
        setLoading(false)
        return
      }
      const parsed = new URL(data.url)
      if (!parsed.hostname.endsWith('stripe.com')) {
        throw new Error('Unexpected redirect destination')
      }
      window.location.href = data.url
    } catch {
      setError('Subscription unavailable. Please try again.')
      setLoading(false)
    }
  }

  return (
    <article
      className="flex flex-col gap-4 p-6"
      style={{
        backgroundColor: 'var(--color-cream)',
        border: '1px solid var(--color-muted)',
      }}
    >
      <h3
        className="font-serif text-xl leading-snug"
        style={{ color: 'var(--color-ink)' }}
      >
        {tier.name}
      </h3>

      {tier.displayPrice && (
        <p
          className="font-sans text-lg font-medium"
          style={{ color: 'var(--color-warm-accent)' }}
        >
          {tier.displayPrice}
        </p>
      )}

      {tier.description && (
        <p
          className="font-sans text-sm leading-relaxed"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          {tier.description}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="font-sans text-xs"
          style={{ color: '#ef4444' }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="font-sans text-xs uppercase tracking-widest"
        style={{
          marginTop: 'auto',
          padding: '0.75rem 1.5rem',
          backgroundColor: loading
            ? 'var(--color-warm-gray)'
            : 'var(--color-warm-accent)',
          color: 'var(--color-ink)',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Redirecting…' : 'Subscribe'}
      </button>
    </article>
  )
}

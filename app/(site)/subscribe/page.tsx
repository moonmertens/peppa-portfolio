import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { subscriptionTiersQuery, subscribePageSettingsQuery } from '@/lib/queries'
import type { SubscriptionTier } from '@/lib/types'
import { SubscriptionTierCard } from '@/components/shop/SubscriptionTierCard'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Subscribe' }
}

interface SubscribePageSettings {
  subscribePageHeading?: string
  subscribePageDescription?: string
}

export default async function SubscribePage() {
  let tiers: SubscriptionTier[] = []
  let settings: SubscribePageSettings = {}

  try {
    tiers = await sanityFetch<SubscriptionTier[]>(subscriptionTiersQuery)
  } catch (error) {
    console.error('Failed to fetch subscription tiers:', error)
  }

  try {
    settings =
      (await sanityFetch<SubscribePageSettings | null>(subscribePageSettingsQuery)) ?? {}
  } catch (error) {
    console.error('Failed to fetch subscribe page settings:', error)
  }

  const heading = settings.subscribePageHeading ?? 'Support the Artist'

  return (
    <main id="main-content">
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <h1
          className="font-serif text-5xl md:text-6xl mb-6"
          style={{ color: 'var(--color-ink)' }}
        >
          {heading}
        </h1>

        {settings.subscribePageDescription && (
          <p
            className="font-sans text-base max-w-2xl mb-12"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            {settings.subscribePageDescription}
          </p>
        )}

        {!settings.subscribePageDescription && (
          <div className="mb-12" />
        )}

        {tiers.length === 0 ? (
          <p
            className="font-sans text-base"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            Subscription tiers coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <SubscriptionTierCard key={tier._id} tier={tier} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

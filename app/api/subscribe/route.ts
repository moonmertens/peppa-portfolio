import Stripe from 'stripe'
import { client } from '@/sanity/sanity.client'
import { subscriptionTiersQuery } from '@/lib/queries'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

interface SubscriptionTier {
  stripePriceId: string
}

export async function POST(request: Request) {
  try {
    const { priceId }: { priceId: string } = await request.json()

    if (!priceId || typeof priceId !== 'string' || priceId.trim() === '') {
      return Response.json({ error: 'Invalid price ID.' }, { status: 400 })
    }

    // Validate priceId against Sanity-authoritative subscription tiers
    const tiers = await client.fetch<SubscriptionTier[]>(
      subscriptionTiersQuery,
      {},
      { cache: 'no-store' }
    )
    const validPriceIds = new Set(tiers.map((t) => t.stripePriceId).filter(Boolean))
    if (!validPriceIds.has(priceId)) {
      return Response.json({ error: 'Invalid price ID.' }, { status: 400 })
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
    })

    if (!session.url) {
      return Response.json(
        { error: 'Subscription checkout unavailable. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Stripe subscribe error:', err)
    return Response.json(
      { error: 'Subscription checkout unavailable. Please try again.' },
      { status: 500 }
    )
  }
}

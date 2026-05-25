import Stripe from 'stripe'
import { client } from '@/sanity/sanity.client'
import { piecesByProjectQuery } from '@/lib/queries'
import type { CartItem } from '@/lib/cart/types'

// Currency is hardcoded to SGD. All piece prices in Sanity are stored as
// numeric strings representing Singapore dollars (e.g. "450" = S$450).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

interface SanityPiece {
  _key: string
  price: string
  availability: string
}

interface SanityProject {
  _id: string
  pieces: SanityPiece[]
}

export async function POST(request: Request) {
  try {
    const { items }: { items: CartItem[] } = await request.json()

    // Validate: items must be a non-empty array
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.projectId || !item.pieceKey || !(item.price > 0)) {
        return Response.json(
          { error: 'Invalid cart item.' },
          { status: 400 }
        )
      }
    }

    // Collect unique projectIds
    const projectIds = [...new Set(items.map((item) => item.projectId))]

    // Fetch piece data from Sanity with no-store to get real-time availability.
    // Using client.fetch() directly instead of sanityFetch() because sanityFetch
    // hardcodes cache: "force-cache" which could serve stale sold-piece data.
    const sanityProjects = await client.fetch<SanityProject[]>(
      piecesByProjectQuery,
      { projectIds },
      { cache: 'no-store' }
    )

    // Build a lookup map: projectId -> pieceKey -> piece
    const pieceMap = new Map<string, Map<string, SanityPiece>>()
    for (const project of sanityProjects) {
      const piecesById = new Map<string, SanityPiece>()
      for (const piece of project.pieces ?? []) {
        piecesById.set(piece._key, piece)
      }
      pieceMap.set(project._id, piecesById)
    }

    // Validate each cart item against live Sanity data
    for (const item of items) {
      const projectPieces = pieceMap.get(item.projectId)
      const sanityPiece = projectPieces?.get(item.pieceKey)

      if (!sanityPiece) {
        return Response.json(
          { error: 'One or more items are no longer available.' },
          { status: 400 }
        )
      }

      if (sanityPiece.availability !== 'available') {
        return Response.json(
          { error: 'One or more items are no longer available.' },
          { status: 400 }
        )
      }

      const sanityPrice = parseFloat(sanityPiece.price)
      if (!isFinite(sanityPrice) || sanityPrice <= 0) {
        return Response.json(
          { error: 'One or more items are no longer available.' },
          { status: 400 }
        )
      }

      // Detect price manipulation: cart price must match Sanity price
      if (Math.round(item.price * 100) !== Math.round(sanityPrice * 100)) {
        return Response.json(
          { error: 'One or more items are no longer available.' },
          { status: 400 }
        )
      }
    }

    // Build Stripe line_items using Sanity-authoritative prices
    const line_items = items.map((item) => {
      const sanityPrice = parseFloat(
        pieceMap.get(item.projectId)!.get(item.pieceKey)!.price
      )
      return {
        price_data: {
          currency: 'sgd',
          product_data: {
            name: item.title,
            images: [item.imageUrl],
          },
          unit_amount: Math.round(sanityPrice * 100),
        },
        quantity: 1,
      }
    })

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['SG', 'US', 'GB', 'AU', 'CA', 'NZ', 'MY', 'JP'],
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelled`,
    })

    if (!session.url) {
      return Response.json(
        { error: 'Checkout unavailable. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return Response.json(
      { error: 'Checkout unavailable. Please try again.' },
      { status: 500 }
    )
  }
}

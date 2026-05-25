'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ShopPiece } from '@/lib/types'
import type { CartItem } from '@/lib/cart/types'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

interface ShopPieceCardProps {
  piece: ShopPiece
}

export function ShopPieceCard({ piece }: ShopPieceCardProps) {
  const numericPrice = parseFloat(piece.price)
  const isNumericPrice = isFinite(numericPrice) && numericPrice > 0

  const cartItem: CartItem | null = isNumericPrice
    ? {
        id: `${piece.projectId}__${piece._key}`,
        projectId: piece.projectId,
        pieceKey: piece._key,
        title: piece.title,
        price: numericPrice,
        imageUrl: piece.imageUrl,
      }
    : null

  const aspectRatio =
    piece.image?.asset?.metadata?.dimensions?.aspectRatio ?? 1

  return (
    <article className="flex flex-col gap-3">
      {/* Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: String(aspectRatio) }}
      >
        <Image
          src={piece.imageUrl}
          alt={piece.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1">
        <h2
          className="font-serif text-lg leading-snug"
          style={{ color: 'var(--color-ink)' }}
        >
          {piece.title}
        </h2>

        {piece.medium && (
          <p
            className="font-sans text-sm"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            {piece.medium}
          </p>
        )}

        <p
          className="font-sans text-sm font-medium"
          style={{ color: 'var(--color-warm-accent)' }}
        >
          {isNumericPrice ? `$${piece.price}` : piece.price}
        </p>
      </div>

      {isNumericPrice && cartItem ? (
        <AddToCartButton item={cartItem} />
      ) : (
        <Link
          href={`/contact?subject=${encodeURIComponent(piece.title)}`}
          className="font-sans text-xs uppercase tracking-widest px-6 py-3 border inline-block text-center"
          style={{
            borderColor: 'var(--color-warm-accent)',
            color: 'var(--color-warm-accent)',
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
          Contact to Purchase
        </Link>
      )}
    </article>
  )
}

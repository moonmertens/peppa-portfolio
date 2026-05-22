'use client'

import Image from 'next/image'
import { forwardRef } from 'react'
import type { Piece } from '@/lib/types'

interface PieceImageProps {
  piece: Piece
  imageUrl: string
  index: number
  onOpen: (index: number) => void
  priority?: boolean
}

export const PieceImage = forwardRef<HTMLButtonElement, PieceImageProps>(
  function PieceImage({ piece, imageUrl, index, onOpen, priority = false }, ref) {
    const width = piece.image?.asset?.metadata?.dimensions?.width ?? 1100
    const height = piece.image?.asset?.metadata?.dimensions?.height ?? 800

    return (
      <article>
        <button
          ref={ref}
          type="button"
          aria-label={`View ${piece.title} in lightbox`}
          onClick={() => onOpen(index)}
          className="transition-opacity duration-200 hover:opacity-90 cursor-pointer w-full block"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={piece.title}
              width={width}
              height={height}
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              sizes="(max-width: 768px) 100vw, 90vw"
              style={{ width: '100%', height: 'auto', display: 'block' }}
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
        </button>

        <div className="mt-3">
          <p
            className="font-serif text-base"
            style={{ color: 'var(--color-ink)' }}
          >
            {piece.title}
          </p>
          {(piece.year || piece.medium) && (
            <p
              className="font-sans text-sm mt-1"
              style={{ color: 'var(--color-warm-gray)' }}
            >
              {[piece.year, piece.medium].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </article>
    )
  }
)

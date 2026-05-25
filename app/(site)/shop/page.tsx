import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { shopPiecesQuery } from '@/lib/queries'
import type { ShopPiece } from '@/lib/types'
import { urlFor } from '@/lib/sanity/image'
import { ShopPieceCard } from '@/components/shop/ShopPieceCard'

export const metadata: Metadata = {
  title: 'Shop',
}

interface RawShopPiece {
  _key: string
  title: string
  image: ShopPiece['image']
  medium?: string
  price: string
  availability: string
}

interface RawShopProject {
  _id: string
  title: string
  pieces: RawShopPiece[]
}

export default async function ShopPage() {
  let projects: RawShopProject[] = []
  try {
    projects = await sanityFetch<RawShopProject[]>(shopPiecesQuery)
  } catch (error) {
    console.error('Failed to fetch shop pieces:', error)
  }

  const pieces: ShopPiece[] = []

  for (const project of projects ?? []) {
    for (const piece of project.pieces ?? []) {
      if (piece.availability !== 'available') continue

      let imageUrl = ''
      try {
        imageUrl = urlFor(piece.image).width(800).auto('format').url()
      } catch (error) {
        console.error('Failed to build image URL for piece:', piece._key, error)
        continue
      }

      pieces.push({
        _key: piece._key,
        projectId: project._id,
        title: piece.title,
        image: piece.image,
        medium: piece.medium,
        price: piece.price,
        availability: 'available',
        imageUrl,
      })
    }
  }

  return (
    <main id="main-content">
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <h1
          className="font-serif text-5xl md:text-6xl mb-12"
          style={{ color: 'var(--color-ink)' }}
        >
          Shop
        </h1>

        {pieces.length === 0 ? (
          <p
            className="font-sans text-base"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            No pieces are currently available for purchase.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {pieces.map((piece) => (
              <ShopPieceCard key={`${piece.projectId}__${piece._key}`} piece={piece} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

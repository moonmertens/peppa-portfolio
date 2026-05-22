import type { Metadata } from 'next'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { sanityFetch } from '@/sanity/sanity.client'
import { aboutPageQuery } from '@/lib/queries'
import type { AboutPage } from '@/lib/types'
import { urlFor } from '@/lib/sanity/image'
import { FadeIn } from '@/components/ui/FadeIn'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'About', description: 'About the artist' }
}

export default async function AboutPage() {
  let about: AboutPage | null = null
  try {
    about = await sanityFetch<AboutPage | null>(aboutPageQuery)
  } catch (error) {
    console.error('Failed to fetch about page content:', error)
  }

  if (!about) {
    return (
      <main id="main-content">
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <p
            className="font-sans text-center"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            About content coming soon.
          </p>
        </section>
      </main>
    )
  }

  let photoUrl = ''
  let objectPosition = 'center center'

  if (about.artistPhoto) {
    try {
      photoUrl = urlFor(about.artistPhoto)
        .width(900)
        .height(1100)
        .fit('crop')
        .auto('format')
        .url()

      if (about.artistPhoto.hotspot) {
        const { x, y } = about.artistPhoto.hotspot
        objectPosition = `${x * 100}% ${y * 100}%`
      }
    } catch (error) {
      console.error('Failed to build artist photo URL:', error)
    }
  }

  return (
    <main id="main-content">
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20">
          {/* Left column — artist photo */}
          <FadeIn className="md:w-2/5 flex-shrink-0">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: '4 / 5' }}
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={about.heading ?? 'Artist photo'}
                  fill
                  className="object-cover"
                  style={{ objectPosition }}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                />
              )}
            </div>
          </FadeIn>

          {/* Right column — heading + bio */}
          <FadeIn delay={120} className="md:flex-1">
            <h1
              className="font-serif text-4xl md:text-5xl mb-8"
              style={{ color: 'var(--color-ink)' }}
            >
              {about.heading || 'About'}
            </h1>

            {about.bio && about.bio.length > 0 && (
              <div
                className="font-sans text-base leading-relaxed"
                style={{ color: 'var(--color-ink)' }}
              >
                <PortableText value={about.bio} />
              </div>
            )}
          </FadeIn>
        </div>
      </section>
    </main>
  )
}

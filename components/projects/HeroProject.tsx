import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface HeroProjectProps {
  project: Project
  imageUrl: string
}

export function HeroProject({ project, imageUrl }: HeroProjectProps) {
  if (!project) return null

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '70vh' }}>
      <Link href={`/projects/${project.slug.current}`} aria-label={project.title} className="absolute inset-0 z-10">
        {/* Cover image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={project.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-muted)' }} />
        )}

        {/* Overlay with title */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink/60 to-transparent px-6 pb-10 pt-24">
          {project.category && (
            <p
              className="font-sans text-sm uppercase tracking-widest mb-3"
              style={{ color: 'rgba(250, 246, 240, 0.8)' }}
            >
              {project.category}
            </p>
          )}
          <h1
            className="font-serif text-4xl md:text-6xl"
            style={{ color: 'var(--color-cream)' }}
          >
            {project.title}
          </h1>
        </div>
      </Link>
    </section>
  )
}

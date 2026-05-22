import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  imageUrl: string
}

export function ProjectCard({ project, imageUrl }: ProjectCardProps) {
  return (
    <article className="group">
      <Link href={`/projects/${project.slug.current}`}>
        {/* Image wrapper with portrait aspect ratio */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-muted)' }} />
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 23, 20, 0.3)' }}
          >
            <p
              className="font-serif text-lg text-center px-4"
              style={{ color: 'var(--color-cream)' }}
            >
              {project.title}
            </p>
          </div>
        </div>

        {/* Card footer */}
        <div className="mt-3">
          <p
            className="font-sans text-sm"
            style={{ color: 'var(--color-ink)' }}
          >
            {project.title}
          </p>
          {project.category && (
            <p
              className="font-sans text-xs mt-1"
              style={{ color: 'var(--color-warm-gray)' }}
            >
              {project.category}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}

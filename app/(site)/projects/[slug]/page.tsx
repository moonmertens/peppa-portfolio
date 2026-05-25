import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import { toPlainText } from '@portabletext/toolkit'
import { sanityFetch } from '@/sanity/sanity.client'
import { projectBySlugQuery, projectsQuery, siteSettingsQuery } from '@/lib/queries'
import type { ProjectDetail, SiteSettings } from '@/lib/types'
import { urlFor } from '@/lib/sanity/image'
import { JsonLd } from '@/components/seo/JsonLd'
import { ProjectDetailClient } from './ProjectDetailClient'

// Allow slugs not pre-rendered at build time to still be served
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const projects = await sanityFetch<{ slug: { current: string } }[]>(projectsQuery)
    return (projects ?? []).map((p) => ({ slug: p.slug.current }))
  } catch (error) {
    console.error('Failed to fetch project slugs for static params:', error)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const project = await sanityFetch<ProjectDetail | null>(projectBySlugQuery, { slug })

    if (!project) return {}

    const description = project.description
      ? toPlainText(project.description).slice(0, 160)
      : ''

    let ogImages: { url: string }[] = []
    if (project.coverImage) {
      try {
        const ogImageUrl = urlFor(project.coverImage)
          .width(1200)
          .height(630)
          .fit('crop')
          .auto('format')
          .url()
        ogImages = [{ url: ogImageUrl }]
      } catch (error) {
        console.error('Failed to build OG image URL for project metadata:', error)
      }
    }

    return {
      title: project.title,
      description: description || undefined,
      openGraph: {
        images: ogImages,
      },
    }
  } catch (error) {
    console.error('Failed to fetch project metadata:', error)
    return {}
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let project: ProjectDetail | null = null
  try {
    project = await sanityFetch<ProjectDetail | null>(projectBySlugQuery, { slug })
  } catch (error) {
    console.error('Failed to fetch project by slug:', error)
  }

  if (!project) {
    notFound()
  }

  // Pre-build piece image URLs server-side
  const pieces = project.pieces ?? []
  const pieceImageUrls = pieces.map((piece) => {
    try {
      return urlFor(piece.image).width(1400).auto('format').url()
    } catch (error) {
      console.error('Failed to build piece image URL:', error)
      return ''
    }
  })

  const plainDescription = project.description
    ? toPlainText(project.description).slice(0, 300)
    : ''

  let settingsForSchema: SiteSettings | null = null
  try {
    settingsForSchema = await sanityFetch<SiteSettings | null>(siteSettingsQuery)
  } catch (error) {
    console.error('Failed to fetch site settings for schema:', error)
  }

  const creativeWorkSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    ...(plainDescription && { description: plainDescription }),
    ...(settingsForSchema?.artistName && {
      author: {
        '@type': 'Person',
        name: settingsForSchema.artistName,
      },
    }),
  }

  return (
    <main id="main-content">
      <JsonLd id="json-ld-creative-work" data={creativeWorkSchema} />
      {/* Project header */}
      <header
        className="max-w-5xl mx-auto px-4 pt-16 pb-12"
      >
        {project.category && (
          <p
            className="font-sans text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-warm-accent)' }}
          >
            {project.category}
          </p>
        )}

        <h1
          className="font-serif text-5xl md:text-7xl mb-4"
          style={{ color: 'var(--color-ink)' }}
        >
          {project.title}
        </h1>

        {project.date && (
          <p
            className="font-sans text-sm mb-8"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            {new Date(project.date).getFullYear()}
          </p>
        )}

        {project.description && project.description.length > 0 && (
          <div
            className="font-sans text-base leading-relaxed max-w-2xl"
            style={{ color: 'var(--color-ink)' }}
          >
            <PortableText value={project.description} />
          </div>
        )}
      </header>

      <hr
        className="max-w-5xl mx-auto"
        style={{
          borderColor: 'var(--color-muted)',
          borderTopWidth: 1,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />

      {/* Pieces — interactive, client-rendered */}
      <ProjectDetailClient
        project={project}
        pieceImageUrls={pieceImageUrls}
        projectId={project._id}
      />
    </main>
  )
}

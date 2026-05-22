import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { projectsQuery, siteSettingsQuery } from '@/lib/queries'
import type { Project, SiteSettings } from '@/lib/types'
import { urlFor } from '@/lib/sanity/image'
import { HeroProject } from '@/components/projects/HeroProject'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { FadeIn } from '@/components/ui/FadeIn'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [settings, projects] = await Promise.all([
      sanityFetch<SiteSettings | null>(siteSettingsQuery),
      sanityFetch<Project[]>(projectsQuery),
    ])

    const tagline = settings?.tagline ?? ''
    const featuredProject = projects?.[0]
    let ogImages: { url: string }[] = []

    if (featuredProject?.coverImage) {
      try {
        const ogImageUrl = urlFor(featuredProject.coverImage)
          .width(1200)
          .height(630)
          .fit('crop')
          .auto('format')
          .url()
        ogImages = [{ url: ogImageUrl }]
      } catch (error) {
        console.error('Failed to build OG image URL for homepage:', error)
      }
    }

    return {
      title: 'Work',
      description: tagline || undefined,
      openGraph: {
        images: ogImages,
      },
    }
  } catch (error) {
    console.error('Failed to fetch metadata for homepage:', error)
    return { title: 'Work' }
  }
}

function EmptyHero() {
  return (
    <section
      className="relative flex items-center justify-center"
      style={{ minHeight: '70vh', backgroundColor: 'var(--color-muted)' }}
    >
      <div className="text-center px-6">
        <p
          className="font-serif text-3xl md:text-5xl mb-4"
          style={{ color: 'var(--color-ink)' }}
        >
          Coming soon
        </p>
        <p
          className="font-sans text-sm uppercase tracking-widest"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          Projects will appear here once connected to Sanity
        </p>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const projects = await sanityFetch<Project[]>(projectsQuery).catch((error) => {
    console.error('Failed to fetch projects for homepage:', error)
    return [] as Project[]
  })

  const [featuredProject, ...remainingProjects] = projects

  const heroImageUrl = featuredProject
    ? urlFor(featuredProject.coverImage).width(1600).height(900).fit('crop').auto('format').url()
    : ''

  const cardImageUrls = remainingProjects.map((p) =>
    urlFor(p.coverImage).width(600).height(800).fit('crop').auto('format').url()
  )

  return (
    <main id="main-content">
      {featuredProject ? (
        <HeroProject project={featuredProject} imageUrl={heroImageUrl} />
      ) : (
        <EmptyHero />
      )}

      <section className="max-w-7xl mx-auto px-4 py-16">
        {remainingProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {remainingProjects.map((project, i) => (
              <FadeIn key={project._id} delay={i * 80}>
                <ProjectCard project={project} imageUrl={cardImageUrls[i]} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <p
            className="font-sans text-center py-24"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            No projects yet.
          </p>
        )}
      </section>
    </main>
  )
}

import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { projectsQuery } from '@/lib/queries'
import type { Project } from '@/lib/types'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${siteUrl}/`, lastModified: new Date() },
  { url: `${siteUrl}/about`, lastModified: new Date() },
  { url: `${siteUrl}/cv`, lastModified: new Date() },
  { url: `${siteUrl}/contact`, lastModified: new Date() },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projects: Project[] = []
  try {
    const result = await sanityFetch<Project[]>(projectsQuery)
    projects = result ?? []
  } catch (error) {
    console.error('Failed to fetch projects for sitemap:', error)
  }

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug.current}`,
    lastModified: new Date(),
  }))

  return [...staticRoutes, ...projectRoutes]
}

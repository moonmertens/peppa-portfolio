import { Suspense } from 'react'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { siteSettingsQuery } from '@/lib/queries'
import type { SiteSettings } from '@/lib/types'
import { FadeIn } from '@/components/ui/FadeIn'
import { ContactForm } from '@/components/contact/ContactForm'


export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Contact', description: 'Get in touch' }
}

export default async function ContactPage() {
  let contactFormHeading: string | undefined
  try {
    const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery)
    contactFormHeading = settings?.contactFormHeading
  } catch (error) {
    console.error('Failed to fetch site settings for contact page:', error)
  }

  return (
    <main id="main-content">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <FadeIn delay={100}>
          {/* ContactForm uses useSearchParams and must be in a Suspense boundary */}
          <Suspense fallback={null}>
            <ContactForm heading={contactFormHeading} />
          </Suspense>
        </FadeIn>
      </div>
    </main>
  )
}

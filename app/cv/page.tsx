import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/sanity.client'
import { cvEntriesQuery } from '@/lib/queries'
import type { CvEntry, CvEntryType } from '@/lib/types'
import { FadeIn } from '@/components/ui/FadeIn'

const SECTION_ORDER: CvEntryType[] = ['exhibition', 'education', 'award', 'press']

const SECTION_LABELS: Record<CvEntryType, string> = {
  exhibition: 'Exhibitions',
  education: 'Education',
  award: 'Awards',
  press: 'Press',
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'CV', description: 'Curriculum vitae' }
}

export default async function CvPage() {
  let entries: CvEntry[] = []
  try {
    const result = await sanityFetch<CvEntry[] | null>(cvEntriesQuery)
    entries = result ?? []
  } catch (error) {
    console.error('Failed to fetch CV entries:', error)
  }

  // Group entries by type, preserving year-desc order from GROQ
  const grouped = new Map<CvEntryType, CvEntry[]>()
  for (const type of SECTION_ORDER) {
    const section = entries.filter((e) => e.type === type)
    if (section.length > 0) {
      grouped.set(type, section)
    }
  }

  return (
    <main id="main-content">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <FadeIn>
          <h1
            className="font-serif text-5xl md:text-6xl mb-16"
            style={{ color: 'var(--color-ink)' }}
          >
            CV
          </h1>
        </FadeIn>

        {grouped.size === 0 ? (
          <FadeIn delay={80}>
            <p
              className="font-sans text-center py-16"
              style={{ color: 'var(--color-warm-gray)' }}
            >
              No CV entries yet.
            </p>
          </FadeIn>
        ) : (
          Array.from(grouped.entries()).map(([type, sectionEntries], sectionIndex) => (
            <FadeIn key={type} delay={sectionIndex * 80}>
              <section className="mb-14">
                <h2
                  className="font-sans text-xs uppercase tracking-widest mb-6"
                  style={{ color: 'var(--color-warm-accent)' }}
                >
                  {SECTION_LABELS[type]}
                </h2>

                <ul>
                  {sectionEntries.map((entry) => (
                    <li
                      key={entry._id}
                      className="flex gap-6 py-4 border-b"
                      style={{ borderColor: 'var(--color-muted)' }}
                    >
                      <span
                        className="font-serif text-lg w-16 flex-shrink-0"
                        style={{ color: 'var(--color-warm-accent)' }}
                      >
                        {entry.year}
                      </span>

                      <div className="flex-1">
                        <p
                          className="font-sans text-base font-medium"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          {entry.title}
                        </p>
                        {entry.venue && (
                          <p
                            className="font-sans text-sm mt-0.5"
                            style={{ color: 'var(--color-warm-gray)' }}
                          >
                            {entry.venue}
                          </p>
                        )}
                        {entry.description && (
                          <p
                            className="font-sans text-sm mt-1"
                            style={{ color: 'var(--color-warm-gray)' }}
                          >
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          ))
        )}
      </div>
    </main>
  )
}

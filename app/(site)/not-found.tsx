import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content">
      <div className="max-w-5xl mx-auto px-4 py-32 md:py-48">
        <h1
          className="font-serif text-8xl md:text-9xl mb-6"
          style={{ color: 'var(--color-ink)' }}
        >
          404
        </h1>

        <p
          className="font-sans text-xl mb-3"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          Page not found.
        </p>

        <p
          className="font-sans text-base mb-10"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          The work you&rsquo;re looking for doesn&rsquo;t seem to exist.
        </p>

        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-widest"
          style={{ color: 'var(--color-warm-accent)', textDecoration: 'none' }}
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

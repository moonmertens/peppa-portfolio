import type { SocialLink } from '@/lib/types'

interface FooterProps {
  socialLinks?: SocialLink[]
  artistName: string
}

export function Footer({ socialLinks, artistName }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t mt-16 py-10"
      style={{ borderColor: 'var(--color-muted)' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Social links */}
        {socialLinks && socialLinks.length > 0 && (
          <ul className="flex items-center gap-6">
            {socialLinks.map(({ _key, platform, url }) => (
              <li key={_key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform}
                  className="font-sans text-sm uppercase tracking-widest hover:text-[var(--color-warm-accent)] transition-colors duration-200"
                  style={{ color: 'var(--color-warm-gray)' }}
                >
                  {platform}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Copyright */}
        <p
          className="font-sans text-sm"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          &copy; {year} {artistName}
        </p>
      </div>
    </footer>
  )
}

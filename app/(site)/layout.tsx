import type { Metadata } from "next"
import { Playfair_Display, DM_Sans } from "next/font/google"
import "../globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { JsonLd } from "@/components/seo/JsonLd"
import { CartProvider } from "@/lib/cart/CartContext"
import { sanityFetch } from "@/sanity/sanity.client"
import { siteSettingsQuery } from "@/lib/queries"
import type { SiteSettings } from "@/lib/types"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
})

const DEFAULT_SETTINGS: SiteSettings = {
  artistName: "Portfolio",
}

export async function generateMetadata(): Promise<Metadata> {
  let settings: SiteSettings = DEFAULT_SETTINGS
  try {
    const fetched = await sanityFetch<SiteSettings | null>(siteSettingsQuery)
    if (fetched) settings = fetched
  } catch (error) {
    console.error('Failed to fetch site settings for metadata:', error)
  }
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: settings.artistName,
      template: `%s — ${settings.artistName}`,
    },
    description: settings.tagline ?? "",
    openGraph: {
      type: 'website',
      siteName: settings.artistName,
      title: settings.artistName,
      description: settings.tagline ?? "",
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let settings: SiteSettings = DEFAULT_SETTINGS
  try {
    const fetched = await sanityFetch<SiteSettings | null>(siteSettingsQuery)
    if (fetched) settings = fetched
  } catch (error) {
    console.error('Failed to fetch site settings for layout:', error)
  }

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.artistName,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    sameAs: (settings.socialLinks ?? []).map((link) => link.url),
  }

  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body>
        <CartProvider>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <JsonLd id="json-ld-person" data={personSchema} />
          <Header artistName={settings.artistName} shopUrl={settings.externalShopUrl} />
          {children}
          <Footer socialLinks={settings.socialLinks} artistName={settings.artistName} />
        </CartProvider>
      </body>
    </html>
  )
}

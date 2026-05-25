import type { PortableTextBlock } from '@portabletext/types'

export type { PortableTextBlock }

export interface SanityImageAsset {
  _type: 'image'
  asset: {
    _ref?: string
    _id?: string
    _type: 'reference' | 'sanity.imageAsset'
    metadata?: {
      dimensions?: {
        width: number
        height: number
        aspectRatio: number
      }
    }
  }
  hotspot?: { x: number; y: number; width: number; height: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

export interface SocialLink {
  _key: string
  platform: string
  url: string
}

export interface SiteSettings {
  artistName: string
  tagline?: string
  socialLinks?: SocialLink[]
  externalShopUrl?: string
  contactFormHeading?: string
}

export interface Project {
  _id: string
  title: string
  slug: { current: string }
  coverImage: SanityImageAsset
  category?: string
  date?: string
  sortOrder?: number
}

export interface Piece {
  _key: string
  title: string
  image: SanityImageAsset
  year?: number
  medium?: string
  dimensions?: string
  description?: string
  price?: string
  availability?: 'available' | 'sold' | 'not for sale'
  sortOrder?: number
}

export interface ProjectDetail extends Project {
  description?: PortableTextBlock[]
  pieces?: Piece[]
}

export interface AboutPage {
  heading?: string
  bio?: PortableTextBlock[]
  artistPhoto?: SanityImageAsset
}

export type CvEntryType = 'exhibition' | 'education' | 'award' | 'press'

export interface CvEntry {
  _id: string
  type: CvEntryType
  title: string
  venue?: string
  year: number
  description?: string
}

export interface ShopPiece {
  _key: string
  projectId: string
  title: string
  image: SanityImageAsset
  medium?: string
  price: string
  availability: 'available'
  imageUrl: string // pre-built server-side
}

export interface SubscriptionTier {
  _id: string
  name: string
  description?: string
  displayPrice?: string
  stripePriceId: string
  sortOrder?: number
}

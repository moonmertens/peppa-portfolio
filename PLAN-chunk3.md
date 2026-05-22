# Plan: Chunk 3 — Homepage & Gallery Layout

## Summary

Build the public-facing shell of the portfolio: a warm editorial header and footer driven by Sanity Site Settings, a homepage that fetches and renders projects from Sanity (featured hero + uniform grid), a reusable project card component, the typography/color system, and CSS-only scroll animations — all responsive from mobile up.

---

## Specifications

### Functional Requirements

- Header renders the artist name (from Site Settings) as the logo on the left and five nav links on the right: Work, About, CV, Contact, Shop (Shop uses `externalShopUrl` from Site Settings and opens in a new tab).
- Mobile header collapses nav links behind a hamburger toggle (React `useState`, no external library).
- Footer renders social media icons (from Site Settings `socialLinks` array) and a dynamic copyright year.
- Root layout wraps every page with header + footer, loads Google Fonts via `next/font/google`, and applies global warm editorial CSS.
- Homepage fetches all projects ordered by `sortOrder` ascending from Sanity via a GROQ query.
- The first project in the ordered list is rendered as a full-width cinematic hero.
- Remaining projects are rendered in a uniform responsive grid of project cards.
- Each project card shows the cover image, project title, and category; hovering scales the image slightly and fades in a title overlay.
- If Sanity returns no projects (placeholder project ID during development), the homepage shows a graceful empty state.
- If the Site Settings fetch fails or returns null, header/footer fall back to safe default strings.
- All images use `next/image`; Sanity image URLs are built with `@sanity/image-url`.

### Non-Functional Requirements

- Mobile-first responsive design: single column on mobile, 2-column tablet (≥768 px), 3-column desktop (≥1024 px) for the project grid.
- No JavaScript animation libraries; all scroll reveal uses the Intersection Observer API wrapped in a lightweight custom hook (`useInView`), with CSS transitions doing the actual motion.
- Tailwind v4 utility classes are used for layout and spacing; custom CSS variables supply the editorial color palette.
- Google Fonts are loaded with `next/font/google` (no `<link>` tags), injected as CSS custom properties (`--font-serif`, `--font-sans`) so Tailwind's `font-serif` / `font-sans` classes resolve correctly.
- `@sanity/image-url` is added as a runtime dependency.
- All new components are TypeScript with explicit prop types.
- No `any` types; Sanity response shapes are typed via local interfaces in `lib/types.ts`.

### Acceptance Criteria

- The browser renders a header with artist name and nav links; on mobile, nav collapses and a hamburger appears.
- Clicking the hamburger toggles the mobile menu open/closed.
- Footer displays social icons (or nothing if the array is empty) and the current year.
- The homepage hero occupies the full viewport width and roughly 70–80 vh height.
- Below the hero, the project grid lays out correctly at mobile (1 col), tablet (2 col), and desktop (3 col).
- Project cards show a hover effect (image scale + overlay fade).
- With an empty Sanity dataset, the homepage renders without crashing (empty state copy shown).
- Playfair Display is applied to headings and the artist name logo; DM Sans is applied to body/nav text.
- Scroll-reveal fade-in animates project cards and the footer as they enter the viewport.
- `next build` completes without TypeScript errors.

---

## Architecture

### Component Overview

| Component | Location | Responsibility |
|---|---|---|
| `Header` | `components/layout/Header.tsx` | Artist name logo, desktop nav, mobile hamburger, mobile drawer |
| `Footer` | `components/layout/Footer.tsx` | Social icon links, copyright |
| `ProjectCard` | `components/projects/ProjectCard.tsx` | Cover image, title overlay, hover animation |
| `HeroProject` | `components/projects/HeroProject.tsx` | Full-width cinematic hero for the featured project |
| `useInView` | `lib/hooks/useInView.ts` | Thin Intersection Observer hook returning a boolean + ref |
| `FadeIn` | `components/ui/FadeIn.tsx` | Wrapper div that applies fade-in CSS class when in view |
| `urlFor` | `lib/sanity/image.ts` | Builds Sanity image URLs using `@sanity/image-url` |
| Types | `lib/types.ts` | Shared TypeScript interfaces for Sanity document shapes |
| Root layout | `app/layout.tsx` | Loads fonts, wraps children with Header + Footer |
| Homepage | `app/page.tsx` | Server component: fetches data, renders hero + grid |

### Data Flow

```
Sanity CDN
   │
   ├─ GROQ: siteSettings query ──► layout.tsx (server) ──► Header props / Footer props
   │
   └─ GROQ: projects query ──────► app/page.tsx (server) ──► HeroProject + ProjectCard[]
```

Both fetches happen server-side in React Server Components. `sanityFetch` from `sanity/sanity.client.ts` is used directly. No client-side data fetching is needed for this chunk.

The `urlFor` helper is instantiated with the Sanity client and called inside components (or in the page that passes pre-built URL strings as props). Because `@sanity/image-url` runs on the server, this is safe.

### Interfaces & Contracts

Defined in `lib/types.ts`:

```ts
export interface SanityImageAsset {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
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
```

GROQ queries (defined as constants in `lib/queries.ts`):

```groq
// siteSettingsQuery
*[_type == "siteSettings"][0]{
  artistName,
  tagline,
  socialLinks,
  externalShopUrl
}

// projectsQuery
*[_type == "project"] | order(sortOrder asc) {
  _id,
  title,
  slug,
  coverImage,
  category,
  date,
  sortOrder
}
```

`HeroProject` props:
```ts
interface HeroProjectProps {
  project: Project
  imageUrl: string   // pre-built URL string from urlFor
}
```

`ProjectCard` props:
```ts
interface ProjectCardProps {
  project: Project
  imageUrl: string
}
```

`Header` props:
```ts
interface HeaderProps {
  artistName: string
  shopUrl?: string
}
```

`Footer` props:
```ts
interface FooterProps {
  socialLinks?: SocialLink[]
}
```

`FadeIn` props:
```ts
interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number   // stagger delay in ms, applied via inline style
}
```

### Directory / File Structure

```
peppaportfolio/
├── app/
│   ├── globals.css               ← extend warm editorial CSS variables + animation keyframes
│   ├── layout.tsx                ← load fonts, render Header + Footer, apply font CSS vars
│   └── page.tsx                  ← server component: fetch + render homepage
├── components/
│   ├── layout/
│   │   ├── Header.tsx            ← new
│   │   └── Footer.tsx            ← new
│   ├── projects/
│   │   ├── HeroProject.tsx       ← new
│   │   └── ProjectCard.tsx       ← new
│   └── ui/
│       └── FadeIn.tsx            ← new
├── lib/
│   ├── types.ts                  ← new: shared TS interfaces
│   ├── queries.ts                ← new: GROQ query constants
│   ├── sanity/
│   │   └── image.ts              ← new: urlFor helper
│   └── hooks/
│       └── useInView.ts          ← new: Intersection Observer hook
├── sanity/
│   └── sanity.client.ts          ← unchanged (already exports sanityFetch)
├── tailwind.config.ts            ← add warm accent color token
└── package.json                  ← add @sanity/image-url
```

---

## Implementation Steps

### Step 1 — Add `@sanity/image-url` dependency
File: `package.json`

Add `"@sanity/image-url": "^1"` to `dependencies`. Run `npm install` after editing.

### Step 2 — Define shared TypeScript types
File: `lib/types.ts` (new)

Create the interfaces listed in the Interfaces section above: `SanityImageAsset`, `SocialLink`, `SiteSettings`, `Project`.

### Step 3 — Create GROQ query constants
File: `lib/queries.ts` (new)

Export two constants:
- `siteSettingsQuery` — fetches `siteSettings` singleton with all fields needed by header/footer.
- `projectsQuery` — fetches all projects ordered by `sortOrder asc`, projecting only the fields needed for the homepage (no `pieces` array, no `description` blocks).

### Step 4 — Create the Sanity image URL helper
File: `lib/sanity/image.ts` (new)

Import `imageUrlBuilder` from `@sanity/image-url` and the `client` from `sanity/sanity.client.ts`. Export a `urlFor(source)` function that returns an `ImageUrlBuilder` instance. Callers chain `.width(w).height(h).fit('crop').auto('format').url()` to get a string.

### Step 5 — Extend global CSS with editorial tokens and animations
File: `app/globals.css`

Add to `:root`:
- `--color-warm-accent: #c9a96e` (warm gold accent for hover states)
- `--color-muted: #d4ccc4` (subtle divider / muted text)
- `--font-serif` and `--font-sans` are already referenced from Tailwind config; they will be set by the layout (see Step 7)

Add the `@keyframes fadeInUp` animation:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Add the utility class used by `FadeIn`:
```css
.fade-in-hidden {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 6 — Update Tailwind config with warm accent color
File: `tailwind.config.ts`

Add `"warm-accent": "#c9a96e"` and `"muted": "#d4ccc4"` to the existing `colors` extension block.

### Step 7 — Set up Google Fonts and update root layout
File: `app/layout.tsx`

Import `Playfair_Display` and `DM_Sans` from `next/font/google`.

Configure `Playfair_Display` with subsets `['latin']`, weights `['400','500','700']`, variable `'--font-serif'`, `display: 'swap'`.

Configure `DM_Sans` with subsets `['latin']`, weights `['300','400','500']`, variable `'--font-sans'`, `display: 'swap'`.

In the layout:
- Fetch `SiteSettings` from Sanity using `sanityFetch` and `siteSettingsQuery`. Wrap the fetch in a try/catch so a missing project ID does not crash the server render; fall back to `{ artistName: 'Portfolio' }`.
- Apply both font variables to the `<html>` element's `className` (e.g. `${playfairDisplay.variable} ${dmSans.variable}`).
- Render `<Header artistName={settings.artistName} shopUrl={settings.externalShopUrl} />` above `{children}` and `<Footer socialLinks={settings.socialLinks} />` below.
- Update the static `metadata` export: set `title` to the artist name and `description` to the tagline.

### Step 8 — Build the Header component
File: `components/layout/Header.tsx`

Mark as `'use client'` because it manages mobile menu state.

Internal state: `const [mobileOpen, setMobileOpen] = useState(false)`.

Desktop layout (hidden on mobile, flex on `md:`):
- Left: artist name in `font-serif text-xl` linking to `/`.
- Right: nav links as an `<nav>` with `<ul>` — Work (`/`), About (`/about`), CV (`/cv`), Contact (`/contact`), Shop (external `href={shopUrl}`, `target="_blank" rel="noopener noreferrer"`, rendered only when `shopUrl` is set).
- All nav links: `font-sans text-sm tracking-wide uppercase` with `hover:text-warm-accent transition-colors duration-200`.

Mobile layout (flex on mobile, hidden on `md:`):
- Left: artist name (same as desktop).
- Right: hamburger button (`<button>` with `aria-label`, `aria-expanded`, `aria-controls`) — renders three horizontal bars as `<span>` elements; when open, renders an X.
- Below the header bar: a full-width drawer div that is conditionally rendered when `mobileOpen` is true. Contains the same nav links stacked vertically with generous padding.

Header element itself: `position: sticky`, `top-0`, `z-50`, `bg-cream/95 backdrop-blur-sm`, `border-b border-muted`.

Close mobile menu on route change: call `setMobileOpen(false)` inside a `useEffect` that watches `usePathname()` from `next/navigation`.

### Step 9 — Build the Footer component
File: `components/layout/Footer.tsx`

Server component (no `'use client'` needed).

Renders a `<footer>` with:
- Social icon links: iterate over `socialLinks`. Each link is an `<a>` with `target="_blank"` and `rel="noopener noreferrer"`. Display platform name as text (styled `font-sans text-sm uppercase tracking-widest`) until SVG icons are added in the polish chunk. Include `aria-label={platform}`.
- Copyright: `© {new Date().getFullYear()}` followed by the artist name (passed as a prop or derived from context — since footer already receives `socialLinks`, pass `artistName` as a separate prop, or simplify by having the layout pass both as a single `settings` prop).
- Layout: flex row, centered, with top border `border-t border-muted`, generous vertical padding.

Update `Footer` props interface to accept `artistName: string` in addition to `socialLinks`.

Update `app/layout.tsx` call: `<Footer socialLinks={settings.socialLinks} artistName={settings.artistName} />`.

### Step 10 — Build the `useInView` hook
File: `lib/hooks/useInView.ts`

```ts
'use client'
import { useEffect, useRef, useState } from 'react'

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()  // fire only once
      }
    }, { threshold: 0.15, ...options })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
```

### Step 11 — Build the `FadeIn` wrapper component
File: `components/ui/FadeIn.tsx`

Mark `'use client'`.

Uses `useInView` to toggle between `fade-in-hidden` and `fade-in-visible` CSS classes (defined in Step 5). Accepts an optional `delay` prop applied as `style={{ transitionDelay: `${delay}ms` }}`.

```tsx
export function FadeIn({ children, className = '', delay = 0 }: FadeInProps) {
  const { ref, isVisible } = useInView()
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${isVisible ? 'fade-in-visible' : 'fade-in-hidden'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
```

### Step 12 — Build the `HeroProject` component
File: `components/projects/HeroProject.tsx`

Server component (receives pre-built `imageUrl` string as prop, no hooks needed).

Renders a `<section>` that is full viewport width and approximately `70vh` tall (`min-h-[70vh]`), position `relative`, `overflow-hidden`.

Uses `next/image` with `fill` layout, `objectFit="cover"`, `priority` (above the fold), and the `imageUrl` as `src`. Set `sizes="100vw"`.

Overlay: an absolutely positioned `<div>` at the bottom of the section with a gradient (`bg-gradient-to-t from-ink/60 to-transparent`) containing the project title in `font-serif text-4xl md:text-6xl text-cream` and category in `font-sans text-sm uppercase tracking-widest text-cream/80`.

The entire section is a `<Link>` wrapping to `/projects/${project.slug.current}`.

Empty / null guard: if `project` prop is undefined/null, render nothing (`return null`).

### Step 13 — Build the `ProjectCard` component
File: `components/projects/ProjectCard.tsx`

Server component (pre-built `imageUrl` string passed as prop).

Renders an `<article>` that is a `<Link>` to `/projects/${project.slug.current}`.

Inner structure:
- Image wrapper: `relative aspect-[3/4] overflow-hidden` — maintains portrait aspect ratio.
- `next/image` with `fill`, `objectFit="cover"`, `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"`, `className="transition-transform duration-500 group-hover:scale-105"`. Apply `group` class to the article.
- Hover overlay: absolute inset div, `bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300`, contains the project title centered in `font-serif text-cream`.
- Below the image: `<p>` with the project title in `font-sans text-sm mt-2 text-ink` and category in `font-sans text-xs text-warm-gray`.

### Step 14 — Build the Homepage
File: `app/page.tsx`

Server component.

Fetch projects:
```ts
const projects = await sanityFetch<Project[]>(projectsQuery).catch(() => [])
```
Use `.catch(() => [])` so a Sanity connection failure (placeholder project ID) returns an empty array instead of throwing.

Separate hero from grid:
```ts
const [featuredProject, ...remainingProjects] = projects
```

Build image URLs with `urlFor`:
```ts
// For hero: wide crop
const heroImageUrl = featuredProject
  ? urlFor(featuredProject.coverImage).width(1600).height(900).fit('crop').auto('format').url()
  : ''

// For cards: portrait crop
const cardImageUrls = remainingProjects.map(p =>
  urlFor(p.coverImage).width(600).height(800).fit('crop').auto('format').url()
)
```

Render:
```tsx
<main>
  {featuredProject ? (
    <HeroProject project={featuredProject} imageUrl={heroImageUrl} />
  ) : (
    <EmptyHero />   // see below
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
      <p className="font-sans text-warm-gray text-center py-24">No projects yet.</p>
    )}
  </section>
</main>
```

`EmptyHero` is an inline or extracted component that renders a full-height placeholder section with a centered message — used during development when Sanity has no data.

---

## Dependencies

| Package | Version | Notes |
|---|---|---|
| `@sanity/image-url` | `^1` | New runtime dependency; add to `package.json` and run `npm install` |
| `next/font/google` | built-in | Part of Next.js 16; no separate install |
| `@sanity/client` | already installed | Used by `urlFor` builder |
| `next/image` | built-in | Already configured with `cdn.sanity.io` in `next.config.ts` |
| `next/link` | built-in | Used in Header, HeroProject, ProjectCard |
| `next/navigation` `usePathname` | built-in | Used in Header to close mobile menu on nav |

No new dev dependencies required.

---

## Risks / Open Questions

1. **Sanity placeholder project ID** — `sanity/env.ts` throws if `NEXT_PUBLIC_SANITY_PROJECT_ID` is undefined. All Sanity fetches in server components must be wrapped in `try/catch` (or the `.catch(() => fallback)` pattern). The layout fetch for Site Settings must not crash the root layout or every page breaks.

2. **`useInView` ref type** — The `useRef<HTMLElement>` generic is broad; `FadeIn` casts it to `RefObject<HTMLDivElement>`. This is safe but slightly imprecise. Alternative: make `useInView` generic: `useInView<T extends HTMLElement>()`.

3. **Google Fonts availability** — Playfair Display and DM Sans are both available on Google Fonts and supported by `next/font/google`. The variable font weight ranges must be confirmed to include the weights specified (400, 500, 700 for Playfair; 300, 400, 500 for DM Sans) — all are confirmed available.

4. **`FadeIn` around server-rendered `ProjectCard`** — `FadeIn` is a Client Component wrapping server-rendered children. This is valid in React 19 / Next.js App Router (Client Component can import and render Server Component children passed as `children` prop). However, `ProjectCard` itself must not be a Client Component for this to work cleanly — it should remain a server component.

5. **Mobile menu and `usePathname`** — `usePathname` requires `'use client'`. Since `Header` is already a client component, this is fine. On initial server render, pathname is not available; the hook will return the correct value after hydration.

6. **Tailwind v4 configuration** — The project uses Tailwind v4 (`@tailwindcss/postcss: ^4`) which uses the new CSS-first config approach with `@import "tailwindcss"`. The existing `tailwind.config.ts` with `theme.extend` may not be used by Tailwind v4 in the same way as v3. Verify whether `tailwind.config.ts` is being picked up or if theme tokens must be declared with `@theme` inside `globals.css`. If the config file is not used, move `fontFamily` and `colors` extensions into `globals.css` under `@theme { ... }`.

7. **Social link icons** — The current schema stores `platform` as a plain string with no icon field. For Chunk 3, render platform names as text links. SVG icon mapping can be added in Chunk 6 (polish pass).

8. **`components/` and `lib/` directories are currently empty** — Both directories exist (they appear in `tailwind.config.ts` content paths and tsconfig) but have no files. Chunk 3 creates all files from scratch; no existing code to preserve.

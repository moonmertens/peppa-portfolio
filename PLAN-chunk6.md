# Plan: Chunk 6 — Polish, Performance & QA

## Summary

Add the final production-readiness layer to the portfolio: structured SEO metadata with Open Graph and JSON-LD, a custom 404 page, a global loading skeleton, accessibility hardening (skip-to-content, focus rings, reduced-motion), and `robots.txt` / `sitemap.xml` via Next.js App Router conventions.

---

## Specifications

### Functional Requirements

**SEO & Metadata**
- `app/layout.tsx`: extend `generateMetadata` to include a full `openGraph` object (site name, type, image from Sanity `siteSettings.ogImage`), `twitter` card object, and `metadataBase` pointing to the production URL (`NEXT_PUBLIC_SITE_URL` env var with a localhost fallback).
- `app/page.tsx`: export `generateMetadata` to produce a homepage-specific description from `siteSettings.tagline`; include an `openGraph.images` array using the cover image of the featured project as the OG image.
- `app/about/page.tsx`: extend existing `generateMetadata` to add a description (static: "About the artist"), and an OG image using the artist photo URL.
- `app/cv/page.tsx`: extend existing `generateMetadata` to add a description (static: "Curriculum Vitae").
- `app/contact/page.tsx`: extend existing `generateMetadata` to add a description (static: "Get in touch").
- `app/projects/[slug]/page.tsx`: extend existing `generateMetadata` to add `openGraph.images` using the project cover image URL built with `urlFor`.

**robots.txt** (`app/robots.ts`):
- Disallow nothing (allow all crawlers).
- Sitemap URL points to `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.

**sitemap.xml** (`app/sitemap.ts`):
- Static routes: `/`, `/about`, `/cv`, `/contact`.
- Dynamic routes: one entry per project slug fetched from Sanity via `projectsQuery`.
- `lastModified` for all entries: `new Date()` at build time (suitable for a mostly-static CMS-driven site).
- Returns a `MetadataRoute.Sitemap` array (Next.js built-in type).

**JSON-LD Structured Data** (`components/seo/JsonLd.tsx`):
- A tiny server-friendly component that renders a `<script type="application/ld+json">` tag.
- Used in `app/layout.tsx` to inject a `Person` schema containing `name`, `url`, and `sameAs` (social links from `siteSettings`).
- Used in `app/projects/[slug]/page.tsx` to inject a `CreativeWork` schema containing `name`, `description` (from portable text), `author` (artist name).

**404 Page** (`app/not-found.tsx`):
- Custom 404 styled to match the warm editorial design: cream background, ink headings.
- Large serif "404" heading, a short editorial sentence below, and a link back to `/` styled as the site's text-link pattern.
- No Sanity fetch required — fully static.

**Global Loading State** (`app/loading.tsx`):
- Renders a minimal skeleton/spinner that matches the site chrome (cream bg).
- A centered single animated "pulse" bar in `--color-muted` with `animate-pulse`.
- No Sanity data needed.

**Accessibility**
- Skip-to-content link: rendered in `app/layout.tsx` as the very first element inside `<body>`, before `<Header>`. It is visually hidden by default and appears on `:focus` (standard "skip nav" pattern). It points to `#main-content`.
- Every `<main>` element across all pages gains `id="main-content"` to be the skip target.
- Focus ring: add a global CSS rule in `globals.css` that gives a visible `outline` on `:focus-visible` for all interactive elements, using `--color-warm-accent` as the outline color, so it complements the palette.
- Reduced-motion: add a `@media (prefers-reduced-motion: reduce)` block in `globals.css` that sets `transition-duration: 0.01ms` and `animation-duration: 0.01ms` on all elements, and sets `.fade-in-hidden` to `opacity: 1; transform: none` so FadeIn components never animate.
- Lightbox reduced-motion: the `Lightbox` inline `transition` style should be removed when the user prefers reduced motion. Implement by reading `window.matchMedia('(prefers-reduced-motion: reduce)').matches` inside the existing `useEffect` that sets up the open/close transition, and passing `transition: 'none'` instead.
- All `<main>` tags already exist in each page; verify `id="main-content"` is added uniformly.

**Image optimization audit (no new files)**
- `HeroProject.tsx`: already uses `fill` + `priority` + `sizes="100vw"` — no change needed.
- `ProjectCard.tsx`: already uses `fill` + `sizes` — no change needed.
- `app/about/page.tsx`: artist photo already uses `fill` + `sizes` + `priority` — no change needed.
- `Lightbox.tsx`: already uses explicit `width` / `height` from asset metadata — no change needed.
- `PieceImage.tsx`: verify it uses `sizes` prop; add if missing.
- Overall: `next.config.ts` already has the `cdn.sanity.io` remote pattern. No `quality` prop is explicitly set anywhere; Next.js defaults to 75 which is acceptable. No changes required to `next.config.ts`.

**Navigation audit (no new files)**
- `Header.tsx`: the Shop link already uses `target="_blank" rel="noopener noreferrer"` — confirmed, no change needed.
- All `Link` components use Next.js `<Link>` for internal navigation — confirmed, no change needed.

**Favicon**
- The project already has `app/favicon.ico` (present from `create-next-app` scaffold). No action needed unless the artist provides a custom icon (out of scope for this chunk).

### Non-Functional Requirements

- `NEXT_PUBLIC_SITE_URL` env var must be added to `.env.local` (e.g., `http://localhost:3000`) and to Vercel project settings (production value: `https://yourdomain.com`).
- The JSON-LD component must not import any client-only APIs; it is a pure server component.
- The skip-to-content link must satisfy WCAG 2.4.1 (Bypass Blocks) — it must be the first focusable element on the page.
- The `@media (prefers-reduced-motion)` CSS rule must cover both CSS transitions and the `fade-in-hidden / fade-in-visible` classes.
- No new npm packages are required. All APIs used (`MetadataRoute`, `generateMetadata`, `robots.ts`, `sitemap.ts`) are built into Next.js 15+. The project is on Next.js 16.2.6 which includes all of these.
- TypeScript must compile without new errors.

### Acceptance Criteria

- Visiting `/` in a browser shows a `<meta property="og:title">` tag in the page source.
- `GET /robots.txt` returns a valid robots file with a Sitemap line.
- `GET /sitemap.xml` returns XML with at least the static routes and any seeded project slugs.
- Navigating to a nonexistent path (e.g., `/does-not-exist`) renders the custom 404 page with a back-to-home link.
- `app/loading.tsx` displays during a simulated slow navigation (can be verified by adding an artificial delay in a page and using the Next.js dev router).
- Pressing Tab on any page brings the skip-to-content link into view on the first keypress.
- With `prefers-reduced-motion: reduce` set in OS, no fade-up animation plays on page load or scroll.
- The Lightbox opens and closes without any opacity/scale transition when reduced-motion is active.
- TypeScript build (`next build`) completes with zero type errors.

---

## Architecture

### Component Overview

| File | Type | Responsibility |
|---|---|---|
| `app/robots.ts` | Route handler (server) | Return `MetadataRoute.Robots` — allow all, point to sitemap |
| `app/sitemap.ts` | Route handler (server) | Return `MetadataRoute.Sitemap` — static + dynamic project routes |
| `app/not-found.tsx` | Server component | Custom 404 page in editorial style |
| `app/loading.tsx` | Server component | Global loading skeleton |
| `components/seo/JsonLd.tsx` | Server component | Render JSON-LD `<script>` tag |
| `app/layout.tsx` | Server component | Add skip link, JSON-LD, extended `generateMetadata`, `metadataBase` |
| `app/globals.css` | CSS | Add focus-visible ring, reduced-motion block, skip-link styles |
| `app/page.tsx` | Server component | Add `generateMetadata` with OG image from featured project |
| `app/about/page.tsx` | Server component | Extend `generateMetadata` with description + OG image; add `id` to `<main>` |
| `app/cv/page.tsx` | Server component | Extend `generateMetadata` with description; add `id` to `<main>` |
| `app/contact/page.tsx` | Server component | Extend `generateMetadata` with description; add `id` to `<main>` |
| `app/projects/[slug]/page.tsx` | Server component | Extend `generateMetadata` with OG image; add `id` to `<main>` |
| `components/ui/Lightbox.tsx` | Client component | Respect `prefers-reduced-motion` in transition styles |
| `components/projects/PieceImage.tsx` | Server or client component | Verify / add `sizes` prop to `<Image>` |

### Data Flow

**robots.ts**
```
No data fetching.
Returns static MetadataRoute.Robots object.
NEXT_PUBLIC_SITE_URL read from process.env at build time.
```

**sitemap.ts**
```
sanityFetch<Project[]>(projectsQuery)     [server, build time]
  --> map to { url, lastModified }
  --> merge with static route entries
  --> return MetadataRoute.Sitemap
```

**JSON-LD in layout**
```
sanityFetch<SiteSettings>(siteSettingsQuery)     [already fetched in layout]
  --> pass artistName, socialLinks to <JsonLd> component
  --> <JsonLd> renders <script type="application/ld+json"> synchronously
```

**JSON-LD in project detail**
```
project + settings already fetched in generateMetadata / page body
  --> pass title, description string, artistName to <JsonLd>
  --> inline script tag in server-rendered HTML
```

**Skip-to-content**
```
app/layout.tsx <body>:
  <a href="#main-content" className="skip-link">Skip to content</a>
  <Header />
  <main id="main-content">  <-- NOT here, this lives inside each page's <main>
  {children}

Each page's <main> element:
  <main id="main-content">
```

**Reduced-motion (CSS)**
```
globals.css @media (prefers-reduced-motion: reduce):
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  .fade-in-hidden { opacity: 1 !important; transform: none !important; }
```

**Reduced-motion (Lightbox JS)**
```
Lightbox.tsx:
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  In the dialog div style:
    transition: prefersReduced ? 'none' : 'opacity 200ms ease, transform 200ms ease'
    transform: prefersReduced ? undefined : (visible ? 'scale(1)' : 'scale(0.97)')
```

Note: `prefersReduced` must be computed inside the client component's render, not at module top level, because `window` is undefined during SSR. Since `Lightbox` is already a `'use client'` component and only renders after `mounted === true`, accessing `window` inside the render body is safe when guarded by the `mounted` check.

### Interfaces & Contracts

**`app/robots.ts` return type**
```typescript
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/sitemap.xml`,
  }
}
```

**`app/sitemap.ts` return type**
```typescript
import type { MetadataRoute } from 'next'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { ... }
```

**`components/seo/JsonLd.tsx` props**
```typescript
interface JsonLdProps {
  data: Record<string, unknown>   // plain JSON-LD object, caller builds the schema
}
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

**`app/layout.tsx` — extended `generateMetadata` return shape**
```typescript
{
  title: { default: settings.artistName, template: `%s — ${settings.artistName}` },
  description: settings.tagline ?? '',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: settings.artistName,
    title: settings.artistName,
    description: settings.tagline ?? '',
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

Using `title.template` means child pages only need to return `{ title: 'About' }` and the full `"About — Artist Name"` title is assembled automatically by Next.js. The existing `"About — {artistName}"` pattern in page-level `generateMetadata` should be simplified to just `{ title: 'About' }` once the template is in place.

**Skip-link CSS class in `globals.css`**
```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 1rem;
  z-index: 9999;
  background-color: var(--color-ink);
  color: var(--color-cream);
  font-family: var(--font-family-sans);
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
}
.skip-link:focus {
  left: 1rem;
}
```

**Focus-visible ring in `globals.css`**
```css
:focus-visible {
  outline: 2px solid var(--color-warm-accent);
  outline-offset: 2px;
}
```

**Reduced-motion block in `globals.css`**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .fade-in-hidden {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

### Directory / File Structure

```
peppaportfolio/
├── app/
│   ├── robots.ts                        [NEW] robots.txt via Next.js convention
│   ├── sitemap.ts                       [NEW] sitemap.xml via Next.js convention
│   ├── not-found.tsx                    [NEW] custom 404 page
│   ├── loading.tsx                      [NEW] global loading skeleton
│   ├── layout.tsx                       [MODIFY] metadataBase, title template, skip link, JSON-LD
│   ├── globals.css                      [MODIFY] skip-link, focus-visible, reduced-motion
│   ├── page.tsx                         [MODIFY] add generateMetadata with OG image
│   ├── about/
│   │   └── page.tsx                     [MODIFY] extend metadata; id on <main>
│   ├── cv/
│   │   └── page.tsx                     [MODIFY] extend metadata; id on <main>
│   ├── contact/
│   │   └── page.tsx                     [MODIFY] extend metadata; id on <main>
│   └── projects/
│       └── [slug]/
│           └── page.tsx                 [MODIFY] extend metadata with OG image; id on <main>
├── components/
│   ├── seo/
│   │   └── JsonLd.tsx                   [NEW] JSON-LD script renderer
│   ├── projects/
│   │   └── PieceImage.tsx               [MODIFY] verify sizes prop on <Image>
│   └── ui/
│       └── Lightbox.tsx                 [MODIFY] prefers-reduced-motion in transition styles
└── .env.local                           [MODIFY] add NEXT_PUBLIC_SITE_URL placeholder
```

---

## Implementation Steps

1. **Add `NEXT_PUBLIC_SITE_URL` to `.env.local`** — Append `NEXT_PUBLIC_SITE_URL=http://localhost:3000` with a comment noting it must be set to the production domain in Vercel.

2. **Create `app/robots.ts`** — Export a default function returning `MetadataRoute.Robots` with `rules: { userAgent: '*', allow: '/' }` and `sitemap` set to `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.

3. **Create `app/sitemap.ts`** — Export an async default function; fetch `Project[]` from Sanity using the existing `projectsQuery` and `sanityFetch` (wrap in try/catch, fallback to empty array); build static entries for `/`, `/about`, `/cv`, `/contact`; append one entry per project at `/projects/${slug.current}`; return the full `MetadataRoute.Sitemap` array.

4. **Create `components/seo/JsonLd.tsx`** — A React server component (no `'use client'`) that accepts `{ data: Record<string, unknown> }` and renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`. No logic, just the renderer.

5. **Modify `app/globals.css`** — Append three new blocks in this order:
   a. `.skip-link` and `.skip-link:focus` — the visually-hidden-until-focused link styles.
   b. `:focus-visible` — 2px warm-accent outline with 2px offset.
   c. `@media (prefers-reduced-motion: reduce)` — zero out durations and override `.fade-in-hidden`.

6. **Modify `app/layout.tsx`**:
   a. Change `generateMetadata` to return `metadataBase`, a `title` object with `default` and `template`, and `openGraph` / `twitter` objects as specified in the Interfaces section above.
   b. Inside `RootLayout`, add `<a href="#main-content" className="skip-link">Skip to content</a>` as the first child of `<body>`, before `<Header>`.
   c. Build the `Person` JSON-LD data object from `settings.artistName`, `settings.socialLinks`, and `NEXT_PUBLIC_SITE_URL`; render `<JsonLd data={personSchema} />` inside `<body>` (after the skip link, before or after `<Header>` — order in the DOM does not matter for JSON-LD).

7. **Modify `app/page.tsx`** — Export `generateMetadata`: fetch `SiteSettings` and `Project[]`; use the featured project's cover image (first project's `coverImage`) to build an OG image URL via `urlFor(...).width(1200).height(630).fit('crop').auto('format').url()`; return `{ title: 'Work', description: settings.tagline, openGraph: { images: [{ url: ogImageUrl }] } }`.

8. **Modify `app/about/page.tsx`**:
   a. Simplify `generateMetadata` to return `{ title: 'About', description: 'About the artist' }` — the layout's title template handles the suffix. Optionally add an OG image using the artist photo URL if available.
   b. Add `id="main-content"` to the `<main>` element.

9. **Modify `app/cv/page.tsx`**:
   a. Simplify `generateMetadata` to return `{ title: 'CV', description: 'Curriculum vitae' }`.
   b. Add `id="main-content"` to the `<main>` element.

10. **Modify `app/contact/page.tsx`**:
    a. Simplify `generateMetadata` to return `{ title: 'Contact', description: 'Get in touch' }`.
    b. Add `id="main-content"` to the `<main>` element.

11. **Modify `app/projects/[slug]/page.tsx`**:
    a. In `generateMetadata`, build an OG image URL from the project's `coverImage` using `urlFor(...).width(1200).height(630).fit('crop').auto('format').url()` and add it to `openGraph.images`.
    b. Add a `CreativeWork` JSON-LD object (title, description, author) and render `<JsonLd data={creativeWorkSchema} />` inside `<main>`.
    c. Add `id="main-content"` to the `<main>` element.

12. **Create `app/not-found.tsx`** — Static server component (no `'use client'`). Render `<main id="main-content">` containing:
    - A large serif "404" heading (`font-serif text-8xl md:text-9xl`).
    - A subtitle: "Page not found." in `font-sans` with `--color-warm-gray`.
    - A short sentence: "The work you're looking for doesn't seem to exist."
    - A `<Link href="/">` styled as a small uppercase tracking-widest link in `--color-warm-accent`.
    Wrap content in `max-w-5xl mx-auto px-4 py-32 md:py-48`.

13. **Create `app/loading.tsx`** — Static server component. Render a full-width div with `min-height: 60vh`, centered flex, containing a single div with class `animate-pulse` and background `--color-muted`, sized to look like a content placeholder (e.g., `w-48 h-2 rounded`). This uses Tailwind's built-in `animate-pulse` utility.

14. **Modify `components/ui/Lightbox.tsx`** — Inside the client component render body (after the `mounted` guard so `window` is available), compute `const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches`. In the dialog `<div>` inline style, conditionally set `transition` to `'none'` when `prefersReduced` is true, and suppress the scale transform (always render `transform: 'none'`).

15. **Inspect `components/projects/PieceImage.tsx`** — Verify the `<Image>` component has a `sizes` prop. If absent, add `sizes="(max-width: 1024px) 100vw, 800px"` to ensure responsive image selection.

---

## Dependencies

- `next` (v16.2.6, already installed) — provides `MetadataRoute`, `robots.ts` / `sitemap.ts` conventions, `not-found.tsx`, and `loading.tsx` conventions.
- No new npm packages required.
- `NEXT_PUBLIC_SITE_URL` — new environment variable; must be added to `.env.local` and Vercel project settings.

---

## Risks / Open Questions

- **`title.template` change**: switching from per-page manual `"About — {artistName}"` strings to a root `title.template` is clean but requires all page-level `generateMetadata` to return only the short segment (e.g., `{ title: 'About' }`). The pages written in chunks 3–5 currently build the full title string. All five must be updated in step 6a / 8a / 9a / 10a to avoid double suffixes like `"About — Artist — Artist"`.

- **`metadataBase` required for absolute OG images**: Next.js 13+ emits a warning if OG image URLs are relative but `metadataBase` is not set. The `urlFor()` function returns absolute CDN URLs (`https://cdn.sanity.io/...`), so they will work even without `metadataBase`, but setting `metadataBase` is still best practice and silences the warning.

- **`dangerouslySetInnerHTML` in `JsonLd`**: The JSON-LD data is assembled server-side from Sanity CMS content (artist name, social URLs). If the artist enters a string containing `</script>` this could create a malformed script tag. Mitigate by running the value through `JSON.stringify` (which escapes `<`, `>`, `&` by default in JSON context). This is the standard Next.js recommended pattern for JSON-LD.

- **`window` in Lightbox**: accessing `window.matchMedia` inside a `'use client'` component render is only safe because the existing `if (!mounted) return null` guard ensures the component never renders on the server. The `prefersReduced` read should be placed after that guard, not at the top of the function.

- **`animate-pulse` in `loading.tsx`**: this is a Tailwind utility; verify it is present in the generated CSS. The project uses Tailwind v4 (`@import "tailwindcss"`), which includes it by default — no configuration change needed.

- **Sitemap build-time fetch**: `app/sitemap.ts` runs at build time when `output: 'export'` or on first request in ISR. The site uses `cache: "force-cache"` in `sanityFetch`, so the sitemap content is baked at build time. This is acceptable for a portfolio whose project list changes infrequently; the artist can trigger a Vercel redeploy when adding new projects.

- **OG image dimensions**: 1200×630 is the recommended Facebook/Twitter OG size. Sanity's `urlFor` with `.width(1200).height(630).fit('crop')` will serve a correctly sized image from the CDN.

- **`PieceImage.tsx` not yet read in full**: step 15 requires reading the file first to confirm whether `sizes` is already present before making any edit.

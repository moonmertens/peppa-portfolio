# Plan: Chunk 4 — Project Detail & Lightbox

## Summary

Build the project detail page (`/projects/[slug]`) that displays a project's header metadata and a vertical scroll of large piece images, and a full-screen Lightbox component that overlays on image click with piece metadata, inquiry link, and keyboard-accessible arrow navigation.

---

## Specifications

### Functional Requirements

- **Project detail page** (`app/projects/[slug]/page.tsx`):
  - Fetch a single project by slug from Sanity via a new GROQ query `projectBySlugQuery`.
  - Return a Next.js 404 (`notFound()`) if no project matches the slug.
  - Render a project header: title, category badge, formatted date, and portable-text description.
  - Render each piece in a vertical scroll list using `PieceImage` components.
  - Each `PieceImage` is clickable and opens the Lightbox at the corresponding index.
  - All piece images use `next/image` with `loading="lazy"` (only the first piece uses `priority`).
  - Export `generateStaticParams` to pre-render all known slugs at build time.
  - Export `generateMetadata` that sets `title` to `"<project title> — <artistName>"` and `description` to a plain-text extract of the first portable-text block.

- **Lightbox** (`components/ui/Lightbox.tsx`):
  - Accepts `pieces`, `initialIndex`, `isOpen`, and `onClose` as props.
  - Renders a full-screen dark overlay with the current piece's image displayed large on the left and a metadata panel on the right (desktop) or stacked below (mobile).
  - Metadata panel shows: title, year, medium, dimensions, description, price, and an availability badge.
  - "Inquire" button appears only when `availability !== "sold"` and `availability !== "not for sale"`. It navigates to `/contact?subject=<encoded piece title>`.
  - Prev/next arrow buttons navigate between pieces. The prev button is hidden at index 0; the next button is hidden at the last index.
  - Keyboard events: `ArrowLeft` = prev, `ArrowRight` = next, `Escape` = close.
  - Body scroll is locked (`overflow: hidden` on `document.body`) while the lightbox is open and restored on close.
  - Accessible: renders with `role="dialog"`, `aria-modal="true"`, `aria-label="<piece title>"`. Focus is trapped within the dialog while open; focus returns to the triggering element on close.
  - Smooth open/close CSS transition (opacity + scale).
  - Renders via a React portal attached to `document.body`.

- **PieceImage** (`components/projects/PieceImage.tsx`):
  - Client component that renders a single piece in the vertical scroll.
  - Displays the piece image at near full-width (max ~1100 px) with a natural/intrinsic aspect ratio.
  - Shows the piece title (and optionally year/medium) in small caption text below the image.
  - Accepts an `onClick` callback and an `index` prop; calls `onClick(index)` when the image or a visible "expand" cue is clicked.
  - Wraps the image in a `<button>` for accessibility with `aria-label="View <title> in lightbox"`.

- **Type extensions** (`lib/types.ts`):
  - Add `Piece` interface with all fields from the Sanity schema: `_key`, `title`, `image`, `year`, `medium`, `dimensions`, `description`, `price`, `availability`, `sortOrder`.
  - Add `ProjectDetail` interface extending `Project` with `description` (portable text array) and `pieces: Piece[]`.

- **New GROQ query** (`lib/queries.ts`):
  - `projectBySlugQuery` fetches the full project document including all piece sub-objects.

### Non-Functional Requirements

- No additional third-party state-management libraries. React `useState`/`useCallback`/`useEffect`/`useRef` are sufficient.
- `@portabletext/react` added as a dependency for rendering the project description rich text.
- The Lightbox renders via `ReactDOM.createPortal` so it is never clipped by a parent's `overflow: hidden`.
- The focus trap must work without an external library (manual implementation with `querySelectorAll` over focusable selectors).
- Images must include descriptive `alt` text (piece title).
- Color values come exclusively from CSS custom properties defined in `globals.css` (no hardcoded hex in component JSX).
- All new components follow the existing pattern: named exports, TypeScript-typed props, `'use client'` directive only where state/effects are needed.

### Acceptance Criteria

- Navigating to `/projects/<valid-slug>` renders the project header and all pieces without error.
- Navigating to `/projects/<nonexistent-slug>` renders the Next.js 404 page.
- Clicking a piece image opens the Lightbox with the correct piece pre-selected.
- Pressing `ArrowRight` advances to the next piece; `ArrowLeft` goes back; `Escape` closes.
- The Lightbox prev button is absent (or disabled) on the first piece; the next button is absent on the last.
- Body scroll is locked while the Lightbox is open and restored after closing.
- The "Inquire" button links to `/contact?subject=<URL-encoded piece title>` and is absent for sold/not-for-sale pieces.
- `generateMetadata` produces a descriptive `<title>` tag visible in page source.
- `generateStaticParams` returns one entry per published project slug.
- The page is navigable by keyboard alone: Tab reaches each piece, Enter/Space opens the Lightbox, Tab cycles within the Lightbox, and Escape closes it.
- `next build` completes without TypeScript errors.

---

## Architecture

### Component Overview

| Component / Module | Type | Responsibility |
|---|---|---|
| `app/projects/[slug]/page.tsx` | Server Component (async) | Fetch project by slug, handle 404, compose page layout, pass pieces + open-lightbox handler down |
| `app/projects/[slug]/ProjectDetailClient.tsx` | Client Component | Own the `openIndex` state that drives the Lightbox; render the piece list and Lightbox together |
| `components/projects/PieceImage.tsx` | Client Component | Render one piece image with click-to-open behaviour |
| `components/ui/Lightbox.tsx` | Client Component | Full-screen overlay, image + metadata, navigation, keyboard handling, portal, focus trap |
| `lib/types.ts` | Types | Add `Piece` and `ProjectDetail` interfaces |
| `lib/queries.ts` | GROQ | Add `projectBySlugQuery` |

**Server/Client split rationale.** The detail page itself is a Server Component so it can fetch data and generate metadata without client overhead. Because the Lightbox requires `useState` and `useEffect`, all interactive state lives in a thin `ProjectDetailClient` wrapper that receives the fully-resolved data (pieces with pre-built image URLs) as props.

### Data Flow

```
Sanity CMS
  └─ projectBySlugQuery (GROQ, parameterised by slug)
       └─ sanityFetch<ProjectDetail>() in app/projects/[slug]/page.tsx
            └─ urlFor(piece.image) called for every piece → produces imageUrl strings
                 └─ ProjectDetailClient receives: project (metadata) + pieces (with imageUrls)
                      ├─ renders project header (title, category, date, PortableText description)
                      ├─ renders <PieceImage> list — each piece gets its index + onOpen callback
                      └─ renders <Lightbox> controlled by openIndex state (null = closed)
```

### Interfaces & Contracts

#### `lib/types.ts` additions

```ts
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
  description?: PortableTextBlock[]   // from sanity's block content
  pieces?: Piece[]
}
```

`PortableTextBlock` is the type exported from `@portabletext/types` (installed transitively with `@portabletext/react`); import it as `import type { PortableTextBlock } from '@portabletext/types'`.

#### `lib/queries.ts` addition

```ts
export const projectBySlugQuery = `
  *[_type == "project" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    coverImage,
    category,
    date,
    sortOrder,
    description,
    pieces[]{
      _key,
      title,
      image,
      year,
      medium,
      dimensions,
      description,
      price,
      availability,
      sortOrder
    }
  }
`
```

Called as: `sanityFetch<ProjectDetail | null>(projectBySlugQuery, { slug })`.

#### `ProjectDetailClient` props

```ts
interface ProjectDetailClientProps {
  project: ProjectDetail
  pieceImageUrls: string[]      // pre-built per-piece image URL, same index as pieces[]
  coverImageUrl: string         // unused in body but could be used for OG
}
```

#### `PieceImage` props

```ts
interface PieceImageProps {
  piece: Piece
  imageUrl: string
  index: number
  onOpen: (index: number) => void
  priority?: boolean            // true only for index 0
}
```

#### `Lightbox` props

```ts
interface LightboxProps {
  pieces: Piece[]
  imageUrls: string[]           // parallel array to pieces
  currentIndex: number          // -1 means closed
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}
```

The parent (`ProjectDetailClient`) owns the index state and passes the four callbacks so that the Lightbox itself is purely presentational regarding navigation (simpler to reason about).

### Directory / File Structure

```
peppaportfolio/
├── app/
│   └── projects/
│       └── [slug]/
│           ├── page.tsx                          MODIFIED (new file)
│           └── ProjectDetailClient.tsx           NEW
├── components/
│   ├── projects/
│   │   └── PieceImage.tsx                        NEW
│   └── ui/
│       └── Lightbox.tsx                          NEW
├── lib/
│   ├── queries.ts                                MODIFIED (add projectBySlugQuery)
│   └── types.ts                                  MODIFIED (add Piece, ProjectDetail)
└── package.json                                  MODIFIED (add @portabletext/react)
```

---

## Implementation Steps

1. **Install dependency** — `package.json`
   Run `npm install @portabletext/react` to add the portable text renderer. No config file changes needed.

2. **Extend types** — `lib/types.ts`
   - Import `PortableTextBlock` from `@portabletext/types`.
   - Add the `Piece` interface with all fields matching the Sanity `piece` object schema.
   - Add the `ProjectDetail` interface that extends `Project` with `description?: PortableTextBlock[]` and `pieces?: Piece[]`.

3. **Add GROQ query** — `lib/queries.ts`
   - Append `projectBySlugQuery` as shown in the Interfaces section above.
   - The query uses `$slug` as a GROQ parameter; the `pieces[]` projection lists every field explicitly.

4. **Build `PieceImage` component** — `components/projects/PieceImage.tsx`
   - Mark `'use client'`.
   - Accept `{ piece, imageUrl, index, onOpen, priority }` props.
   - Render a `<article>` wrapping a `<button>` (for accessibility) that contains a `next/image` with `width={1100}`, `height={0}` and `style={{ width: '100%', height: 'auto' }}` (let the image define its natural height). Use `sizes="(max-width: 768px) 100vw, 90vw"`.
   - Set `priority={priority ?? false}` on the `next/image`. The page will pass `priority` only for `index === 0`.
   - Below the button, render a caption `<div>`: piece title in `font-serif text-base`, then a line with `year` and `medium` if present in `font-sans text-sm` color `var(--color-warm-gray)`.
   - The `<button>` `onClick` calls `onOpen(index)`.
   - Button `aria-label` = `"View ${piece.title} in lightbox"`.
   - The button has `cursor-pointer` and a subtle hover opacity change (`transition-opacity duration-200 hover:opacity-90`).

5. **Build `Lightbox` component** — `components/ui/Lightbox.tsx`
   - Mark `'use client'`.
   - Render via `ReactDOM.createPortal(jsx, document.body)`.
   - Guard the portal with a `mounted` state (set to `true` in `useEffect`) to avoid SSR mismatch.
   - When `currentIndex === -1` return `null` (portal renders nothing).
   - **Overlay**: `position: fixed; inset: 0; z-index: 50; background: rgba(26, 23, 20, 0.95)` (ink color at 95% opacity). Clicking the overlay itself (not children) calls `onClose`.
   - **Layout**: inside the overlay, a centered `flex` container (`max-w-7xl mx-auto`) splits into two regions:
     - Left (image area): `flex-1`, displays the current piece image using `next/image` with `fill` inside a relative container sized to `max 80vh` tall. `object-fit: contain` so the full image is always visible.
     - Right (metadata panel): `w-80` on desktop, collapses to full-width below image on mobile. Shows: title (`font-serif text-2xl`), year + medium in one line (`font-sans text-sm warm-gray`), dimensions (`font-sans text-sm warm-gray`), description (`font-sans text-sm` multi-line), price (if present, `font-sans text-base`), availability badge (green dot "Available" / grey "Not for sale" / red strikethrough "Sold").
   - **Inquire button**: rendered only when `availability` is `'available'` or `undefined`. It is an `<a>` tag with `href={"/contact?subject=" + encodeURIComponent(piece.title)}`. Styled as the warm-accent outlined button matching the site palette.
   - **Navigation arrows**: `<button>` elements absolutely positioned on the left and right edges of the overlay. Left arrow (Unicode `←` or an SVG chevron) calls `onPrev`; hidden when `currentIndex === 0`. Right arrow calls `onNext`; hidden when `currentIndex === pieces.length - 1`. Both have `aria-label` ("Previous piece" / "Next piece").
   - **Close button**: top-right corner `×` button, calls `onClose`, `aria-label="Close lightbox"`.
   - **Keyboard handling** (`useEffect` on `isOpen`):
     ```
     const handler = (e: KeyboardEvent) => {
       if (e.key === 'ArrowLeft') onPrev()
       if (e.key === 'ArrowRight') onNext()
       if (e.key === 'Escape') onClose()
     }
     window.addEventListener('keydown', handler)
     return () => window.removeEventListener('keydown', handler)
     ```
   - **Body scroll lock** (`useEffect` on `isOpen`):
     ```
     document.body.style.overflow = isOpen ? 'hidden' : ''
     return () => { document.body.style.overflow = '' }
     ```
   - **Focus trap** (`useEffect` on `currentIndex`):
     - Keep a `dialogRef = useRef<HTMLDivElement>()` on the inner dialog container.
     - On open, `dialogRef.current?.focus()`.
     - Add a `keydown` listener on the dialog that intercepts `Tab`/`Shift+Tab`:
       ```
       const focusable = dialogRef.current.querySelectorAll(
         'button, [href], input, [tabindex]:not([tabindex="-1"])'
       )
       const first = focusable[0] as HTMLElement
       const last = focusable[focusable.length - 1] as HTMLElement
       if (e.key === 'Tab') {
         if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
         else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
       }
       ```
     - On close, return focus to the element that opened the lightbox. Store the triggering element in a `useRef<HTMLElement>` inside `ProjectDetailClient` and pass it down (or just store `document.activeElement` before opening in a ref inside Lightbox).
   - **Transition**: The inner dialog container has `transition: opacity 200ms ease, transform 200ms ease`. When closed, `opacity: 0; transform: scale(0.97)`. When open, `opacity: 1; transform: scale(1)`. Implement via a CSS class toggled on a `visible` boolean state that becomes `true` one frame after `currentIndex` becomes >= 0 (using `requestAnimationFrame`).

6. **Build `ProjectDetailClient` component** — `app/projects/[slug]/ProjectDetailClient.tsx`
   - Mark `'use client'`.
   - Accept `{ project, pieceImageUrls }` where `project` is `ProjectDetail`.
   - State: `openIndex: number` initialised to `-1`.
   - Callbacks (stable with `useCallback`):
     - `handleOpen = (i: number) => setOpenIndex(i)`
     - `handleClose = () => setOpenIndex(-1)`
     - `handlePrev = () => setOpenIndex(i => Math.max(0, i - 1))`
     - `handleNext = () => setOpenIndex(i => Math.min(pieces.length - 1, i + 1))`
   - Render:
     - The pieces list: a `<section>` with class `max-w-5xl mx-auto px-4 py-16 flex flex-col gap-20` (generous 80px / `gap-20` between pieces). Maps `project.pieces` to `<PieceImage>` components, passing `priority={index === 0}`.
     - The `<Lightbox>` component below the list, always mounted, controlled by `openIndex`.

7. **Build project detail page** — `app/projects/[slug]/page.tsx`
   - Async Server Component.
   - Import `notFound` from `next/navigation`.
   - Call `sanityFetch<ProjectDetail | null>(projectBySlugQuery, { slug: params.slug })`. Wrap in a try/catch that falls through to `notFound()`.
   - If result is `null`, call `notFound()`.
   - Pre-build all image URLs server-side:
     - `pieceImageUrls`: for each piece, `urlFor(piece.image).width(1400).auto('format').url()` (no height constraint so portrait/landscape images retain natural ratio).
   - Export `generateStaticParams`:
     ```ts
     export async function generateStaticParams() {
       const projects = await sanityFetch<{ slug: { current: string } }[]>(projectsQuery)
       return projects.map(p => ({ slug: p.slug.current }))
     }
     ```
   - Export `generateMetadata({ params })`:
     - Fetch the project (same query, same params).
     - Extract plain text from the first portable-text block for the description: iterate `description[0].children` and join `.text` values.
     - Also fetch `siteSettingsQuery` to get `artistName`.
     - Return `{ title: "<project.title> — <artistName>", description: <plaintext excerpt, max 160 chars> }`.
   - Page layout:
     - `<main>`:
       - **Project header** `<header>` section: `max-w-5xl mx-auto px-4 pt-16 pb-12`
         - Category badge: `<p className="font-sans text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-warm-accent)' }}>` — renders `project.category` if present.
         - Title: `<h1 className="font-serif text-5xl md:text-7xl mb-4">` with `var(--color-ink)`.
         - Date: `<p className="font-sans text-sm mb-8" style={{ color: 'var(--color-warm-gray)' }}>` — formats `project.date` (e.g. `new Date(project.date).getFullYear()` or just display the raw date string).
         - Description: `<div className="font-sans text-base leading-relaxed max-w-2xl" style={{ color: 'var(--color-ink)' }}>` wrapping `<PortableText value={project.description} />`. Use default `@portabletext/react` components (no custom overrides needed for this chunk).
       - **Divider**: `<hr>` with `border-color: var(--color-muted)` and `max-w-5xl mx-auto`.
       - **Pieces** rendered by `<ProjectDetailClient project={project} pieceImageUrls={pieceImageUrls} />`.

---

## Dependencies

| Package | Purpose | Action |
|---|---|---|
| `@portabletext/react` | Render Sanity block content (portable text) in React | `npm install @portabletext/react` |
| `@portabletext/types` | TypeScript types for portable text blocks | Installed transitively with the above |
| `react-dom` | `ReactDOM.createPortal` for Lightbox | Already present (Next.js dependency) |

All other dependencies (`next/image`, `next/navigation`, `next/font`, `@sanity/image-url`, Tailwind CSS, `@sanity/client`) are already installed.

---

## Risks / Open Questions

1. **Image aspect ratios**: Piece images may be portrait, landscape, or square. The `PieceImage` component uses `width: 100%; height: auto` with `next/image` in its non-`fill` mode, which requires knowing the intrinsic `width` and `height`. Sanity does not return image dimensions in the default `coverImage` projection unless the asset metadata is projected. The GROQ query should be extended or the `image` field should use `...asset->{ metadata { dimensions } }` to get intrinsic dimensions. Alternative: use `fill` mode with a fixed aspect-ratio container and `object-fit: contain` with a neutral background — this avoids needing to know dimensions but gives fixed-height boxes. **Recommendation**: project `metadata.dimensions` from the Sanity asset and use those intrinsic dimensions on `next/image`. Update the `projectBySlugQuery` `pieces[].image` projection to include `asset->{ _ref, metadata { dimensions { width, height } } }` and extend the `Piece.image` type accordingly.

2. **`generateStaticParams` at build time**: If Sanity is not yet configured (env vars missing), `sanityFetch` will throw. `generateStaticParams` should catch errors and return `[]` to allow the build to succeed with dynamic fallback. Add `export const dynamicParams = true` to the page so unrendered slugs still work at runtime.

3. **Focus return on close**: The Lightbox needs to return focus to the piece button that opened it. The cleanest pattern is: in `ProjectDetailClient`, use `useRef<HTMLButtonElement[]>` to collect refs to each `PieceImage`'s inner button, and on `handleClose` call `pieceRefs.current[openIndex]?.focus()`. This requires `PieceImage` to accept a `ref` forwarded via `forwardRef` to its inner `<button>`.

4. **Portable text description on `generateMetadata`**: Extracting plain text from portable text blocks at the type level requires importing `PortableTextBlock` types. A simple helper function that maps over blocks and joins children text is sufficient and avoids adding the `@portabletext/react` package to the server-only metadata path.

5. **`next/image` domain configuration**: `next.config.ts` must include the Sanity CDN hostname (`cdn.sanity.io`) in `images.remotePatterns`. This was likely done in Chunk 1/2; verify it is present before testing. If missing, images will return a 400 error from Next.js.

6. **Mobile lightbox layout**: On small screens a side-by-side image + metadata panel will not fit. The metadata panel should stack below the image on screens narrower than `md` (768 px). The layout should be `flex-col` on mobile and `flex-row` on desktop (`md:flex-row`).

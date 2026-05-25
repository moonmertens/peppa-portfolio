# Plan: Shop & E-Commerce Feature

## Summary

Add a full e-commerce layer to the existing artist portfolio site: a /shop page listing purchasable pieces, a /subscribe page for CMS-configured subscription tiers, a slide-out cart drawer with localStorage persistence, Stripe Checkout integration for both one-off purchases and subscriptions, and confirmation/cancellation pages. All implementation follows the existing warm-editorial design, App Router conventions, and Tailwind v4 patterns already in the codebase.

## Specifications

### Functional Requirements

- `/shop` page displays all pieces across all projects where `availability === "available"` AND price is a numeric string (not "POA"). Each card shows image, title, medium, price, and an "Add to Cart" button.
- Cart is a slide-out drawer from the right side. It lists added pieces, shows each piece's title, price, and a "Remove" button. Footer shows the total and a "Checkout" button. There are no quantities — each piece is unique.
- Cart state persists in localStorage. On page load, the cart is rehydrated from localStorage. On successful checkout, localStorage cart is cleared.
- A cart icon in the site header shows the current item count as a badge. Clicking it opens the drawer.
- The existing Lightbox component gains an "Add to Cart" button that appears alongside the existing "Inquire" button when `availability === "available"` AND price is numeric.
- `POST /api/checkout` accepts a JSON body `{ items: CartItem[] }`, fetches the corresponding piece data from Sanity by composite key, creates a Stripe Checkout session with `shipping_address_collection`, and returns `{ url }` for redirect.
- `POST /api/subscribe` accepts `{ priceId: string }`, creates a Stripe Checkout session in subscription mode, returns `{ url }`.
- `/checkout/success` page clears the cart (client-side) and shows a confirmation message.
- `/checkout/cancelled` page shows a cancellation notice and links back to `/shop`.
- `/subscribe` page fetches `subscriptionTier` documents from Sanity and renders tier cards with name, description, displayPrice, and a "Subscribe" button that calls `/api/subscribe`.
- The `subscriptionTier` Sanity document type is defined with: name (string, required), description (text), displayPrice (string), stripePriceId (string, required), sortOrder (number).
- The `siteSettings` document gains optional `subscribePageHeading` and `subscribePageDescription` (text) fields to allow CMS-editable intro copy on `/subscribe`.

### Non-Functional Requirements

- `STRIPE_SECRET_KEY` must only be accessed in server-side code (API routes / server actions). It must never be imported by client components.
- Cart item count badge renders `0` as hidden (no badge) to avoid layout shift on hydration.
- The cart drawer must be accessible: focus trap, `role="dialog"`, `aria-modal="true"`, close on Escape key, return focus to trigger on close.
- The `/api/checkout` route validates that all requested pieces exist in Sanity and have numeric prices before creating the Stripe session — prevents price manipulation.
- Piece identification uses the composite key `projectId__pieceKey` (double underscore separator) as the cart item ID. This is deterministic, URL-safe, and survives page reloads.
- Only pieces with `parseFloat(price)` returning a finite, positive number AND `availability === "available"` show "Add to Cart". POA and unavailable pieces never get cart buttons.
- Price display: store raw string from Sanity (e.g. "450" or "1200"). Display with currency symbol prepended (e.g. "$450"). The currency symbol defaults to "$" — no multi-currency needed.
- The Stripe `success_url` and `cancel_url` include `?session_id={CHECKOUT_SESSION_ID}` on success for future extensibility.
- All new pages follow the existing layout pattern: server component page files under `app/(site)/`, client components where interactivity is needed.
- Tailwind v4: no new config tokens needed for the cart/shop — reuse existing `--color-*` and `--font-family-*` CSS variables.
- `stripe` npm package is added as a dependency (server-only). No Stripe.js client SDK is needed since we use redirect-to-hosted-checkout.

### Acceptance Criteria

- A piece with `availability="available"` and `price="450"` shows "Add to Cart" in both the /shop grid and the Lightbox.
- A piece with `availability="available"` and `price="POA"` shows "Inquire" only, no "Add to Cart".
- A piece with `availability="sold"` shows neither button.
- Adding a piece to the cart opens the drawer and shows the item. The header badge increments.
- Removing a piece from the drawer decrements the badge and updates the total.
- Refreshing the page preserves cart contents (localStorage).
- Clicking "Checkout" redirects to Stripe-hosted checkout.
- After successful Stripe payment, `/checkout/success` loads, cart is emptied, badge returns to zero.
- After cancellation, `/checkout/cancelled` loads. Cart is untouched.
- `/subscribe` page renders all active subscription tiers from Sanity.
- "Subscribe" button on a tier redirects to Stripe-hosted subscription checkout.
- The `/api/checkout` server validates piece data from Sanity — if a piece is no longer "available" or no longer has a numeric price at checkout time, it returns a 400 error (the UI surfaces this gracefully).
- The cart drawer has a visible focus ring, responds to Escape, and traps focus while open.

## Architecture

### Component Overview

**Cart Context (`lib/cart/CartContext.tsx`)**
Client-side React Context + `useReducer` that owns the cart state. Exposes `addItem`, `removeItem`, `clearCart`, `items`, `isOpen`, `openCart`, `closeCart`. Syncs to localStorage via `useEffect`. Provides `CartProvider` wrapper component.

**CartItem type (`lib/cart/types.ts`)**
`{ id: string; projectId: string; pieceKey: string; title: string; price: number; imageUrl: string; }` — `id` is `projectId__pieceKey`.

**CartDrawer (`components/cart/CartDrawer.tsx`)**
`'use client'` component. Slide-out panel rendered via portal to `document.body`. Reads cart state from context. Calls `removeItem` on remove buttons. On "Checkout" click, calls `POST /api/checkout` with current items and redirects to returned `url`. Shows loading state during API call and handles errors.

**CartIcon (`components/cart/CartIcon.tsx`)**
`'use client'` component. Renders a bag/shopping icon button with an item count badge. Uses `useCartContext()`. Calls `openCart()` on click. Badge is hidden when count is 0.

**AddToCartButton (`components/cart/AddToCartButton.tsx`)**
`'use client'` component. Props: `item: CartItem`. Reads cart to know if the item is already added (`isInCart`). Shows "Add to Cart" or "In Cart" (disabled) states. Calls `addItem` from context.

**SubscriptionTierCard (`components/shop/SubscriptionTierCard.tsx`)**
`'use client'` component. Displays tier name, description, displayPrice. On "Subscribe" click, calls `POST /api/subscribe` with `priceId`, then redirects.

**Header modification**
The existing `Header` component is a `'use client'` component. It gains a `CartIcon` import and places it in both desktop nav and mobile header. The `shopUrl` external link prop is replaced by an internal `/shop` link — the `shopUrl` prop on `HeaderProps` is made optional and ignored when absent; instead a static "Shop" nav entry pointing to `/shop` is added to `NAV_LINKS`.

**Site layout modification**
`app/(site)/layout.tsx` wraps `<body>` children in `<CartProvider>`. This is a server component file, so `CartProvider` must be a separate `'use client'` boundary.

**API Routes**
`app/api/checkout/route.ts` — POST handler. Server-only.
`app/api/subscribe/route.ts` — POST handler. Server-only.

### Data Flow

**Shop page:**
Server component fetches all projects with pieces using a new `shopPiecesQuery`. Filters pieces where `availability === "available"` AND price is numeric. Builds image URLs server-side (same as project detail page). Passes enriched piece data (including `projectId` and `pieceKey`) to client card components.

**Cart add flow:**
User clicks "Add to Cart" (client) → `addItem({ id, projectId, pieceKey, title, price, imageUrl })` → cart reducer updates state → `useEffect` writes to localStorage → badge count updates → drawer opens.

**Checkout flow:**
User clicks "Checkout" in drawer → `POST /api/checkout` with `items: CartItem[]` → server fetches all referenced pieces from Sanity by project slug (grouped by projectId) → validates each piece is still available with numeric price → constructs Stripe `line_items` array → creates Checkout session with `shipping_address_collection: { allowed_countries: ['AU', 'US', 'GB', ...] }` → returns `{ url }` → client does `window.location.href = url`.

**Success flow:**
Stripe redirects to `/checkout/success?session_id=...` → client component on that page calls `clearCart()` from context → shows confirmation.

**Subscribe flow:**
User clicks "Subscribe" on tier card → `POST /api/subscribe` with `{ priceId }` → server creates Stripe subscription Checkout session → returns `{ url }` → client redirects.

### Interfaces & Contracts

```typescript
// lib/cart/types.ts
export interface CartItem {
  id: string           // composite: `${projectId}__${pieceKey}`
  projectId: string    // Sanity project _id
  pieceKey: string     // Sanity piece _key within the project
  title: string
  price: number        // numeric, in dollars (parsed from Sanity string)
  imageUrl: string     // pre-built URL
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'HYDRATE'; items: CartItem[] }
```

```typescript
// POST /api/checkout
// Request body:
{ items: CartItem[] }

// Response (200):
{ url: string }   // Stripe Checkout redirect URL

// Response (400):
{ error: string }
```

```typescript
// POST /api/subscribe
// Request body:
{ priceId: string }

// Response (200):
{ url: string }

// Response (400):
{ error: string }
```

```typescript
// lib/queries.ts — new query
export const shopPiecesQuery = `
  *[_type == "project"] {
    _id,
    title,
    "pieces": pieces[availability == "available" && defined(price)] {
      _key,
      title,
      image { ..., asset->{ _id, _type, metadata { dimensions { width, height, aspectRatio } } } },
      medium,
      price,
      availability
    }
  }[count(pieces) > 0]
`
// Note: final numeric price filtering is done in JS after fetch to handle POA

export const subscriptionTiersQuery = `
  *[_type == "subscriptionTier"] | order(sortOrder asc) {
    _id, name, description, displayPrice, stripePriceId, sortOrder
  }
`

export const subscribePageSettingsQuery = `
  *[_type == "siteSettings"][0]{
    subscribePageHeading,
    subscribePageDescription
  }
`

// New query for server-side piece validation in /api/checkout
export const piecesByProjectQuery = `
  *[_type == "project" && _id in $projectIds] {
    _id,
    "pieces": pieces[] { _key, price, availability }
  }
`
```

```typescript
// New type additions to lib/types.ts
export interface ShopPiece {
  _key: string
  projectId: string
  title: string
  image: SanityImageAsset
  medium?: string
  price: string
  availability: 'available'
  imageUrl: string   // pre-built server-side
}

export interface SubscriptionTier {
  _id: string
  name: string
  description?: string
  displayPrice?: string
  stripePriceId: string
  sortOrder?: number
}
```

### Directory / File Structure

```
app/
├── (site)/
│   ├── layout.tsx                          MODIFY — wrap body in CartProvider
│   ├── shop/
│   │   └── page.tsx                        CREATE — server component, shop grid
│   ├── subscribe/
│   │   └── page.tsx                        CREATE — server component, tier list
│   └── checkout/
│       ├── success/
│       │   └── page.tsx                    CREATE — client component, clears cart
│       └── cancelled/
│           └── page.tsx                    CREATE — server component, static message
├── api/
│   ├── checkout/
│   │   └── route.ts                        CREATE — POST handler
│   └── subscribe/
│       └── route.ts                        CREATE — POST handler

components/
├── cart/
│   ├── CartDrawer.tsx                      CREATE — slide-out panel
│   ├── CartIcon.tsx                        CREATE — header icon + badge
│   └── AddToCartButton.tsx                 CREATE — reusable button
├── shop/
│   ├── ShopPieceCard.tsx                   CREATE — card in /shop grid
│   └── SubscriptionTierCard.tsx            CREATE — card in /subscribe
└── layout/
    └── Header.tsx                          MODIFY — add CartIcon, internal Shop link

lib/
├── cart/
│   ├── CartContext.tsx                     CREATE — context + provider + reducer
│   └── types.ts                            CREATE — CartItem, CartState, CartAction
├── queries.ts                              MODIFY — add shopPiecesQuery, subscriptionTiersQuery, etc.
└── types.ts                                MODIFY — add ShopPiece, SubscriptionTier types

sanity/
├── schemas/
│   ├── subscriptionTier.ts                 CREATE — new document type
│   ├── siteSettings.ts                     MODIFY — add subscribePageHeading/Description fields
│   └── index.ts                            MODIFY — register subscriptionTier
└── sanity.config.ts                        MODIFY — add subscriptionTier to EXPLICITLY_LISTED_TYPES and structure
```

## Implementation Steps

### Chunk 1: Dependencies, Types, and Sanity Schema

**1.1** Install `stripe` npm package as a production dependency.
File: `package.json` (via npm install, then lock file updates).

**1.2** Create `lib/cart/types.ts`.
Define and export `CartItem`, `CartState`, `CartAction` types as specified in Interfaces section above.

**1.3** Add `ShopPiece` and `SubscriptionTier` interfaces to `lib/types.ts`.
`ShopPiece` includes `projectId` and `imageUrl` (these are added by the server page, not present in raw Sanity data — see Chunk 3). `SubscriptionTier` maps directly to the Sanity schema.

**1.4** Create `sanity/schemas/subscriptionTier.ts`.
Document type with fields: `name` (string, required), `description` (text, rows 4), `displayPrice` (string, description: "e.g. $10/month"), `stripePriceId` (string, required), `sortOrder` (number, hidden: true). Preview selects title from `name`, subtitle from `displayPrice`.

**1.5** Modify `sanity/schemas/siteSettings.ts`.
Add two new fields after `contactFormHeading`: `subscribePageHeading` (string) and `subscribePageDescription` (text, rows 4).

**1.6** Modify `sanity/schemas/index.ts`.
Import `subscriptionTier` and add it to the `schemas` array.

**1.7** Modify `sanity/sanity.config.ts`.
Add `"subscriptionTier"` to `EXPLICITLY_LISTED_TYPES`. Add a new `S.listItem()` for Subscription Tiers using `S.documentTypeList("subscriptionTier")` with `defaultOrdering: [{ field: "sortOrder", direction: "asc" }]`, placed after CV Entries.

**1.8** Add new queries to `lib/queries.ts`.
Add: `shopPiecesQuery`, `subscriptionTiersQuery`, `subscribePageSettingsQuery`, `piecesByProjectQuery` as specified above.

---

### Chunk 2: Cart Context and Provider

**2.1** Create `lib/cart/CartContext.tsx`.
- Mark `'use client'` at top.
- Define `cartReducer(state: CartState, action: CartAction): CartState` with cases for `ADD_ITEM` (deduplicates by id — if id already in items, no-op), `REMOVE_ITEM`, `CLEAR_CART`, `OPEN_CART`, `CLOSE_CART`, `HYDRATE`.
- Create `CartContext` with `React.createContext<CartContextValue | null>(null)`.
- `CartContextValue` exposes: `items`, `isOpen`, `addItem(item: CartItem): void`, `removeItem(id: string): void`, `clearCart(): void`, `openCart(): void`, `closeCart(): void`, computed `itemCount: number`, computed `total: number` (sum of `item.price` for all items).
- `CartProvider` component: uses `useReducer(cartReducer, { items: [], isOpen: false })`. On mount (`useEffect` with `[]`), reads `localStorage.getItem('cart')`, parses JSON, dispatches `HYDRATE`. Whenever `state.items` changes, writes `JSON.stringify(state.items)` to `localStorage.setItem('cart', ...)`. Catches errors silently (localStorage can throw in SSR or private browsing).
- Export `useCartContext()` hook that reads the context and throws if used outside provider.

**2.2** Modify `app/(site)/layout.tsx`.
Import `CartProvider` from `@/lib/cart/CartContext`. Wrap the `<body>` contents in `<CartProvider>`. Since `layout.tsx` is a server component and `CartProvider` is a client component, this follows the Next.js "server imports client" pattern correctly (the provider itself is the client boundary).

---

### Chunk 3: Shop Page

**3.1** Create `app/(site)/shop/page.tsx`.
- Server component. Export `metadata` with `title: "Shop"`.
- Fetch all projects with pieces via `shopPiecesQuery`.
- For each project, for each piece: filter out pieces where `parseFloat(piece.price)` is not a finite positive number. Build `imageUrl` via `urlFor(piece.image).width(800).auto('format').url()`. Assemble flat array of `ShopPiece` objects (add `projectId: project._id`, `imageUrl`).
- If array is empty, render a message: "No pieces are currently available for purchase."
- Render a responsive grid (3 columns on lg, 2 on sm, 1 on mobile) of `ShopPieceCard` components. Page header: serif `<h1>Shop</h1>` with warm editorial spacing, optional subheading from siteSettings (or omit for now, keep simple).

**3.2** Create `components/shop/ShopPieceCard.tsx`.
- `'use client'` component. Props: `piece: ShopPiece`.
- Renders: `next/image` (square crop or natural ratio, 400px width), piece title (font-serif), medium (font-sans, warm-gray), price formatted as `$${piece.price}` (warm-accent color), then `<AddToCartButton item={cartItem} />` where `cartItem` is assembled from piece fields.
- The card is purely presentational — no lightbox. Clicking the image or title does not navigate (pieces on /shop are standalone; deep-linking to project detail is out of scope).

---

### Chunk 4: Cart UI Components

**4.1** Create `components/cart/AddToCartButton.tsx`.
- `'use client'` component. Props: `item: CartItem`.
- Uses `useCartContext()`. Checks `items.some(i => i.id === item.id)` to determine `isInCart`.
- If `isInCart`: renders a disabled button labelled "In Cart" with muted styling.
- If not in cart: renders an active button labelled "Add to Cart" that calls `addItem(item)` and then `openCart()` on click.
- Button style matches the existing "Inquire" link in `Lightbox.tsx`: border `var(--color-warm-accent)`, text `var(--color-warm-accent)`, hover fills with `var(--color-warm-accent)`, text becomes `var(--color-ink)`. Font-sans, 0.75rem, uppercase, tracking-widest.

**4.2** Create `components/cart/CartIcon.tsx`.
- `'use client'` component. Uses `useCartContext()` for `itemCount` and `openCart`.
- Renders a `<button>` with an SVG shopping-bag icon (24x24, stroke-based, matches existing header SVG style). Overlays a small circular badge showing `itemCount` when `itemCount > 0`. Badge: absolute position top-right, 16px diameter, `var(--color-warm-accent)` background, `var(--color-ink)` text, font-sans text-xs.
- `aria-label`: "Shopping cart, {itemCount} item{s}".
- When `itemCount === 0`, the badge element is not rendered (avoids layout shift).

**4.3** Create `components/cart/CartDrawer.tsx`.
- `'use client'` component.
- Uses `useCartContext()` for `items`, `isOpen`, `closeCart`, `removeItem`, `total`.
- Renders via `ReactDOM.createPortal` to `document.body` (same hydration guard pattern as `Lightbox.tsx`: `useState(mounted)`, `useEffect(() => setMounted(true), [])`).
- Structure: full-height overlay (right side), 400px wide panel (full width on mobile), `role="dialog"` `aria-modal="true"` `aria-label="Shopping cart"`.
- Slide-in animation: CSS transform translateX from 100% to 0 using `transition` style (200ms ease), toggled by `isOpen`. Respects `prefers-reduced-motion`.
- Focus trap: same pattern as `Lightbox.tsx` — `useCallback` on `onKeyDown`, query focusable elements, wrap Tab/Shift+Tab.
- Escape key closes the drawer.
- Header: "Your Cart" (h2 font-serif) + close button (×).
- Empty state: "Your cart is empty" message with a link to /shop.
- Item list: for each `CartItem`, show title (font-serif), price (`$${item.price}`), and a "Remove" button (text-sm, warm-gray, underline-hover). No image needed in drawer to keep it clean.
- Footer (sticky at bottom of panel): total line ("Total: $X"), then "Checkout" button (full-width, `var(--color-ink)` background, `var(--color-cream)` text, font-sans uppercase) and a "Continue Shopping" text link that calls `closeCart()`.
- On "Checkout" click: sets local `loading` state to `true`, calls `fetch('/api/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items }) })`, on success redirects to `data.url` via `window.location.href`. On error: shows inline error message, resets loading state.

**4.4** Modify `components/layout/Header.tsx`.
- Import `CartIcon` from `@/components/cart/CartIcon`.
- Import `CartDrawer` from `@/components/cart/CartDrawer`.
- Update `NAV_LINKS` array: add `{ label: 'Shop', href: '/shop' }` before Contact. The existing `shopUrl` prop and external link remain for backward compatibility — only render the external link if `shopUrl` is provided AND no internal shop route is active (or simply always show the internal /shop link and remove the external one if shopUrl is absent; the `SiteSettings.externalShopUrl` field is now superseded).
- In the desktop nav `<ul>`, add `<CartIcon />` after the nav links.
- In the mobile header row (between logo and hamburger), add `<CartIcon />`.
- Place `<CartDrawer />` once at the end of the returned JSX (outside `<header>`, using a Fragment wrapper).

---

### Chunk 5: Lightbox — Add to Cart Integration

**5.1** Modify `components/ui/Lightbox.tsx`.
- Import `AddToCartButton` from `@/components/cart/AddToCartButton`.
- Import `CartItem` type from `@/lib/cart/types`.
- Add new prop to `LightboxProps`: `projectId: string`.
- In the metadata panel, after the existing `showInquire && <a Inquire>` block, add:
  ```
  {piece?.availability === 'available' && piece?.price && isNumericPrice(piece.price) && (
    <AddToCartButton item={buildCartItem(piece, projectId, imageUrl)} />
  )}
  ```
- Add helper `isNumericPrice(price: string): boolean` — returns `isFinite(parseFloat(price)) && parseFloat(price) > 0`.
- Add helper `buildCartItem(piece: Piece, projectId: string, imageUrl: string): CartItem` — constructs the CartItem with `id: \`${projectId}__${piece._key}\``.
- Both helpers are module-level functions in the file (not exported).

**5.2** Modify `app/(site)/projects/[slug]/ProjectDetailClient.tsx`.
- Add `projectId: string` to `ProjectDetailClientProps`.
- Pass `projectId={project._id}` to the `<Lightbox>` component.

**5.3** Modify `app/(site)/projects/[slug]/page.tsx`.
- Pass `project._id` down as `projectId` to `ProjectDetailClient`.

---

### Chunk 6: API Routes

**6.1** Create `app/api/checkout/route.ts`.
- `import Stripe from 'stripe'`. Initialize at module level: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })`.
- Export `async function POST(request: Request)`.
- Parse body: `const { items }: { items: CartItem[] } = await request.json()`.
- Validate: `items` must be a non-empty array; each must have `projectId`, `pieceKey`, `price > 0`.
- Group items by `projectId`. Fetch from Sanity using `piecesByProjectQuery` (server-side `sanityFetch` with `cache: 'no-store'` — bypass cache for real-time availability). Compare each item's `price` and `availability` against Sanity data. If any mismatch, return `Response.json({ error: 'One or more items are no longer available.' }, { status: 400 })`.
- Build Stripe `line_items`:
  ```
  {
    price_data: {
      currency: 'aud',
      product_data: { name: item.title, images: [item.imageUrl] },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1
  }
  ```
- Call `stripe.checkout.sessions.create({ mode: 'payment', line_items, shipping_address_collection: { allowed_countries: ['AU', 'US', 'GB', 'CA', 'NZ'] }, success_url: \`${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`, cancel_url: \`${origin}/checkout/cancelled\` })`.
- Derive `origin` from `request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`.
- Return `Response.json({ url: session.url })`.
- Wrap in try/catch — on Stripe error, return `Response.json({ error: 'Checkout unavailable. Please try again.' }, { status: 500 })`.

**6.2** Create `app/api/subscribe/route.ts`.
- Same Stripe initialization.
- Export `async function POST(request: Request)`.
- Parse `{ priceId }: { priceId: string }` from body. Validate non-empty string.
- Call `stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], success_url: \`${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`, cancel_url: \`${origin}/subscribe\` })`.
- Return `Response.json({ url: session.url })`.
- Wrap in try/catch.

---

### Chunk 7: Checkout Result Pages and Subscribe Page

**7.1** Create `app/(site)/checkout/success/page.tsx`.
- Must be a `'use client'` component (needs to call `clearCart` from context).
- On mount (`useEffect`), calls `clearCart()` from `useCartContext()`.
- Renders: full-height centered layout, serif heading "Thank you for your purchase", sans body text "Your order has been placed. The artist will be in touch with shipping details.", link back to "/" and "/shop".
- Export `metadata` as a named export from a sibling `layout.tsx` or use `generateMetadata` — but since this is a client page, use a separate `app/(site)/checkout/success/layout.tsx` that just passes through children and exports metadata, OR use the `export const metadata` pattern with `'use client'` — in Next.js 15 App Router, metadata cannot be exported from a client component. Solution: keep the page as a thin client component that just calls `clearCart` and delegates to a `SuccessContent` client child, while the page file itself remains a server component.
  - Preferred approach: `page.tsx` is a server component. It renders a `<SuccessClient />` component which is a `'use client'` component that calls `clearCart()` on mount and renders the confirmation UI. This avoids the metadata conflict.

**7.2** Create `app/(site)/checkout/cancelled/page.tsx`.
- Server component. Export `metadata` with `title: "Order Cancelled"`.
- Static page: heading "Checkout Cancelled", message "No payment was taken. Your cart is still saved.", links to "/shop" and "/".

**7.3** Create `app/(site)/subscribe/page.tsx`.
- Server component. Export `generateMetadata` returning `title: "Subscribe"`.
- Fetch subscription tiers with `subscriptionTiersQuery` and subscribe page settings with `subscribePageSettingsQuery`.
- Renders: serif h1 (settings.subscribePageHeading ?? "Support the Artist"), optional description text, then a grid of `SubscriptionTierCard` components.
- If no tiers, renders: "Subscription tiers coming soon."

**7.4** Create `components/shop/SubscriptionTierCard.tsx`.
- `'use client'` component. Props: `tier: SubscriptionTier`.
- Card layout: tier name (h3 font-serif), displayPrice (font-sans, warm-accent, larger text), description (font-sans body).
- "Subscribe" button: on click, sets loading state, calls `POST /api/subscribe` with `{ priceId: tier.stripePriceId }`, on success redirects to returned url. On error, shows inline error message.
- Button style matches warm-accent filled button (filled `var(--color-warm-accent)` background, `var(--color-ink)` text).

---

## Dependencies

- `stripe` npm package (server-only, install as production dependency: `npm install stripe`). Version ^17 is current as of mid-2025.
- `STRIPE_SECRET_KEY` environment variable (server-side only, add to `.env.local` and Vercel environment variables).
- `NEXT_PUBLIC_SITE_URL` environment variable (already referenced in codebase for metadata base URL and now used in Stripe success/cancel URLs).
- No new client-side Stripe SDK — all Stripe interaction is server-side via Checkout redirect.

## Risks / Open Questions

1. **Currency**: The `price` field in Sanity stores values like "450" without currency. The API route hardcodes `currency: 'aud'`. If the artist needs multi-currency, the price field would need to change. For now: hardcode AUD in the Stripe session and display with "$" prefix in the UI. Document this assumption clearly in a code comment.

2. **Piece identification in /api/checkout**: The route receives `projectId` (the Sanity `_id`) and `pieceKey` (the piece `_key`). Sanity `_id` values are stable and not guessable slugs. This composite key approach is secure enough for price validation since we re-fetch from Sanity server-side before charging.

3. **Sanity `no-store` in API routes**: The checkout API uses `cache: 'no-store'` to bypass Next.js cache and get real-time availability. This is critical — stale cache could allow someone to checkout a sold piece. The `sanityFetch` utility in `sanity.client.ts` passes the `cache` option through `client.fetch` options, so passing `{ cache: 'no-store' }` as the third argument should work.

4. **Header refactor**: `Header.tsx` currently renders `shopUrl` as an external link. After this change, the internal `/shop` link is always present (added to `NAV_LINKS`). The `shopUrl` prop should be deprecated (kept for backward compatibility but unused). The site layout passes `shopUrl={settings.externalShopUrl}` — this prop can remain but `Header` will ignore it.

5. **Cart drawer portal hydration**: The `CartDrawer` uses the same `mounted` state guard as `Lightbox.tsx` to prevent SSR hydration mismatch on `document.body` portal. Ensure this pattern is replicated exactly.

6. **Success page `clearCart` on navigation**: The `/checkout/success` page calls `clearCart()` on mount. If a user manually navigates to `/checkout/success` without actually completing a purchase, the cart will be cleared. This is acceptable behavior for a simple implementation — the URL is obscure enough that accidental navigation is unlikely.

7. **Shipping countries**: The initial list `['AU', 'US', 'GB', 'CA', 'NZ']` is hardcoded in the API route. If the artist only ships domestically (AU), this can be reduced. This is easily changed in one place.

8. **Image URLs in Stripe line_items**: Stripe's `product_data.images` must be publicly accessible URLs. The `imageUrl` built by `urlFor(...).width(800).auto('format').url()` from Sanity's CDN (`cdn.sanity.io`) is publicly accessible, so this works correctly.

9. **Stripe API version**: The route uses `apiVersion: '2024-11-20.acacia'` which is a recent stable version. If the `stripe` package installed has a different bundled type version, the TypeScript types may not match. Use the API version string that corresponds to the installed package version.

10. **Subscribe page metadata conflict**: See step 7.1 — client components cannot export `metadata`. The solution is to use a nested `SuccessClient` component for the cart-clearing side effect, keeping the page file itself as a server component. This is a known Next.js App Router pattern.

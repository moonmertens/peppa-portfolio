# Artist Portfolio Website — Implementation Plan

## Overview

A portfolio website for a visual artist to showcase her work. Warm editorial aesthetic, project-based organization, image-primary with full metadata. Artist manages content herself via Sanity Studio.

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | Next.js (App Router) | Free |
| CMS | Sanity.io (free tier) | Free |
| Hosting | Vercel | Free |
| Contact form | Formspree or Web3Forms | Free |
| Fonts | Google Fonts | Free |
| Domain | Vercel subdomain (name.vercel.app) | Free |

## Design Spec

- **Aesthetic**: Warm editorial — cream/off-white backgrounds, warm tones, subtle paper texture
- **Typography**: Serif headings + clean sans-serif body (Google Fonts)
- **Logo**: Artist name typeset in heading font
- **Motion**: Subtle fade-ins on scroll, smooth hover states, soft page transitions
- **Layout philosophy**: Generous whitespace, artwork dominates, minimal chrome

## Site Map

1. **Home** — Featured hero project (large) + uniform grid of remaining projects
2. **Project Detail** (`/projects/[slug]`) — Vertical scroll of large images, project description, click any image for lightbox
3. **Lightbox** — Full-screen image with metadata: title, year, medium, dimensions, description, price/availability, "Inquire" button
4. **About** (`/about`) — Bio, artist statement, photo (CMS-editable)
5. **CV** (`/cv`) — Structured sections: Exhibitions, Education, Awards, Press (each entry: year + description)
6. **Contact** (`/contact`) — Contact form (Formspree/Web3Forms), keeps email private
7. **Shop** — External link in navigation (not a page)

## Sanity Content Schema

- **Project**: title, slug, cover image, description, date, category, sort order, pieces[]
- **Piece**: title, image, year, medium, dimensions, description, price, availability status, sort order
- **About Page**: heading, bio (rich text), artist photo
- **CV Entry**: type (exhibition/education/award/press), title, venue/institution, year, description
- **Site Settings**: artist name, tagline, social links[], external shop URL, contact form heading
- **Social Link**: platform, URL, icon

## Navigation

- Header: Artist Name (left), nav links (right): Work, About, CV, Contact, Shop (external)
- Footer: Social media icons (CMS-configurable), copyright
- Mobile: Hamburger menu

## Implementation Chunks

### Chunk 1: Project Scaffolding & Infrastructure
- Initialize Next.js app with App Router and TypeScript
- Initialize Sanity Studio (embedded or separate)
- Connect Sanity client to Next.js
- Set up project structure (folders, base config)
- Configure Tailwind CSS
- Deploy skeleton to Vercel
- Configure custom domain DNS

### Chunk 2: Sanity Content Schemas
- Define all schemas: Project, Piece, About, CV Entry, Site Settings, Social Link
- Configure Sanity Studio ordering/preview
- Enable drag-and-drop reordering for Projects and Pieces
- Add image hotspot/crop support
- Seed with placeholder content for development

### Chunk 3: Homepage & Gallery Layout
- Build site header with navigation
- Build footer with social icons
- Implement featured hero project section
- Implement uniform project grid below hero
- Responsive design (mobile-first)
- Warm editorial styling: typography, colors, spacing, texture
- Subtle scroll animations (fade-in)

### Chunk 4: Project Detail & Lightbox
- Project detail page with vertical scroll layout
- Large images with lazy loading
- Project description and metadata header
- Lightbox overlay on image click
- Full metadata display in lightbox (title, year, medium, dimensions, description, price, availability)
- "Inquire" button in lightbox (links to contact)
- Keyboard navigation in lightbox (arrow keys, escape)

### Chunk 5: About, CV & Contact Pages
- About page with CMS content (bio, photo, statement)
- CV page with structured sections (Exhibitions, Education, Awards, Press)
- Contact page with Formspree/Web3Forms form integration
- Form validation and success/error states
- Consistent page layout and transitions

### Chunk 6: Polish, Performance & QA
- Image optimization (Next.js Image, srcset, blur placeholders)
- SEO: meta tags, Open Graph, structured data
- Accessibility audit (keyboard nav, screen reader, color contrast)
- Performance audit (Lighthouse)
- Cross-browser testing
- Mobile responsiveness final pass
- Subtle page transitions and hover animations polish
- 404 page
- Loading states

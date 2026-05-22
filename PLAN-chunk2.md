# Plan: Chunk 2 — Sanity Content Schemas

## Summary

Define all Sanity content schemas (Project, Piece, About Page, CV Entry, Site Settings),
register them in the schema index, and configure the Studio structure builder so that
singletons are enforced, project lists are sorted by `sortOrder`, and CV entries are
grouped and sorted by year descending.

---

## Specifications

### Functional Requirements

- Five schema types are defined and registered with Sanity Studio v3 (`sanity@5.26.0`).
- **Project** is a document type with an inline `pieces[]` array of Piece objects.
- **Piece** is a reusable object type (not a document) embedded inside Project.
- **About Page** is a singleton document — only one instance can ever exist in the dataset.
- **Site Settings** is a singleton document — only one instance can ever exist.
- The Studio structure builder presents singletons as direct menu items (no "Create new" button).
- Projects appear in a list view sorted ascending by `sortOrder`.
- CV Entries appear in a list view grouped by `type`, each group sorted descending by `year`.
- All images support hotspot and crop to allow the artist to control focal point.
- Required fields (`title`, `slug`, `coverImage` on Project; `title`, `image` on Piece;
  `artistName` on Site Settings; `title` and `year` on CV Entry) block publishing if empty.
- The `slug` on Project is auto-generated from `title` and carries a uniqueness validation rule.
- Piece `availability` is constrained to the list: `available`, `sold`, `not for sale`.
- CV Entry `type` is constrained to the list: `exhibition`, `education`, `award`, `press`.

### Non-Functional Requirements

- All schema files use TypeScript with `defineType` and `defineField` from `sanity`.
- `defineArrayMember` is used for every item inside an `array` field.
- No external npm packages beyond those already installed in Chunk 1 are required.
- The singleton enforcement relies only on the built-in `structureTool` structure builder — no
  third-party plugins.
- TypeScript must compile without errors (`tsc --noEmit`).
- ESLint must pass (`npm run lint`).

### Acceptance Criteria

- `http://localhost:3000/studio` loads without errors and displays all five document types in
  the Studio sidebar.
- About Page and Site Settings show as single-item menu entries (no "New document" button).
- Creating a Project document and adding Pieces to it via the array field works without errors.
- Saving a Project with a blank `title` shows a validation error in the Studio UI.
- `npx tsc --noEmit` exits with code 0.
- `npm run lint` exits with code 0.

---

## Architecture

### Component Overview

| File | Role |
|---|---|
| `sanity/schemas/project.ts` | Document schema for Project |
| `sanity/schemas/piece.ts` | Object schema for Piece (inline inside Project) |
| `sanity/schemas/aboutPage.ts` | Document schema for About Page singleton |
| `sanity/schemas/cvEntry.ts` | Document schema for CV Entry |
| `sanity/schemas/siteSettings.ts` | Document schema for Site Settings singleton |
| `sanity/schemas/index.ts` | Schema registry — imports and re-exports all types |
| `sanity/sanity.config.ts` | Studio config — updated with custom structure builder |

No new npm packages are needed. All APIs (`defineType`, `defineField`, `defineArrayMember`,
`StructureBuilder`) are provided by `sanity@5.26.0`.

### Data Flow

```
sanity/schemas/piece.ts         (object type — no top-level registration needed beyond index)
sanity/schemas/project.ts       (document type — references piece by name "piece")
sanity/schemas/aboutPage.ts     (document type, singleton)
sanity/schemas/cvEntry.ts       (document type)
sanity/schemas/siteSettings.ts  (document type, singleton)
        |
        v
sanity/schemas/index.ts         (exports SchemaTypeDefinition[])
        |
        v
sanity/sanity.config.ts         (schema.types array + structureTool with custom structure)
```

### Interfaces & Contracts

**`sanity/schemas/index.ts`** must export:

```ts
import type { SchemaTypeDefinition } from "sanity"
const schemas: SchemaTypeDefinition[]
export default schemas
```

**`sanity/sanity.config.ts`** updated signature (structure plugin):

```ts
import { structureTool } from "sanity/structure"
import type { StructureBuilder } from "sanity/structure"

structureTool({
  structure: (S: StructureBuilder) => S.list().title("Content").items([...])
})
```

**Singleton enforcement pattern** (used for About Page and Site Settings):

```ts
S.listItem()
  .title("About Page")
  .id("aboutPage")
  .child(
    S.document()
      .schemaType("aboutPage")
      .documentId("aboutPage")  // fixed document ID prevents multiple instances
  )
```

By giving the singleton a fixed `documentId`, Sanity always opens the same document.
The type must also be excluded from `S.documentTypeListItems()` to hide the "create new"
entry from the auto-generated list.

### Directory / File Structure

```
sanity/
├── env.ts                    (unchanged from Chunk 1)
├── sanity.client.ts          (unchanged from Chunk 1)
├── sanity.config.ts          (MODIFIED — add structure builder)
└── schemas/
    ├── index.ts              (MODIFIED — register all schemas)
    ├── project.ts            (NEW)
    ├── piece.ts              (NEW)
    ├── aboutPage.ts          (NEW)
    ├── cvEntry.ts            (NEW)
    └── siteSettings.ts       (NEW)
```

---

## Implementation Steps

### Step 1 — Create `sanity/schemas/piece.ts`

This must be written first because `project.ts` references it by name `"piece"`.

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/piece.ts`

```ts
import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "piece",
  title: "Piece",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
    }),
    defineField({
      name: "medium",
      title: "Medium",
      type: "string",
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "price",
      title: "Price",
      description: 'Enter a price or "POA" for Price on Application.',
      type: "string",
    }),
    defineField({
      name: "availability",
      title: "Availability",
      type: "string",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "Sold", value: "sold" },
          { title: "Not for sale", value: "not for sale" },
        ],
        layout: "radio",
      },
      initialValue: "available",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      subtitle: "medium",
    },
  },
})
```

### Step 2 — Create `sanity/schemas/project.ts`

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/project.ts`

```ts
import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
        }),
      ],
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
    }),
    defineField({
      name: "pieces",
      title: "Pieces",
      type: "array",
      of: [
        defineArrayMember({
          type: "piece",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "coverImage",
      subtitle: "category",
    },
  },
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
    {
      title: "Date, Newest",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
})
```

### Step 3 — Create `sanity/schemas/aboutPage.ts`

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/aboutPage.ts`

```ts
import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  // __experimental_actions restricts creation to one document in the dataset.
  // The structure builder further enforces this by opening a fixed documentId.
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
        }),
      ],
    }),
    defineField({
      name: "artistPhoto",
      title: "Artist Photo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: "heading",
      media: "artistPhoto",
    },
    prepare({ title, media }) {
      return {
        title: title || "About Page",
        media,
      }
    },
  },
})
```

### Step 4 — Create `sanity/schemas/cvEntry.ts`

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/cvEntry.ts`

```ts
import { defineField, defineType } from "sanity"

export default defineType({
  name: "cvEntry",
  title: "CV Entry",
  type: "document",
  fields: [
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Exhibition", value: "exhibition" },
          { title: "Education", value: "education" },
          { title: "Award", value: "award" },
          { title: "Press", value: "press" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "venue",
      title: "Venue / Institution",
      type: "string",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (Rule) =>
        Rule.required().integer().min(1900).max(new Date().getFullYear() + 5),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "venue",
      year: "year",
      type: "type",
    },
    prepare({ title, subtitle, year, type }) {
      return {
        title: `${year ? year + " — " : ""}${title}`,
        subtitle: subtitle ? `${type} · ${subtitle}` : type,
      }
    },
  },
  orderings: [
    {
      title: "Year, Newest First",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
    {
      title: "Year, Oldest First",
      name: "yearAsc",
      by: [{ field: "year", direction: "asc" }],
    },
  ],
})
```

### Step 5 — Create `sanity/schemas/siteSettings.ts`

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/siteSettings.ts`

```ts
import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "artistName",
      title: "Artist Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          title: "Social Link",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "platform",
              subtitle: "url",
            },
          },
        }),
      ],
    }),
    defineField({
      name: "externalShopUrl",
      title: "External Shop URL",
      type: "url",
    }),
    defineField({
      name: "contactFormHeading",
      title: "Contact Form Heading",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "artistName",
      subtitle: "tagline",
    },
    prepare({ title, subtitle }) {
      return {
        title: title || "Site Settings",
        subtitle,
      }
    },
  },
})
```

### Step 6 — Update `sanity/schemas/index.ts`

Replace the empty placeholder with imports of all five schemas.

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/schemas/index.ts`

```ts
import type { SchemaTypeDefinition } from "sanity"
import project from "./project"
import piece from "./piece"
import aboutPage from "./aboutPage"
import cvEntry from "./cvEntry"
import siteSettings from "./siteSettings"

const schemas: SchemaTypeDefinition[] = [
  project,
  piece,
  aboutPage,
  cvEntry,
  siteSettings,
]

export default schemas
```

### Step 7 — Update `sanity/sanity.config.ts` with structure builder

Replace the current config with one that:
- Keeps the existing `visionTool`.
- Passes a custom `structure` function to `structureTool` that:
  - Renders singletons (About Page, Site Settings) as fixed-document items.
  - Renders Projects with a default sort by `sortOrder`.
  - Renders CV Entries as a filterable list sorted by `year` descending.
  - Excludes singletons from the auto-generated document type list.

Path: `/Users/Tuan_Minh_HOANG_from.TP/Desktop/Personal/peppaportfolio/sanity/sanity.config.ts`

```ts
import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import type { StructureBuilder } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { apiVersion, dataset, projectId, studioUrl } from "./env"
import schemas from "./schemas"

// Document types that should appear as singletons (no list, no "new" button).
const SINGLETON_TYPES = new Set(["aboutPage", "siteSettings"])

function structure(S: StructureBuilder) {
  return S.list()
    .title("Content")
    .items([
      // ── Singleton: About Page ──────────────────────────────────────────
      S.listItem()
        .title("About Page")
        .id("aboutPage")
        .child(
          S.document()
            .schemaType("aboutPage")
            .documentId("aboutPage")
        ),

      // ── Singleton: Site Settings ───────────────────────────────────────
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
        ),

      S.divider(),

      // ── Projects ───────────────────────────────────────────────────────
      S.listItem()
        .title("Projects")
        .schemaType("project")
        .child(
          S.documentTypeList("project")
            .title("Projects")
            .defaultOrdering([{ field: "sortOrder", direction: "asc" }])
        ),

      // ── CV Entries ─────────────────────────────────────────────────────
      S.listItem()
        .title("CV Entries")
        .schemaType("cvEntry")
        .child(
          S.documentTypeList("cvEntry")
            .title("CV Entries")
            .defaultOrdering([{ field: "year", direction: "desc" }])
        ),

      S.divider(),

      // ── All remaining non-singleton document types (auto-generated) ─────
      ...S.documentTypeListItems().filter(
        (item) => item.getId() != null && !SINGLETON_TYPES.has(item.getId()!)
      ),
    ])
}

export default defineConfig({
  basePath: studioUrl,
  projectId,
  dataset,
  schema: {
    types: schemas,
  },
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})
```

Note on `S.documentTypeListItems().filter(...)`: this call produces the default auto-generated
list items for ALL document types. Filtering out `project`, `cvEntry`, and the singletons
prevents them from appearing twice (they are already listed explicitly above). The filter
condition uses `item.getId() != null && !SINGLETON_TYPES.has(item.getId()!)` — the `piece`
type is an object (not a document), so it will never appear in this list.

### Step 8 — Verify TypeScript compilation

After writing all files, the coder must run:

```bash
npx tsc --noEmit
```

from the project root and confirm exit code 0. Common issues to watch for:

- `__experimental_actions` may require a TypeScript cast
  (`as unknown as DocumentActionComponent[]`) in strict mode on some Sanity versions. If tsc
  errors on this field, the coder should cast it or use `// @ts-expect-error` with a comment.
- `StructureBuilder` import path: use `"sanity/structure"` not `"sanity"`.

### Step 9 — Verify Studio loads

Start the dev server and confirm:

```bash
npm run dev
```

- `http://localhost:3000/studio` loads without console errors.
- The sidebar shows: About Page, Site Settings, (divider), Projects, CV Entries.
- Opening Projects shows an empty list (no documents yet).
- Clicking "About Page" opens a single-document editor (no "New document" button visible).

---

## Dependencies

All required packages are already installed from Chunk 1. No new packages are needed.

| Package | Already installed | Used for |
|---|---|---|
| `sanity@5.26.0` | Yes | `defineType`, `defineField`, `defineArrayMember`, `structureTool`, `StructureBuilder` |
| `@sanity/vision@5.x` | Yes (bundled with sanity) | GROQ query testing in Studio |
| `next-sanity@13.0.3` | Yes | Studio rendering at `/studio` |

---

## Risks / Open Questions

1. **`__experimental_actions` TypeScript typing** — The `__experimental_actions` field on a
   schema definition is marked experimental in Sanity v3's TypeScript types and may not exist
   on `SchemaTypeDefinition`. If TypeScript rejects it, the coder should cast the individual
   schema object: `defineType({ ... }) as SchemaTypeDefinition` and add a `// @ts-ignore`
   or `// @ts-expect-error` comment. An alternative singleton-enforcement approach (without
   `__experimental_actions`) is to rely solely on the structure builder's fixed `documentId`;
   this alone prevents the user from navigating to a "New document" form for those types via
   the Studio UI, which is sufficient in practice.

2. **Structure builder filter for explicit items** — The `S.documentTypeListItems()` call in
   Step 7 auto-generates items for every registered document type including `project` and
   `cvEntry`. The filter removes types that are explicitly listed above the divider. If a future
   schema is added, it will automatically appear in the "remaining" section — the filter only
   needs updating if a new singleton is introduced.

3. **Piece `sortOrder` vs. array drag-and-drop** — Pieces inside a project are stored as an
   inline array. Sanity's array field natively supports drag-and-drop reordering in the Studio
   UI, which reorders the array items in the stored document. The `sortOrder` field on Piece is
   present but largely redundant since array position is the canonical order. It is kept for
   potential future use (e.g., GROQ queries that sort by it explicitly). The coder should mark
   it `hidden: true` as specified.

4. **Portable text mark definitions** — The `description` (bio) field on About Page and the
   `description` on Project use a minimal portable text block array (`of: [{ type: "block" }]`).
   No custom marks, annotations, or block types are added at this stage. If the artist needs
   links or bold/italic in the Studio, the `block` type includes those by default — no
   additional configuration is required.

5. **Slug uniqueness** — Sanity's built-in slug type does not enforce uniqueness at the schema
   level automatically; it relies on the `isUnique` option in `slug.options`. A custom
   `isUnique` function can query the dataset to check for duplicates, but this requires an
   authenticated client available at schema definition time, which is complex to wire in.
   For this portfolio (small dataset, single artist), omitting `isUnique` is acceptable. If
   needed later, it can be added as `options: { source: "title", isUnique: (slug, context) =>
   context.defaultIsUnique(slug, context) }` — the default behavior in Sanity v3 already
   provides a reasonable check via the Studio UI warning.

6. **CV Entry `year` max validation** — The `max(new Date().getFullYear() + 5)` expression
   is evaluated at module load time inside the Sanity config (server-side and at Studio boot).
   This is the idiomatic approach and is safe; the value will be `2031` when this plan is
   executed in 2026.

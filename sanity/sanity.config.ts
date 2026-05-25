import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import type { StructureBuilder } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { apiVersion, dataset, projectId, studioUrl } from "./env"
import schemas from "./schemas"

// All document types explicitly listed above the divider — excluded from the
// auto-generated fallback list so they don't appear twice.
const EXPLICITLY_LISTED_TYPES = new Set(["aboutPage", "siteSettings", "project", "cvEntry", "subscriptionTier"])

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

      // ── Subscription Tiers ─────────────────────────────────────────────
      S.listItem()
        .title("Subscription Tiers")
        .schemaType("subscriptionTier")
        .child(
          S.documentTypeList("subscriptionTier")
            .title("Subscription Tiers")
            .defaultOrdering([{ field: "sortOrder", direction: "asc" }])
        ),

      S.divider(),

      // ── All remaining document types not already listed above (auto-generated) ─
      ...S.documentTypeListItems().filter(
        (item) => item.getId() != null && !EXPLICITLY_LISTED_TYPES.has(item.getId()!)
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

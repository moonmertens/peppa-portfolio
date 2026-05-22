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

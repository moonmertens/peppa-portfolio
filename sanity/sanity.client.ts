import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "./env"

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // set to true in production for public/non-authenticated data
})

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return client.fetch<T>(query, params, {
    // In server components, Next.js caching applies here
    cache: "force-cache",
  })
}

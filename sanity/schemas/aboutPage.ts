import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  // Singleton enforcement: structure builder opens a fixed documentId.
  // __experimental_actions restricts available actions to update and publish only.
  // @ts-expect-error __experimental_actions is not in the public TS types but works at runtime
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

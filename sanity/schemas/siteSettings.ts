import { defineArrayMember, defineField, defineType } from "sanity"

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  // Singleton enforcement: structure builder opens a fixed documentId.
  // @ts-expect-error __experimental_actions is not in the public TS types but works at runtime
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

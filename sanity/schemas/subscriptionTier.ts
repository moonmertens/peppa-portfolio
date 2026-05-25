import { defineField, defineType } from "sanity"

export default defineType({
  name: "subscriptionTier",
  title: "Subscription Tier",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "displayPrice",
      title: "Display Price",
      type: "string",
      description: "e.g. $10/month",
    }),
    defineField({
      name: "stripePriceId",
      title: "Stripe Price ID",
      type: "string",
      validation: (Rule) => Rule.required(),
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
      title: "name",
      subtitle: "displayPrice",
    },
  },
})

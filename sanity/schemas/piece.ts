import { defineField, defineType } from "sanity"

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

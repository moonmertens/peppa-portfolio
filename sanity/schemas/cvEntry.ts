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

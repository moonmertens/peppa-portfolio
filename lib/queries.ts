export const siteSettingsQuery = `
  *[_type == "siteSettings"][0]{
    artistName,
    tagline,
    socialLinks,
    externalShopUrl,
    contactFormHeading
  }
`

export const projectsQuery = `
  *[_type == "project"] | order(sortOrder asc) {
    _id,
    title,
    slug,
    coverImage,
    category,
    date,
    sortOrder
  }
`

export const aboutPageQuery = `
  *[_type == "aboutPage"][0]{
    heading,
    bio,
    artistPhoto{
      ...,
      asset->{
        _id,
        _type,
        metadata {
          dimensions {
            width,
            height,
            aspectRatio
          }
        }
      }
    }
  }
`

export const cvEntriesQuery = `
  *[_type == "cvEntry"] | order(year desc) {
    _id,
    type,
    title,
    venue,
    year,
    description
  }
`

export const projectBySlugQuery = `
  *[_type == "project" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    coverImage,
    category,
    date,
    sortOrder,
    description,
    pieces[]{
      _key,
      title,
      image{
        ...,
        asset->{
          _id,
          _type,
          metadata {
            dimensions {
              width,
              height,
              aspectRatio
            }
          }
        }
      },
      year,
      medium,
      dimensions,
      description,
      price,
      availability,
      sortOrder
    }
  }
`

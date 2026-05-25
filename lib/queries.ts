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

export const shopPiecesQuery = `
  *[_type == "project"] {
    _id,
    title,
    "pieces": pieces[availability == "available" && defined(price)] {
      _key,
      title,
      image { ..., asset->{ _id, _type, metadata { dimensions { width, height, aspectRatio } } } },
      medium,
      price,
      availability
    }
  }[count(pieces) > 0]
`
// Note: final numeric price filtering is done in JS after fetch to handle POA

export const subscriptionTiersQuery = `
  *[_type == "subscriptionTier"] | order(sortOrder asc) {
    _id, name, description, displayPrice, stripePriceId, sortOrder
  }
`

export const subscribePageSettingsQuery = `
  *[_type == "siteSettings"][0]{
    subscribePageHeading,
    subscribePageDescription
  }
`

export const piecesByProjectQuery = `
  *[_type == "project" && _id in $projectIds] {
    _id,
    "pieces": pieces[] { _key, price, availability }
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

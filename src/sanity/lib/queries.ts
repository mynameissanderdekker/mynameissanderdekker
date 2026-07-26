import { defineQuery } from 'next-sanity'

// Alle project series
export const allSeriesQuery = defineQuery(`
  *[_type == "projectSeries"] | order(order asc) {
    _id,
    title,
    slug,
    description,
    coverImage,
    order
  }
`)

// Alle projecten
export const allProjectsQuery = defineQuery(`
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    slug,
    year,
    coverImage,
    highlighted,
    order,
    "series": series->{ _id, title, slug }
  }
`)

// Highlighted projecten voor homepage
export const highlightedProjectsQuery = defineQuery(`
  *[_type == "project" && highlighted == true] | order(order asc) {
    _id,
    title,
    slug,
    year,
    coverImage,
    "series": series->{ _id, title, slug }
  }
`)

// Projecten per serie
export const projectsBySeriesQuery = defineQuery(`
  *[_type == "project" && series->slug.current == $slug] | order(order asc) {
    _id,
    title,
    slug,
    year,
    coverImage,
    highlighted,
    order
  }
`)

// Enkel project op slug
export const projectBySlugQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    year,
    coverImage,
    description,
    images,
    highlighted,
    "series": series->{ _id, title, slug }
  }
`)

// Enkele serie op slug
export const seriesBySlugQuery = defineQuery(`
  *[_type == "projectSeries" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    coverImage
  }
`)

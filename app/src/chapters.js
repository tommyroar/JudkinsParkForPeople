import { Navigation, AlertTriangle, Train, RotateCcw, Trees, MapPin, Octagon } from 'lucide-react'

const ICON_MAP = { Navigation, AlertTriangle, Train, RotateCcw, Trees, MapPin, Octagon }

const modules = import.meta.glob('../chapters/*/content.md', { eager: true })
const photoModules = import.meta.glob('../chapters/**/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const geojsonModules = import.meta.glob('../chapters/**/closure.geojson', { eager: true, query: '?raw', import: 'default' })

export const CHAPTERS = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => {
    const { frontmatter, content } = mod.default
    const chapterDir = path.match(/\/chapters\/([^/]+)\//)?.[1]
    const photos = frontmatter.photos?.map(photo => ({
      ...photo,
      src: photoModules[`../chapters/${chapterDir}/${photo.src}`] ?? photo.src,
    }))
    const rawGeojson = geojsonModules[`../chapters/${chapterDir}/closure.geojson`]
    const closureGeoJSON = rawGeojson ? JSON.parse(rawGeojson) : undefined
    return {
      ...frontmatter,
      icon: frontmatter.icon ? ICON_MAP[frontmatter.icon] : undefined,
      content,
      photos,
      closureGeoJSON,
    }
  })

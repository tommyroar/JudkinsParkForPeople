import { Navigation, AlertTriangle, Train, RotateCcw, Trees, MapPin } from 'lucide-react'

const ICON_MAP = { Navigation, AlertTriangle, Train, RotateCcw, Trees, MapPin }

const modules = import.meta.glob('../chapters/*/content.md', { eager: true })

export const CHAPTERS = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => {
    const { frontmatter, content } = mod.default
    return {
      ...frontmatter,
      icon: frontmatter.icon ? ICON_MAP[frontmatter.icon] : undefined,
      content,
    }
  })

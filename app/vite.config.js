import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ---------------------------------------------------------------------------
// Minimal frontmatter + markdown Vite plugin (no extra dependencies)
// Transforms any .md file into: export default { frontmatter, content }
// ---------------------------------------------------------------------------
function parseValue(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  if (
    (val.startsWith("'") && val.endsWith("'")) ||
    (val.startsWith('"') && val.endsWith('"'))
  ) {
    return val.slice(1, -1)
  }
  const num = Number(val)
  if (!isNaN(num) && val !== '') return num
  return val
}

function parseSimpleYaml(yaml) {
  const result = {}
  const lines = yaml.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const topMatch = line.match(/^(\w+):\s*(.*)$/)
    if (!topMatch) { i++; continue }
    const key = topMatch[1]
    const val = topMatch[2].trim()
    if (val === '') {
      i++
      if (i < lines.length && /^ {2}-/.test(lines[i])) {
        // Array of objects — each item starts with '  -'
        const arr = []
        while (i < lines.length && /^ {2}-/.test(lines[i])) {
          const item = {}
          const inline = lines[i].match(/^ {2}-\s+(\w+):\s*(.+)$/)
          if (inline) item[inline[1]] = parseValue(inline[2].trim())
          i++
          while (i < lines.length && /^ {4}\w+:/.test(lines[i])) {
            const nm = lines[i].match(/^ {4}(\w+):\s*(.+)$/)
            if (nm) item[nm[1]] = parseValue(nm[2].trim())
            i++
          }
          arr.push(item)
        }
        result[key] = arr
      } else {
        // Nested object — consume indented lines
        const nested = {}
        while (i < lines.length && /^\s+\w+:/.test(lines[i])) {
          const nm = lines[i].match(/^\s+(\w+):\s*(.+)$/)
          if (nm) nested[nm[1]] = parseValue(nm[2].trim())
          i++
        }
        result[key] = nested
      }
    } else {
      result[key] = parseValue(val)
      i++
    }
  }
  return result
}

function markdownPlugin() {
  return {
    name: 'vite-plugin-markdown',
    transform(code, id) {
      if (!id.endsWith('.md')) return null
      const match = code.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
      const frontmatter = match ? parseSimpleYaml(match[1]) : {}
      const content = match ? match[2].trim() : code
      return {
        code: `export default ${JSON.stringify({ frontmatter, content })}`,
        map: null,
      }
    },
  }
}
// ---------------------------------------------------------------------------

export default defineConfig({
  plugins: [react(), tailwindcss(), markdownPlugin()],
  server: {
    allowedHosts: ['tommys-mac-mini.tail59a169.ts.net', 'tommys-mac-mini.local'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/?VITE_MAPBOX_ACCESS_TOKEN=pk.test-token-from-url',
      },
    },
  },
})

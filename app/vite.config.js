import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

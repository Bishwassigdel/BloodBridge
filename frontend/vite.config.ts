import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,

    // Proxy backend (VERY IMPORTANT)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    sourcemap: false,      // faster build
    minify: 'esbuild',     // fastest minifier
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
  },
})

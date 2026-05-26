// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Store Vite's pre-bundle cache in a stable location inside the project
  // so it survives between sessions and npm installs don't bust it.
  cacheDir: 'node_modules/.vite',

  // Pre-bundle every heavy dep once at startup.
  // This turns multiple "on-demand transform" calls into a single cached file.
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', 'leaflet', 'react-leaflet',
      '@react-oauth/google',
      // react-icons: pre-bundle all subpaths used in the app
      'react-icons/fa',
      'react-icons/fi',
      'react-icons/md',
      'react-icons/bs',
      'react-icons/hi',
    ],
    // Force re-optimisation when lockfile changes; otherwise use the cache.
    force: false,
  },

  // Server configuration
  server: {
    port: 5173,

    // Proxy API calls to backend (prevents CORS issues in development)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },

    // Don't auto-open the browser — it opens before pre-bundling finishes,
    // causing every dep to be transformed on-demand (slow blank-screen load).
    // Open manually after you see "ready in Xms" in the terminal.
    open: false,

    hmr: {
      clientPort: 5173,
    },

    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    // Sourcemaps only in dev — shipping them to prod adds ~3× bundle size
    sourcemap: false,
    // Warn if any single chunk exceeds 500KB (default is 500KB anyway; being explicit)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor code into named chunks — browsers cache each independently
        // so updating your app code doesn't bust the React/Leaflet cache entry
        manualChunks: {
          // React core — changes almost never
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Map library — large, changes rarely
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // Icon set — large, changes rarely
          'vendor-icons': ['react-icons'],
          // HTTP + auth helpers
          'vendor-utils': ['axios', '@react-oauth/google'],
        },
      },
    },
  },

  // Optional: resolve aliases (makes imports cleaner)
  resolve: {
    alias: {
      '@': '/src',           // you can now import as import Component from '@/components/...'
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@context': '/src/context',
    },
  },

});
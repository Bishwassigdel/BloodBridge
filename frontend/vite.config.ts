// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Server configuration
  server: {
    // Frontend will run on port 5173 (Vite default)
    port: 5173,

    // Proxy API calls to backend (prevents CORS issues in development)
    proxy: {
      // All requests starting with /api will be forwarded to backend
      '/api': {
        target: 'http://localhost:3001',     // your Express backend port
        changeOrigin: true,                  // needed when proxying to different origin
        secure: false,                       // for local http (not https)
        rewrite: (path) => path.replace(/^\/api/, '/api'), // optional - keeps /api prefix
      },
    },

    // Optional: open browser automatically when dev server starts
    open: true,

    // Optional: better HMR (hot module replacement) behavior
    hmr: {
      clientPort: 5173,
    },
  },

  // Optional: build configuration (useful when you run `vite build`)
  build: {
    outDir: 'dist',
    sourcemap: true, // helpful for debugging production builds
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
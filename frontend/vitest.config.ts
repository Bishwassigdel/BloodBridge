// vitest.config.ts — separate from vite.config.ts so the dev server
// does NOT watch extra TypeScript files or reload on test config changes.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.{js,ts,jsx,tsx}'],
    reporters: ['verbose'],
  },
});

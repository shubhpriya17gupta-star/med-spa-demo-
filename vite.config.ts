import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: {
      // Multi-page build: paths resolve from the project root.
      input: {
        main: 'index.html',
        privacy: 'privacy.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});

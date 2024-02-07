/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{js,ts}'],
    includeSource: ['src/**/*.{js,ts}'],
    environment: 'happy-dom',
  },
});

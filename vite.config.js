import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const plugins = [tailwindcss(), sveltekit()];

export default defineConfig({
  plugins: process.env.VITEST ? [...plugins, svelteTesting()] : plugins,

  server: {
    port: 3000,
    host: true,
    open: true,
  },

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
  },
});

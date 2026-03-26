import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';
import cosmosPatientProxy from './scripts/vite-cosmos-proxy.mjs';

export default defineConfig({
  // Root directory is app/ to match your structure
  root: 'app',

  // Build configuration
  build: {
    // Output to dist/ in project root (not inside app/)
    outDir: '../dist',
    emptyOutDir: true,

    // Optimize for tree shaking
    target: 'es2020', // Modern target for better tree shaking
    minify: 'esbuild', // Fast minification

    // Bundle splitting and tree shaking configuration
    rollupOptions: {
      output: {
        // Consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        // Manual chunk configuration for code splitting
        manualChunks(id) {
          // SOAP sections - split these into separate chunks for lazy loading
          if (id.includes('features/soap/subjective/')) {
            return 'soap-subjective';
          }
          if (id.includes('features/soap/objective/')) {
            return 'soap-objective';
          }
          if (id.includes('features/soap/assessment/')) {
            return 'soap-assessment';
          }
          if (id.includes('features/soap/plan/')) {
            return 'soap-plan';
          }
          if (id.includes('features/soap/billing/')) {
            return 'soap-billing';
          }

          // CSS chunk splitting for component-specific styles
          if (id.includes('css/components/')) {
            return 'components-css';
          }
          if (id.includes('css/buttons.css')) {
            return 'ui-css';
          }
          if (id.includes('css/tables.css')) {
            return 'tables-css';
          }
          if (id.includes('css/sidebar.css')) {
            return 'sidebar-css';
          }
        },
      },

      // Enable tree shaking for all modules
      treeshake: {
        moduleSideEffects: false, // Assume no side effects unless explicitly marked
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },

    // Source maps for debugging
    sourcemap: true,

    // Report bundle size
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
  },

  // Plugins
  plugins: [
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),

    // Local dev: serve /api/patients from Cosmos DB directly
    cosmosPatientProxy(),

    // Bundle analyzer - generates stats.html
    visualizer({
      filename: 'dist/stats.html',
      open: false, // Set to true to auto-open after build
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // Use treemap visualization
    }),
  ],

  // CSS configuration
  css: {
    // CSS code splitting and optimization
    postcss: {},
    // Enable CSS code splitting
    codeSplit: true,
    // Preprocess CSS to remove unused styles in production
    preprocessorOptions: {},
  },

  // Optimization
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [],
    // Exclude from pre-bundling (for tree shaking)
    exclude: [],
  },

  // Define global constants for tree shaking
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },

  // Enable tree shaking warnings
  esbuild: {
    treeShaking: true,
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console'] : [],
  },
});

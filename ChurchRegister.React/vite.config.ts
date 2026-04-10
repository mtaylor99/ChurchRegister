import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer
    visualizer({
      filename: 'dist/stats.html',
      open: process.env.NODE_ENV === 'production' ? false : true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@components': path.resolve(dirname, './src/components'),
      '@pages': path.resolve(dirname, './src/pages'),
      '@hooks': path.resolve(dirname, './src/hooks'),
      '@services': path.resolve(dirname, './src/services'),
      '@utils': path.resolve(dirname, './src/utils'),
      '@types': path.resolve(dirname, './src/types'),
      '@contexts': path.resolve(dirname, './src/contexts'),
      '@config': path.resolve(dirname, './src/config'),
      '@validation': path.resolve(dirname, './src/validation'),
      '@test-utils': path.resolve(dirname, './src/test-utils'),
    },
  },
  build: {
    // Bundle optimization
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Large vendor libraries that should be separate

            // MUI X DataGrid (large, separate)
            if (id.includes('@mui/x-data-grid')) {
              return 'mui-datagrid';
            }

            // MUI X Date Pickers
            if (id.includes('@mui/x-date-pickers')) {
              return 'mui-datepickers';
            }

            // MUI Icons (very large, keep separate)
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }

            // Excel generation (large)
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }

            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }

            // Charts library
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }

            // MUI Core, Lab, Emotion, and related (combine to avoid circular deps)
            if (
              id.includes('@mui/material') ||
              id.includes('@mui/system') ||
              id.includes('@mui/utils') ||
              id.includes('@mui/base') ||
              id.includes('@mui/lab') ||
              id.includes('@mui/private-theming') ||
              id.includes('@emotion/') ||
              id.includes('stylis')
            ) {
              return 'mui-core';
            }

            // Form libraries
            if (
              id.includes('react-hook-form') ||
              id.includes('yup') ||
              id.includes('zod') ||
              id.includes('@hookform')
            ) {
              return 'vendor-forms';
            }

            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }

            // HTTP client
            if (id.includes('axios')) {
              return 'vendor-http';
            }

            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }

            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            // React core and common React ecosystem packages
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-is/') ||
              id.includes('scheduler') ||
              id.includes('prop-types') ||
              id.includes('hoist-non-react-statics') ||
              id.includes('@babel/runtime')
            ) {
              return 'vendor-react';
            }

            // Everything else
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    open: process.env.NODE_ENV === 'development',
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: '0.0.0.0',
  },
  define: {
    // Environment variables
    __API_BASE_URL__: JSON.stringify(
      process.env.VITE_API_BASE_URL || 'http://localhost:5502'
    ),
  },
  test: {
    projects: [
      // Main test project for unit and integration tests
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/setupTests.ts'],
          globals: true,
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['src/**/*.stories.{js,ts,jsx,tsx}'],
          // Note: onConsoleLog removed - not supported in Vitest v4
          // MUI anchorEl warnings can be suppressed in setupTests.ts if needed
        },
        define: {
          // Environment variables for tests
          'process.env.VITE_API_BASE_URL': JSON.stringify(
            'http://localhost:5000/api'
          ),
          'process.env.NODE_ENV': JSON.stringify('test'),
        },
      },
      // Storybook tests
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/hooks/**', 'src/utils/**', 'src/services/**'],
      exclude: [
        'src/**/*.stories.*',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/mocks/**',
        'src/test-utils/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});

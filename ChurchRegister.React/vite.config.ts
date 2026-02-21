/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
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
      '@test-utils': path.resolve(dirname, './src/test-utils'),
    },
  },
  build: {
    // Bundle optimization
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            
            // MUI Core
            if (id.includes('@mui/material')) {
              return 'mui-core';
            }
            
            // MUI Icons (separate because it's large)
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            
            // MUI X DataGrid
            if (id.includes('@mui/x-data-grid')) {
              return 'mui-datagrid';
            }
            
            // MUI X Date Pickers
            if (id.includes('@mui/x-date-pickers')) {
              return 'mui-datepickers';
            }
            
            // MUI Lab and Emotion
            if (id.includes('@mui/lab') || id.includes('@emotion')) {
              return 'mui-lab-emotion';
            }
            
            // React Router
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            
            // Charts library
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            
            // Excel generation
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('yup') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            
            // Axios
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            
            // All other node_modules
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
            provider: 'playwright',
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
  },
});

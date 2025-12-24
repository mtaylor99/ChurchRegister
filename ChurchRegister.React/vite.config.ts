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
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    // Bundle optimization
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
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

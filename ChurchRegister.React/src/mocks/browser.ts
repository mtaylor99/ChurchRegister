/**
 * MSW Browser Worker for Development and Storybook
 *
 * This worker runs in the browser and intercepts network requests.
 * Use this in development mode or Storybook to mock API responses.
 *
 * @see https://mswjs.io/docs/integrations/browser
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Setup MSW browser worker for development and Storybook
 *
 * This worker will intercept HTTP requests in the browser and return mock responses.
 * Start it in your app's entry point (main.tsx) or Storybook preview.
 */
export const worker = setupWorker(...handlers);

// Start the worker in development mode
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
  worker
    .start({
      onUnhandledRequest: 'warn',
    })
    .catch((error) => {
      console.error('[MSW] Failed to start service worker:', error);
    });
}

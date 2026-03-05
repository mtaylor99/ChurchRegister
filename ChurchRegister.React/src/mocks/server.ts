/**
 * MSW Server for Node.js Test Environment
 *
 * This server is used in unit tests and integration tests.
 * It runs in Node.js and doesn't require a service worker.
 *
 * @see https://mswjs.io/docs/integrations/node
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Setup MSW server for Node.js test environment
 *
 * This server will intercept HTTP requests in tests and return mock responses.
 * Import this in your test setup file (setupTests.ts).
 */
export const server = setupServer(...handlers);

// Enable request logging in development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  server.events.on('request:start', ({ request }) => {
    console.log('[MSW] Request:', request.method, request.url);
  });
}

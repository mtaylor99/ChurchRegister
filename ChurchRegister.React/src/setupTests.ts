import '@testing-library/jest-dom/vitest';
import { expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Setup environment variables for tests
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    VITE_API_BASE_URL: 'http://localhost:5000/api',
    NODE_ENV: 'test',
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

/**
 * Suppress MUI warnings about anchorEl in tests
 * These warnings occur because MUI Popper/Autocomplete expects proper DOM layout,
 * which isn't fully computed in the test environment. Safe to suppress in tests.
 */
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (
      message.includes('anchorEl') &&
      message.includes('invalid')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (
      message.includes('anchorEl') &&
      message.includes('invalid')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

/**
 * MSW (Mock Service Worker) Setup
 *
 * Establishes API mocking for all tests.
 * - beforeAll: Start the MSW server before all tests
 * - afterEach: Reset handlers to ensure test isolation
 * - afterAll: Clean up and close the server after all tests
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  // Reset any request handlers that are added during tests
  server.resetHandlers();
  // runs a cleanup after each test case (e.g. clearing jsdom)
  cleanup();
});

afterAll(() => {
  server.close();
});

/**
 * Unit tests for HttpInterceptor
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthTokens } from './types';

// Mock tokenService before importing HttpInterceptor
const mockRefreshTokenIfNeeded = vi.hoisted(() => vi.fn());
const mockGetRefreshToken = vi.hoisted(() => vi.fn());

vi.mock('./tokenService', () => ({
  tokenService: {
    refreshTokenIfNeeded: mockRefreshTokenIfNeeded,
    getRefreshToken: mockGetRefreshToken,
  },
}));

import { HttpInterceptor, httpInterceptor } from './httpInterceptor';

const makeTokens = (): AuthTokens => ({
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresIn: 3600,
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 3600 * 1000),
});

const makeOkResponse = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const makeUnauthorizedResponse = () =>
  new Response('Unauthorized', { status: 401 });

const makeForbiddenResponse = () =>
  new Response('Forbidden', { status: 403 });

describe('HttpInterceptor singleton', () => {
  test('getInstance returns the same instance', () => {
    const a = HttpInterceptor.getInstance();
    const b = HttpInterceptor.getInstance();
    expect(a).toBe(b);
  });

  test('exported httpInterceptor is the singleton instance', () => {
    expect(httpInterceptor).toBe(HttpInterceptor.getInstance());
  });
});

describe('HttpInterceptor - clearPendingRequests and getPendingRequestsCount', () => {
  test('getPendingRequestsCount returns 0 initially', () => {
    httpInterceptor.clearPendingRequests();
    expect(httpInterceptor.getPendingRequestsCount()).toBe(0);
  });

  test('clearPendingRequests does not throw', () => {
    expect(() => httpInterceptor.clearPendingRequests()).not.toThrow();
  });
});

describe('HttpInterceptor - fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpInterceptor.clearPendingRequests();
    vi.stubGlobal('fetch', vi.fn());
    mockRefreshTokenIfNeeded.mockResolvedValue(makeTokens());
    mockGetRefreshToken.mockReturnValue('refresh-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('makes a successful request with authorization header', async () => {
    vi.mocked(fetch).mockResolvedValue(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data');

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-access-token');
  });

  test('does not add Authorization header when no token', async () => {
    mockRefreshTokenIfNeeded.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data');

    expect(response.ok).toBe(true);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  test('includes credentials in request', async () => {
    vi.mocked(fetch).mockResolvedValue(makeOkResponse());

    await httpInterceptor.fetch('https://api.example.com/data');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  test('retries on 401 and retries the request', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeUnauthorizedResponse())
      .mockResolvedValueOnce(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data', {}, 1);

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('retries on 403 response', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeForbiddenResponse())
      .mockResolvedValueOnce(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data', {}, 1);

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('returns 401 response when no retries left', async () => {
    vi.mocked(fetch).mockResolvedValue(makeUnauthorizedResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data', {}, 0);

    expect(response.status).toBe(401);
  });

  test('deduplicates concurrent identical requests', async () => {
    let resolveFirst: (value: Response) => void;
    const firstPromise = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(firstPromise);

    // Start two identical requests concurrently
    const p1 = httpInterceptor.fetch('https://api.example.com/data');
    const p2 = httpInterceptor.fetch('https://api.example.com/data');

    resolveFirst!(makeOkResponse());

    const [r1, r2] = await Promise.all([p1, p2]);

    // Both should get the same response (deduplication)
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    // fetch should only be called once (deduplication)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('throws on network error with no retries', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      httpInterceptor.fetch('https://api.example.com/data', {}, 0)
    ).rejects.toThrow('Failed to fetch');
  });

  test('retries on network error when retries are available', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data', {}, 1);

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('throws after exhausting all retries', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      httpInterceptor.fetch('https://api.example.com/data', {}, 1)
    ).rejects.toThrow();
  });

  test('handles fetch with URL object', async () => {
    vi.mocked(fetch).mockResolvedValue(makeOkResponse());

    const response = await httpInterceptor.fetch(new URL('https://api.example.com/data'));

    expect(response.ok).toBe(true);
  });

  test('handles request with method and body', async () => {
    vi.mocked(fetch).mockResolvedValue(makeOkResponse());

    const response = await httpInterceptor.fetch(
      'https://api.example.com/data',
      { method: 'POST', body: JSON.stringify({ key: 'value' }) }
    );

    expect(response.ok).toBe(true);
  });

  test('force refresh when token is not available after 401', async () => {
    mockGetRefreshToken.mockReturnValue(null); // No refresh token
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeUnauthorizedResponse())
      .mockResolvedValueOnce(makeOkResponse());

    const response = await httpInterceptor.fetch('https://api.example.com/data', {}, 1);

    // Should still proceed with second attempt
    expect(response.ok).toBe(true);
  });
});

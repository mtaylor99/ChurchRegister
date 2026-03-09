/**
 * Unit tests for ApiClient
 *
 * Strategy: mock axios.create() so the instance returned to ApiClient's
 * constructor is fully under test control. Captured interceptor handlers
 * are extracted via vi.hoisted so they can be called directly in tests.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Capture axios-instance and interceptor callbacks before module load ─────

const {
  mockAxiosInstance,
  getRequestInterceptors,
  getResponseInterceptors,
} = vi.hoisted(() => {
  let reqFulfilled: ((c: unknown) => unknown) | null = null;
  let reqRejected: ((e: unknown) => unknown) | null = null;
  let resFulfilled: ((r: unknown) => unknown) | null = null;
  let resRejected: ((e: unknown) => Promise<unknown>) | null = null;

  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((f: (c: unknown) => unknown, r: (e: unknown) => unknown) => {
          reqFulfilled = f;
          reqRejected = r;
          return 0;
        }),
      },
      response: {
        use: vi.fn(
          (f: (r: unknown) => unknown, r: (e: unknown) => Promise<unknown>) => {
            resFulfilled = f;
            resRejected = r;
            return 0;
          }
        ),
      },
    },
  };

  return {
    mockAxiosInstance: instance,
    getRequestInterceptors: () => ({ fulfill: reqFulfilled!, reject: reqRejected! }),
    getResponseInterceptors: () => ({ fulfill: resFulfilled!, reject: resRejected! }),
  };
});

vi.mock('axios', () => ({
  default: { create: vi.fn(() => mockAxiosInstance) },
}));

// ─── Dependency mocks ─────────────────────────────────────────────────────────

const mockGetAccessToken = vi.hoisted(() => vi.fn<() => string | null>().mockReturnValue(null));
const mockClearTokens = vi.hoisted(() => vi.fn());

vi.mock('../auth/tokenService', () => ({
  tokenService: {
    getAccessToken: mockGetAccessToken,
    clearTokens: mockClearTokens,
  },
}));

const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());
const mockShowWarning = vi.hoisted(() => vi.fn());

vi.mock('../../utils', () => ({
  logger: { info: mockLoggerInfo, debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
  notificationManager: { showError: mockShowError, showWarning: mockShowWarning },
}));

vi.mock('../../config/env', () => ({
  env: {
    VITE_API_BASE_URL: 'http://test.api.com',
    VITE_API_TIMEOUT: 5000,
    VITE_DEBUG_MODE: false,
    VITE_AUTH_TOKEN_KEY: 'test_token',
    VITE_AUTH_REFRESH_KEY: 'test_refresh',
    VITE_NODE_ENV: 'test',
    VITE_ENABLE_DEVTOOLS: false,
    VITE_ENABLE_STORYBOOK: false,
    VITE_ENABLE_MSW: false,
    VITE_DEBUG_AUTH: false,
    VITE_LOG_LEVEL: 'error',
  },
}));

// Import after mocks are registered
import { apiClient } from './ApiClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAxiosResponse(data: unknown, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: { method: 'GET', url: '/test' },
  };
}

function makeAxiosError(status: number, message?: string) {
  return {
    response: {
      status,
      data: message ? { message } : {},
      headers: {},
      config: { method: 'GET', url: '/test' },
    },
    message: message ?? 'Error',
    isAxiosError: true,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApiClient — request interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('injects Authorization header when token is present', () => {
    mockGetAccessToken.mockReturnValue('my-access-token');
    const config = { headers: { set: vi.fn(), Authorization: undefined } };

    const { fulfill } = getRequestInterceptors();
    const result = fulfill(config) as typeof config;

    expect(result.headers.Authorization).toBe('Bearer my-access-token');
  });

  test('does not set Authorization header when no token', () => {
    mockGetAccessToken.mockReturnValue(null);
    const config = { headers: {} };

    const { fulfill } = getRequestInterceptors();
    const result = fulfill(config) as typeof config;

    expect((result.headers as Record<string, unknown>).Authorization).toBeUndefined();
  });

  test('request interceptor rejection passes error through', async () => {
    const error = new Error('Request setup failed');
    const { reject } = getRequestInterceptors();

    await expect(reject(error)).rejects.toThrow('Request setup failed');
  });
});

describe('ApiClient — response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue(null);
  });

  test('passes through successful responses', () => {
    const response = makeAxiosResponse({ id: 1 });
    const { fulfill } = getResponseInterceptors();

    const result = fulfill(response);

    expect(result).toBe(response);
  });

  test('does not log when VITE_DEBUG_MODE is false (default)', () => {
    const response = makeAxiosResponse({ id: 1 });
    const { fulfill } = getResponseInterceptors();

    fulfill(response);

    expect(mockLoggerInfo).not.toHaveBeenCalled();
  });

  test('shows network error notification when no response on error', async () => {
    const error = { message: 'Network Error', isAxiosError: true };
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith(
      'Network error. Please check your connection.'
    );
  });

  test('redirects to /error/unauthorized on 401', async () => {
    // 401 without data.message hits switch default then redirects
    const error = makeAxiosError(401);
    const { reject } = getResponseInterceptors();

    try {
      await reject(error);
    } catch {
      // expected to reject
    }

    expect(window.location.href).toContain('/error/unauthorized');
  });

  test('passes data.message directly to showError when present', async () => {
    const error = makeAxiosError(503, 'Service temporarily unavailable');
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith('Service temporarily unavailable');
  });

  test('shows 409 conflict as warning when data.message is present', async () => {
    const error = makeAxiosError(409, 'Duplicate record detected');
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowWarning).toHaveBeenCalledWith('Duplicate record detected');
    expect(mockShowError).not.toHaveBeenCalled();
  });

  test('does NOT show toast for 400 validation errors', async () => {
    const error = makeAxiosError(400, 'Name is required');
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  test('shows server error notification on 500 (no message)', async () => {
    const error = makeAxiosError(500);
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith(
      'A server error occurred. Please try again later.'
    );
  });

  test('shows not found notification on 404 (no message)', async () => {
    const error = makeAxiosError(404);
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith(
      'The requested resource was not found.'
    );
  });

  test('shows permission notification on 403 (no message)', async () => {
    const error = makeAxiosError(403);
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith(
      'You do not have permission to perform this action.'
    );
  });

  test('shows generic notification on unexpected status (no message)', async () => {
    const error = makeAxiosError(418);
    const { reject } = getResponseInterceptors();

    await expect(reject(error)).rejects.toBeDefined();
    expect(mockShowError).toHaveBeenCalledWith('An unexpected error occurred.');
  });
});

describe('ApiClient — HTTP methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('get() calls axios.get with URL and returns response.data', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce(makeAxiosResponse({ name: 'test' }));

    const result = await apiClient.get<{ name: string }>('/api/test');

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/test', undefined);
    expect(result).toEqual({ name: 'test' });
  });

  test('post() calls axios.post with URL, body, and returns response.data', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce(makeAxiosResponse({ id: 99 }));

    const result = await apiClient.post<{ id: number }>('/api/items', { title: 'New' });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/items', { title: 'New' }, undefined);
    expect(result).toEqual({ id: 99 });
  });

  test('put() calls axios.put with URL, body, and returns response.data', async () => {
    mockAxiosInstance.put.mockResolvedValueOnce(makeAxiosResponse({ id: 1, title: 'Updated' }));

    const result = await apiClient.put<{ id: number; title: string }>(
      '/api/items/1',
      { title: 'Updated' }
    );

    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/items/1', { title: 'Updated' }, undefined);
    expect(result).toEqual({ id: 1, title: 'Updated' });
  });

  test('patch() calls axios.patch with URL, body, and returns response.data', async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce(makeAxiosResponse({ id: 2 }));

    const result = await apiClient.patch<{ id: number }>('/api/items/2', { active: false });

    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/api/items/2', { active: false }, undefined);
    expect(result).toEqual({ id: 2 });
  });

  test('delete() calls axios.delete with URL and returns response.data', async () => {
    mockAxiosInstance.delete.mockResolvedValueOnce(makeAxiosResponse({ success: true }));

    const result = await apiClient.delete<{ success: boolean }>('/api/items/3');

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/items/3', undefined);
    expect(result).toEqual({ success: true });
  });
});

describe('ApiClient — utility methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('isAuthenticated() returns true when token exists', () => {
    mockGetAccessToken.mockReturnValue('valid-token');
    expect(apiClient.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated() returns false when no token', () => {
    mockGetAccessToken.mockReturnValue(null);
    expect(apiClient.isAuthenticated()).toBe(false);
  });

  test('getBaseUrl() returns the configured API base URL', () => {
    expect(apiClient.getBaseUrl()).toBe('http://test.api.com');
  });

  test('getToken() returns the current access token', () => {
    mockGetAccessToken.mockReturnValue('abc123');
    expect(apiClient.getToken()).toBe('abc123');
  });

  test('clearToken() calls tokenService.clearTokens', () => {
    apiClient.clearToken();
    expect(mockClearTokens).toHaveBeenCalled();
  });
});

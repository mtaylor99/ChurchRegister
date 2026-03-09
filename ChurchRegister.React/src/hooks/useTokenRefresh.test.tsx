/**
 * Unit tests for useTokenRefresh hook
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AuthTokens } from '../services/auth/types';

// Hoisted mocks
const mockAddRefreshListener = vi.hoisted(() => vi.fn());
const mockIsCurrentlyRefreshing = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockSetupAutoRefresh = vi.hoisted(() => vi.fn().mockReturnValue(() => {}));
const mockRefreshTokenIfNeeded = vi.hoisted(() => vi.fn());
const mockGetTokens = vi.hoisted(() => vi.fn());
const mockHasToken = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockIsTokenValid = vi.hoisted(() => vi.fn().mockReturnValue(true));
const mockWillExpireSoon = vi.hoisted(() => vi.fn().mockReturnValue(false));

vi.mock('../services/auth/tokenService', () => ({
  tokenService: {
    addRefreshListener: mockAddRefreshListener,
    isCurrentlyRefreshing: mockIsCurrentlyRefreshing,
    setupAutoRefresh: mockSetupAutoRefresh,
    refreshTokenIfNeeded: mockRefreshTokenIfNeeded,
    getTokens: mockGetTokens,
    hasToken: mockHasToken,
    isTokenValid: mockIsTokenValid,
    willExpireSoon: mockWillExpireSoon,
  },
}));

import { useTokenRefresh } from './useTokenRefresh';

const makeTokens = (): AuthTokens => ({
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresIn: 3600,
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 3600 * 1000),
});

describe('useTokenRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddRefreshListener.mockReturnValue(() => {});
    mockSetupAutoRefresh.mockReturnValue(() => {});
    mockIsCurrentlyRefreshing.mockReturnValue(false);
    mockHasToken.mockReturnValue(false);
    mockIsTokenValid.mockReturnValue(true);
    mockWillExpireSoon.mockReturnValue(false);
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useTokenRefresh());

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.lastRefresh).toBeNull();
    expect(result.current.refreshCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  test('returns action functions', () => {
    const { result } = renderHook(() => useTokenRefresh());

    expect(typeof result.current.refreshNow).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.getTokenInfo).toBe('function');
    expect(typeof result.current.needsRefresh).toBe('function');
    expect(typeof result.current.hasToken).toBe('function');
  });

  test('getTokenInfo returns null when no tokens', () => {
    mockGetTokens.mockReturnValue(null);
    const { result } = renderHook(() => useTokenRefresh());

    const info = result.current.getTokenInfo();
    expect(info).toBeNull();
  });

  test('getTokenInfo returns token details when tokens exist', () => {
    const tokens = makeTokens();
    mockGetTokens.mockReturnValue(tokens);
    mockIsTokenValid.mockReturnValue(true);
    mockWillExpireSoon.mockReturnValue(false);

    const { result } = renderHook(() => useTokenRefresh());
    const info = result.current.getTokenInfo();

    expect(info).not.toBeNull();
    expect(info?.expiresAt).toEqual(tokens.expiresAt);
    expect(info?.isValid).toBe(true);
    expect(info?.willExpireSoon).toBe(false);
  });

  test('needsRefresh returns false when no token', () => {
    mockHasToken.mockReturnValue(false);
    const { result } = renderHook(() => useTokenRefresh());
    expect(result.current.needsRefresh()).toBe(false);
  });

  test('needsRefresh returns true when token invalid', () => {
    mockHasToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(false);
    mockWillExpireSoon.mockReturnValue(false);

    const { result } = renderHook(() => useTokenRefresh());
    expect(result.current.needsRefresh()).toBe(true);
  });

  test('needsRefresh returns true when token will expire soon', () => {
    mockHasToken.mockReturnValue(true);
    mockIsTokenValid.mockReturnValue(true);
    mockWillExpireSoon.mockReturnValue(true);

    const { result } = renderHook(() => useTokenRefresh());
    expect(result.current.needsRefresh()).toBe(true);
  });

  test('clearError resets error to null', async () => {
    // Force an error via failed refreshNow
    mockRefreshTokenIfNeeded.mockRejectedValue(new Error('Refresh failed'));

    const { result } = renderHook(() => useTokenRefresh());

    // Try refresh to get an error state
    try {
      await act(async () => {
        await result.current.refreshNow();
      });
    } catch {
      // Expected error
    }

    act(() => {
      result.current.clearError();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  test('refreshNow calls refreshTokenIfNeeded and returns tokens', async () => {
    const tokens = makeTokens();
    mockRefreshTokenIfNeeded.mockResolvedValue(tokens);

    const { result } = renderHook(() => useTokenRefresh());
    let returned: AuthTokens | null = null;

    await act(async () => {
      returned = await result.current.refreshNow();
    });

    expect(mockRefreshTokenIfNeeded).toHaveBeenCalled();
    expect(returned).toEqual(tokens);
  });

  test('refreshNow throws and sets error on failure', async () => {
    mockRefreshTokenIfNeeded.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTokenRefresh());

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.refreshNow();
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect((thrownError as Error | null)?.message).toBe('Network error');
    expect(result.current.error).toBe('Network error');
  });

  test('listener update sets lastRefresh and increments refreshCount on success', async () => {
    const tokens = makeTokens();
    let capturedListener: ((tokens: AuthTokens | null) => void) | null = null;

    mockAddRefreshListener.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });

    const { result } = renderHook(() => useTokenRefresh());

    await act(async () => {
      capturedListener?.(tokens);
    });

    await waitFor(() => {
      expect(result.current.refreshCount).toBe(1);
      expect(result.current.lastRefresh).not.toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  test('listener update sets error on null tokens (failed refresh)', async () => {
    let capturedListener: ((tokens: AuthTokens | null) => void) | null = null;

    mockAddRefreshListener.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });

    const { result } = renderHook(() => useTokenRefresh());

    await act(async () => {
      capturedListener?.(null);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Token refresh failed');
    });
  });

  test('calls onRefreshSuccess callback when tokens are returned', async () => {
    const tokens = makeTokens();
    let capturedListener: ((tokens: AuthTokens | null) => void) | null = null;

    mockAddRefreshListener.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });

    const onRefreshSuccess = vi.fn();
    renderHook(() => useTokenRefresh({ onRefreshSuccess }));

    await act(async () => {
      capturedListener?.(tokens);
    });

    await waitFor(() => {
      expect(onRefreshSuccess).toHaveBeenCalledWith(tokens);
    });
  });

  test('calls onRefreshError callback when refresh fails', async () => {
    let capturedListener: ((tokens: AuthTokens | null) => void) | null = null;

    mockAddRefreshListener.mockImplementation((listener) => {
      capturedListener = listener;
      return () => {};
    });

    const onRefreshError = vi.fn();
    renderHook(() => useTokenRefresh({ onRefreshError }));

    await act(async () => {
      capturedListener?.(null);
    });

    await waitFor(() => {
      expect(onRefreshError).toHaveBeenCalled();
    });
  });
});

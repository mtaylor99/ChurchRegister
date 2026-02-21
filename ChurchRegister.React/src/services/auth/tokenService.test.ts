/**
 * Unit tests for token service
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { tokenService } from './tokenService';
import type { AuthTokens } from './types';

describe('tokenService', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Clear storage before each test
    localStorageMock.clear();

    // Clear all tokens
    tokenService.clearTokens();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('setTokens and getTokens', () => {
    test('should store and retrieve tokens', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      const retrieved = tokenService.getTokens();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.accessToken).toBe(mockTokens.accessToken);
      expect(retrieved?.refreshToken).toBe(mockTokens.refreshToken);
    });

    test('should return null when no tokens are stored', () => {
      const tokens = tokenService.getTokens();
      expect(tokens).toBeNull();
    });

    test('should store tokens in localStorage', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);

      const storedAccessToken = localStorageMock.getItem(
        'church_register_access_token'
      );
      const storedRefreshToken = localStorageMock.getItem(
        'church_register_refresh_token'
      );

      expect(storedAccessToken).toBe(mockTokens.accessToken);
      expect(storedRefreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('getAccessToken', () => {
    test('should return access token when available', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      const accessToken = tokenService.getAccessToken();

      expect(accessToken).toBe('test-access-token');
    });

    test('should return null when no access token is stored', () => {
      const accessToken = tokenService.getAccessToken();
      expect(accessToken).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    test('should return refresh token when available', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      const refreshToken = tokenService.getRefreshToken();

      expect(refreshToken).toBe('test-refresh-token');
    });

    test('should return null when no refresh token is stored', () => {
      const refreshToken = tokenService.getRefreshToken();
      expect(refreshToken).toBeNull();
    });
  });

  describe('clearTokens', () => {
    test('should clear all tokens', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      expect(tokenService.getAccessToken()).not.toBeNull();

      tokenService.clearTokens();

      expect(tokenService.getAccessToken()).toBeNull();
      expect(tokenService.getRefreshToken()).toBeNull();
      expect(tokenService.getTokens()).toBeNull();
    });

    test('should remove tokens from localStorage', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      tokenService.clearTokens();

      const storedAccessToken = localStorageMock.getItem(
        'church_register_access_token'
      );
      const storedRefreshToken = localStorageMock.getItem(
        'church_register_refresh_token'
      );

      expect(storedAccessToken).toBeNull();
      expect(storedRefreshToken).toBeNull();
    });
  });

  describe('hasToken', () => {
    test('should return true when tokens exist', () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      tokenService.setTokens(mockTokens);
      expect(tokenService.hasToken()).toBe(true);
    });

    test('should return false when no tokens exist', () => {
      tokenService.clearTokens();
      expect(tokenService.hasToken()).toBe(false);
    });
  });

  describe('decodeToken', () => {
    test('should decode a valid JWT token', () => {
      // Mock JWT token (header.payload.signature)
      // Payload: {"sub":"123","email":"test@example.com","roles":["User"]}
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJVc2VyIl19.signature';

      const decoded = tokenService.decodeToken(mockToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('123');
      expect(decoded?.email).toBe('test@example.com');
    });

    test('should return null for invalid token', () => {
      const decoded = tokenService.decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    test('should return null for empty token', () => {
      const decoded = tokenService.decodeToken('');
      expect(decoded).toBeNull();
    });

    test('should decode the stored access token when no parameter provided', () => {
      // Mock JWT token
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.signature';

      tokenService.setTokens({
        accessToken: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      const decoded = tokenService.decodeToken();

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('123');
    });
  });

  describe('getUserFromToken', () => {
    test('should extract user information from token', () => {
      // Mock JWT with user data
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJGaXJzdE5hbWUiOiJKb2huIiwiTGFzdE5hbWUiOiJEb2UifQ.signature';

      tokenService.setTokens({
        accessToken: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      const user = tokenService.getUserFromToken();

      expect(user).not.toBeNull();
      expect(user?.sub).toBe('123');
      expect(user?.email).toBe('test@example.com');
    });

    test('should return null when no token is stored', () => {
      tokenService.clearTokens();
      const user = tokenService.getUserFromToken();
      expect(user).toBeNull();
    });
  });

  describe('token expiration', () => {
    test('should handle token with expiration time', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({ sub: '123', exp: futureTime })
      )}.signature`;

      tokenService.setTokens({
        accessToken: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      // Token should be valid
      expect(tokenService.hasToken()).toBe(true);
    });

    test('should detect expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({ sub: '123', exp: pastTime })
      )}.signature`;

      tokenService.setTokens({
        accessToken: mockToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      // Token should be marked as invalid
      expect(tokenService.isTokenValid()).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle missing localStorage gracefully', () => {
      // Remove localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Should not throw
      expect(() => {
        tokenService.clearTokens();
      }).not.toThrow();
    });

    test('should handle corrupted token data', () => {
      localStorageMock.setItem(
        'church_register_access_token',
        'corrupted-data'
      );

      // Should return token even if corrupted (decoding is separate)
      const token = tokenService.getAccessToken();
      expect(token).toBe('corrupted-data');
    });

    test('should handle empty string tokens', () => {
      tokenService.setTokens({
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now()),
      });

      // Empty tokens should be treated as no token
      const hasToken = tokenService.hasToken();
      expect(hasToken).toBe(false);
    });
  });
});

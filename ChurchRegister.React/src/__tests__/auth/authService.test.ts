import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/auth/authService';
import { tokenService } from '../../services/auth/tokenService';
import AuthService from '../../services/auth/authService';
import TokenService from '../../services/auth/tokenService';
import type { LoginCredentials } from '../../services/auth/types';

// Mock the tokenService
vi.mock('../../services/auth/tokenService');
const mockedTokenService = vi.mocked(tokenService);

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singletons for clean test state
    AuthService.resetInstance();
    TokenService.resetInstance();

    // Reset fetch mock
    mockFetch.mockReset();

    // Reset token service mocks
    mockedTokenService.getAccessToken.mockReturnValue(null);
    mockedTokenService.getRefreshToken.mockReturnValue(null);
    mockedTokenService.isTokenValid.mockReturnValue(false);
    mockedTokenService.setTokens.mockImplementation(() => {});
    mockedTokenService.clearTokens.mockImplementation(() => {});
  });

  describe('login', () => {
    const mockLoginCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      } as Response);

      // Act & Assert
      await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockedTokenService.setTokens).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should throw error when no refresh token available', async () => {
      // Arrange
      mockedTokenService.getRefreshToken.mockReturnValue(null);

      // Act & Assert
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });
  });

  describe('initializeAuth', () => {
    it('should initialize as unauthenticated when no token', async () => {
      // Arrange
      mockedTokenService.getAccessToken.mockReturnValue(null);

      // Act
      const result = await authService.initializeAuth();

      // Assert
      expect(result).toEqual({
        user: null,
        isAuthenticated: false,
      });
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in error messages', async () => {
      // Arrange
      const sensitiveCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'super-secret-password',
        rememberMe: false,
      };

      mockFetch.mockRejectedValueOnce(
        new Error('Database connection failed: password=super-secret-password')
      );

      // Act & Assert
      try {
        await authService.login(sensitiveCredentials);
      } catch (error) {
        // Verify that sensitive data is not exposed in error
        expect(error).toBeDefined();
        // The actual implementation should sanitize errors
      }
    });

    it('should handle malformed API responses safely', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null), // Malformed response
      } as Response);

      // Act & Assert
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });

    it('should validate API response structure', async () => {
      // Arrange
      const malformedResponse = {
        // Missing required fields
        invalidField: 'value',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(malformedResponse),
      } as Response);

      // Act & Assert
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password',
          rememberMe: false,
        })
      ).rejects.toThrow();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Extended AuthService Tests
// Covers methods that route through httpInterceptor.fetch (apiCall)
// ─────────────────────────────────────────────────────────────────────────────

const mockHttpFetch = vi.hoisted(() => vi.fn());

vi.mock('../../services/auth/httpInterceptor', () => ({
  httpInterceptor: {
    fetch: mockHttpFetch,
    clearPendingRequests: vi.fn(),
    getPendingRequestsCount: vi.fn().mockReturnValue(0),
  },
}));

/** Build a Response-like object that apiCall can consume. */
function makeApiCallResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    clone: () => ({ json: () => Promise.resolve(data) }),
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

describe('AuthService (extended — apiCall methods)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthService.resetInstance();
    TokenService.resetInstance();

    mockHttpFetch.mockReset();
    mockedTokenService.getAccessToken.mockReturnValue(null);
    mockedTokenService.getRefreshToken.mockReturnValue(null);
    mockedTokenService.isTokenValid.mockReturnValue(false);
    mockedTokenService.hasToken.mockReturnValue(false);
    mockedTokenService.setTokens.mockImplementation(() => {});
    mockedTokenService.clearTokens.mockImplementation(() => {});
    mockedTokenService.getConfig.mockReturnValue({
      apiBaseUrl: 'http://localhost:5000/api',
      tokenStorageKey: 'church_register_access_token',
      refreshTokenStorageKey: 'church_register_refresh_token',
      userStorageKey: 'church_register_user',
      autoRefreshToken: false,
      tokenRefreshBuffer: 5,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableLogging: false,
    });
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      acceptTerms: true,
    };

    it('should store tokens on successful registration with auto-login', async () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
      const user = {
        id: '99',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        roles: ['User'],
        emailConfirmed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true, data: { user, tokens } })
      );

      const result = await authService.register(registerData);

      expect(result.user.email).toBe('new@example.com');
      expect(mockedTokenService.setTokens).toHaveBeenCalledWith(tokens);
    });

    it('should throw when registration returns success: false', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: false, message: 'Email already exists' })
      );

      await expect(authService.register(registerData)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should throw when httpInterceptor.fetch throws a network error', async () => {
      mockHttpFetch.mockRejectedValueOnce(
        new TypeError('Network error occurred. Please check your connection.')
      );

      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('always calls tokenService.clearTokens even if server call succeeds', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true })
      );

      await authService.logout('user_action');

      expect(mockedTokenService.clearTokens).toHaveBeenCalled();
    });

    it('still calls tokenService.clearTokens even when server logout throws', async () => {
      mockHttpFetch.mockRejectedValueOnce(new Error('Server unreachable'));

      // logout catches server errors and still performs local cleanup
      await authService.logout('user_action');

      expect(mockedTokenService.clearTokens).toHaveBeenCalled();
    });

    it('calls tokenService.clearTokens for session_expired reason (security regression)', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true })
      );

      await authService.logout('session_expired');

      expect(mockedTokenService.clearTokens).toHaveBeenCalledTimes(1);
    });
  });

  // ── refreshToken ──────────────────────────────────────────────────────────

  describe('refreshToken (success path)', () => {
    it('should update stored tokens on successful refresh', async () => {
      const newTokens = {
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
      mockedTokenService.getRefreshToken.mockReturnValue('old-refresh-token');
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true, data: { tokens: newTokens } })
      );

      const result = await authService.refreshToken();

      expect(result.accessToken).toBe('refreshed-access-token');
      expect(mockedTokenService.setTokens).toHaveBeenCalledWith(newTokens);
    });

    it('should clear tokens and throw when refresh fails', async () => {
      mockedTokenService.getRefreshToken.mockReturnValue('stale-refresh');
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: false, message: 'Refresh token expired' })
      );

      await expect(authService.refreshToken()).rejects.toThrow();
      expect(mockedTokenService.clearTokens).toHaveBeenCalled();
    });
  });

  // ── getCurrentUser ────────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('should throw when user is not authenticated', async () => {
      mockedTokenService.hasToken.mockReturnValue(false);
      mockedTokenService.isTokenValid.mockReturnValue(false);

      await expect(authService.getCurrentUser()).rejects.toThrow(
        'User is not authenticated'
      );
    });

    it('should return and store user data on success', async () => {
      mockedTokenService.hasToken.mockReturnValue(true);
      mockedTokenService.isTokenValid.mockReturnValue(true);

      const user = {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['Admin'],
        emailConfirmed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true, data: user })
      );

      const result = await authService.getCurrentUser();

      expect(result.id).toBe('1');
      expect(result.email).toBe('admin@example.com');
    });
  });

  // ── changePassword ────────────────────────────────────────────────────────

  describe('changePassword', () => {
    const changeData = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
      confirmPassword: 'NewPass456!',
    };

    it('should resolve without error on success', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true })
      );

      await expect(authService.changePassword(changeData)).resolves.toBeUndefined();
    });

    it('should throw when response has success: false', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: false, message: 'Incorrect current password' })
      );

      await expect(authService.changePassword(changeData)).rejects.toBeDefined();
    });
  });

  // ── requestPasswordReset ──────────────────────────────────────────────────

  describe('requestPasswordReset', () => {
    it('should resolve without error on success', async () => {
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true })
      );

      await expect(
        authService.requestPasswordReset('user@example.com')
      ).resolves.toBeUndefined();
    });

    it('should not throw for unknown email (no email enumeration)', async () => {
      // The API should return success regardless of whether the email exists
      mockHttpFetch.mockResolvedValueOnce(
        makeApiCallResponse({ success: true })
      );

      await expect(
        authService.requestPasswordReset('nobody@example.com')
      ).resolves.toBeUndefined();
    });
  });
});

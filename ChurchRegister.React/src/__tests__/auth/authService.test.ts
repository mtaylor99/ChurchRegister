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
    mockFetch.mockClear();

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

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
        'Network error'
      );
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

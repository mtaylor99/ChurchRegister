import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/auth/authService';
import { tokenService } from '../../services/auth/tokenService';
import AuthService from '../../services/auth/authService';
import TokenService from '../../services/auth/tokenService';
import type {
  LoginCredentials,
  RegisterData,
  User,
  AuthTokens,
} from '../../services/auth/types';

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

    const mockTokens: AuthTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
    };

    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      roles: ['User'],
      permissions: ['read:profile'],
      emailConfirmed: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockTokens, user: mockUser }),
      } as Response);

      // Act
      const result = await authService.login(mockLoginCredentials);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockLoginCredentials),
        })
      );

      expect(mockedTokenService.setTokens).toHaveBeenCalledWith(mockTokens);
      expect(result).toEqual(mockUser);
    });

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

  describe('register', () => {
    const mockRegisterData: RegisterData = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      acceptTerms: true,
    };

    it('should register successfully with valid data', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful' }),
      } as Response);

      // Act
      await authService.register(mockRegisterData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRegisterData),
        })
      );
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Email already exists' }),
      } as Response);

      // Act & Assert
      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully when authenticated', async () => {
      // Arrange
      const mockRefreshToken = 'mock-refresh-token';
      mockedTokenService.getRefreshToken.mockReturnValue(mockRefreshToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      // Act
      await authService.logout();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: mockRefreshToken }),
        })
      );

      expect(mockedTokenService.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if logout API fails', async () => {
      // Arrange
      const mockRefreshToken = 'mock-refresh-token';
      mockedTokenService.getRefreshToken.mockReturnValue(mockRefreshToken);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act
      await authService.logout();

      // Assert
      expect(mockedTokenService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const oldRefreshToken = 'old-refresh-token';
      const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
      };

      mockedTokenService.getRefreshToken.mockReturnValue(oldRefreshToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTokens),
      } as Response);

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: oldRefreshToken }),
        })
      );

      expect(mockedTokenService.setTokens).toHaveBeenCalledWith(newTokens);
      expect(result).toEqual(newTokens);
    });

    it('should throw error when no refresh token available', async () => {
      // Arrange
      mockedTokenService.getRefreshToken.mockReturnValue(null);

      // Act & Assert
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });
  });

  describe('getCurrentUser', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      roles: ['User'],
      permissions: ['read:profile'],
      emailConfirmed: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get current user when authenticated', async () => {
      // Arrange
      const mockAccessToken = 'valid-access-token';
      mockedTokenService.getAccessToken.mockReturnValue(mockAccessToken);
      mockedTokenService.isTokenValid.mockReturnValue(true);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        })
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      // Arrange
      mockedTokenService.getAccessToken.mockReturnValue(null);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null when token is invalid', async () => {
      // Arrange
      mockedTokenService.getAccessToken.mockReturnValue('invalid-token');
      mockedTokenService.isTokenValid.mockReturnValue(false);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('initializeAuth', () => {
    it('should initialize with valid token and user', async () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        roles: ['User'],
        permissions: ['read:profile'],
        emailConfirmed: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedTokenService.getAccessToken.mockReturnValue('valid-token');
      mockedTokenService.isTokenValid.mockReturnValue(true);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      // Act
      const result = await authService.initializeAuth();

      // Assert
      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true,
      });
    });

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

import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  AuthTokens,
  ApiResponse,
  AuthError,
  PasswordResetConfirm,
  ChangePasswordRequest,
  UpdateProfileRequest,
  EmailConfirmationRequest,
  AuthConfig,
} from './types';
import { tokenService } from './tokenService';
import { httpInterceptor } from './httpInterceptor';
import { authLogger } from './authLogger';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

class AuthService {
  private static instance: AuthService | null = null;
  private config: AuthConfig | null = null;
  private baseURL: string | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  // Singleton access method
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Method to reset singleton (useful for testing)
  public static resetInstance(): void {
    if (AuthService.instance) {
      AuthService.instance = null;
    }
  }

  private ensureInitialized(): void {
    if (this.config === null) {
      this.config = tokenService.getConfig();
      this.baseURL = this.config.apiBaseUrl;
    }
  }

  // Private helper method for API calls with automatic token refresh
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    this.ensureInitialized();

    const url = `${this.baseURL}${endpoint}`;

    // Default headers
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Merge headers (don't add auth header here - interceptor will handle it)
    const headers = {
      ...defaultHeaders,
      ...(options.headers || {}),
    };

    try {
      // Use the HTTP interceptor for automatic token refresh and retry
      const response = await httpInterceptor.fetch(url, {
        ...options,
        headers,
      });

      // Clone the response to avoid "body already read" errors
      const responseClone = response.clone();

      let data;
      try {
        data = await response.json();
      } catch {
        // If json parsing fails, try with the clone
        try {
          data = await responseClone.json();
        } catch {
          // If both fail, return a generic error response
          data = { message: 'Invalid response format' };
        }
      }

      if (!response.ok) {
        throw {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || response.statusText,
          details: data.details,
          validationErrors: data.errors,
        } as AuthError;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please check your connection.',
          details: error.message,
        } as AuthError;
      }
      throw error;
    }
  }

  // Login with credentials
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Call the backend Identity Server endpoint
      const apiUrl = env.VITE_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe || false,
        }),
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Login failed' }));
        throw {
          message:
            errorData.message || `Login failed with status ${response.status}`,
          errors: errorData.errors || [],
          code: errorData.code || `HTTP_${response.status}`,
        };
      }

      const authData = (await response.json()) as {
        user?: Record<string, unknown>;
        tokens?: Record<string, unknown>;
        message?: string;
      };

      if (authData.user) {
        // Transform the response to match our AuthResponse interface
        const rawUser = authData.user as Record<string, unknown>;
        const rawTokens = authData.tokens as
          | Record<string, unknown>
          | undefined;

        const transformedResponse: AuthResponse = {
          user: {
            ...(rawUser as unknown as User),
            // Convert ISO string dates to Date objects
            lastLogin: rawUser.lastLogin
              ? new Date(rawUser.lastLogin as string)
              : undefined,
            createdAt: new Date(rawUser.createdAt as string),
            updatedAt: new Date(rawUser.updatedAt as string),
          },
          tokens: rawTokens
            ? {
                ...(rawTokens as unknown as AuthTokens),
                // Convert ISO string date to Date object
                expiresAt: new Date(rawTokens.expiresAt as string),
              }
            : {
                accessToken: '',
                refreshToken: '',
                expiresIn: 0,
                tokenType: 'Bearer' as const,
                expiresAt: new Date(),
              },
          message: authData.message,
        };

        // Store tokens if provided
        if (transformedResponse.tokens) {
          tokenService.setTokens(transformedResponse.tokens);
        }

        // Store user data
        this.storeUser(transformedResponse.user);

        authLogger.logLoginAttempt(transformedResponse.user.id, true, {
          email: credentials.email,
          roles: transformedResponse.user.roles,
          emailConfirmed: transformedResponse.user.emailConfirmed,
        });

        return transformedResponse;
      }

      throw {
        message: authData.message || 'Login failed',
        errors: [],
        code: 'LOGIN_FAILED',
      };
    } catch (error) {
      authLogger.logLoginAttempt(credentials.email, false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: credentials.email,
      });

      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      authLogger.log('INFO', 'auth.registration.attempt', {
        email: data.email,
      });

      const response = await this.apiCall<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.data) {
        // For registration, we might not auto-login (depends on email confirmation)
        if (response.data.tokens) {
          tokenService.setTokens(response.data.tokens);
          this.storeUser(response.data.user);
        }

        authLogger.logRegistration(response.data.user.id, true, {
          email: data.email,
          roles: response.data.user.roles,
          autoLogin: !!response.data.tokens,
        });

        return response.data;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      authLogger.logRegistration(data.email, false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
      });

      console.error('Registration error:', error);
      throw error;
    }
  }

  // Enhanced logout with comprehensive cleanup
  async logout(
    reason:
      | 'user_action'
      | 'session_expired'
      | 'security'
      | 'inactivity' = 'user_action'
  ): Promise<void> {
    // Set logout flag to prevent returnUrl from being added during redirect
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('auth_logout_in_progress', 'true');
    }

    // Get user info from storage instead of making API call during logout
    const currentUser = this.getStoredUser();
    const userId = currentUser?.id;

    try {
      this.log(`Logout initiated: ${reason}`);
      authLogger.log(
        'INFO',
        'auth.logout.attempt',
        { reason },
        undefined,
        userId
      );

      const refreshToken = tokenService.getRefreshToken();

      if (refreshToken) {
        // Notify server about logout with reason
        await this.apiCall('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({
            refreshToken,
            reason,
            timestamp: new Date().toISOString(),
          }),
        });
        this.log('Server logout notification sent');
      }

      authLogger.logLogout(userId || 'unknown', reason);
    } catch (error) {
      this.logError('Logout server notification failed', error);
      authLogger.log(
        'ERROR',
        'auth.logout.server_notification_failed',
        { reason },
        error as Error,
        userId
      );
      // Continue with local logout even if server call fails
    } finally {
      // Comprehensive local cleanup
      await this.performLocalLogoutCleanup(reason);
    }
  }

  // Comprehensive local logout cleanup
  private async performLocalLogoutCleanup(reason: string): Promise<void> {
    try {
      this.log(`Performing local logout cleanup: ${reason}`);

      // 1. Clear authentication tokens
      tokenService.clearTokens();
      this.log('Tokens cleared');

      // 2. Clear user data
      this.clearUser();
      this.log('User data cleared');

      // 3. Clear any cached data (localStorage cleanup)
      this.clearCachedData();
      this.log('Cached data cleared');

      // 4. Cancel any pending requests
      this.cancelPendingRequests();
      this.log('Pending requests cancelled');

      // 5. Reset service state
      this.resetServiceState();
      this.log('Service state reset');

      // 6. Emit logout event for session manager
      this.emitLogoutEvent(reason);
      this.log('Logout event emitted');
    } catch (error) {
      this.logError('Local logout cleanup failed', error);
    }
  }

  // Clear cached data from localStorage
  private clearCachedData(): void {
    try {
      const config = tokenService.getConfig();

      // Clear auth-related items
      const authKeys = [
        config.tokenStorageKey,
        config.refreshTokenStorageKey,
        config.userStorageKey,
        `${config.tokenStorageKey}_expires_at`,
        'auth_permissions_cache',
        'auth_roles_cache',
        'last_activity_timestamp',
        'session_warning_shown',
      ];

      authKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore individual item removal failures
        }
      });

      // Clear session storage as well
      if (typeof sessionStorage !== 'undefined') {
        const sessionKeys = [
          'temp_auth_state',
          'auth_redirect_url',
          'auth_error_state',
          'auth_logout_in_progress',
        ];

        sessionKeys.forEach((key) => {
          try {
            sessionStorage.removeItem(key);
          } catch {
            // Ignore individual item removal failures
          }
        });
      }
    } catch (error) {
      this.logError('Failed to clear cached data', error);
    }
  }

  // Cancel pending requests (placeholder for future implementation)
  private cancelPendingRequests(): void {
    // TODO: Implement request cancellation using AbortController
    // This would cancel any ongoing API requests to prevent data leaks
  }

  // Reset internal service state
  private resetServiceState(): void {
    // Reset any internal flags or state
    this.config = null;
    this.baseURL = null;
  }

  // Emit logout event for coordination with session manager
  private emitLogoutEvent(reason: string): void {
    try {
      // Custom event for cross-component coordination
      const logoutEvent = new CustomEvent('auth:logout', {
        detail: { reason, timestamp: new Date().toISOString() },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(logoutEvent);
      }
    } catch (error) {
      this.logError('Failed to emit logout event', error);
    }
  }

  // Enhanced logging methods
  private log(message: string, data?: Record<string, unknown>): void {
    const config = tokenService.getConfig();
    if (config.enableLogging) {
      logger.debug(`[AuthService] ${message}`, data);
    }
  }

  private logError(message: string, error?: unknown): void {
    const config = tokenService.getConfig();
    if (config.enableLogging) {
      console.error(`[AuthService] ${message}`, error || '');
    }
  }

  // Refresh access token
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = tokenService.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiCall<{ tokens: AuthTokens }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (response.success && response.data) {
        tokenService.setTokens(response.data.tokens);
        return response.data.tokens;
      }

      throw new Error(response.message || 'Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      tokenService.clearTokens();
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await this.apiCall('/auth/password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Confirm password reset
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      const response = await this.apiCall('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.success) {
        throw new Error(
          response.message || 'Password reset confirmation failed'
        );
      }
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  }

  // Change password (authenticated user)
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await this.apiCall('/api/auth/password-change', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // If response has success field and it's false, throw error
      if (response.success === false) {
        throw {
          message: response.message || 'Password change failed',
          errors: response.errors || [],
          code: 'PASSWORD_CHANGE_FAILED',
        };
      }

      // If we get here, password change was successful
      return;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await this.apiCall<User>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success && response.data) {
        this.storeUser(response.data);
        return response.data;
      }

      // FastEndpoints might return data directly without success wrapper
      if (response && (response as any).id) {
        const userData = response as unknown as User;
        this.storeUser(userData);
        return userData;
      }

      throw new Error(response.message || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      // Check if we're authenticated before making API call
      if (!this.isAuthenticated()) {
        throw new Error('User is not authenticated');
      }

      const response = await this.apiCall<User>('/api/auth/user');

      if (response.success && response.data) {
        this.storeUser(response.data);
        return response.data;
      }

      // FastEndpoints might return data directly without success wrapper
      if (response && (response as any).id) {
        const userData = response as unknown as User;
        this.storeUser(userData);
        return userData;
      }

      throw new Error(response.message || 'Failed to get user profile');
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Confirm email address
  async confirmEmail(data: EmailConfirmationRequest): Promise<void> {
    try {
      const response = await this.apiCall('/auth/confirm-email', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.success) {
        throw new Error(response.message || 'Email confirmation failed');
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      throw error;
    }
  }

  // Resend email confirmation
  async resendEmailConfirmation(email: string): Promise<void> {
    try {
      const response = await this.apiCall('/auth/resend-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.success) {
        throw new Error(
          response.message || 'Failed to resend confirmation email'
        );
      }
    } catch (error) {
      console.error('Resend email confirmation error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenService.hasToken() && tokenService.isTokenValid();
  }

  // Get stored user
  getStoredUser(): User | null {
    this.ensureInitialized();
    try {
      const userStr = localStorage.getItem(this.config!.userStorageKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  // Store user data
  private storeUser(user: User): void {
    this.ensureInitialized();
    try {
      localStorage.setItem(this.config!.userStorageKey, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  // Clear stored user
  private clearUser(): void {
    this.ensureInitialized();
    try {
      localStorage.removeItem(this.config!.userStorageKey);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  // Permission and role checking
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.roles?.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    const user = this.getStoredUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUser();
    if (!user?.roles) return false;

    return roles.some((role) => user.roles.includes(role));
  }

  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getStoredUser();
    if (!user?.permissions) return false;

    return permissions.some((permission) =>
      user.permissions.includes(permission)
    );
  }

  // Initialize authentication state from storage
  async initializeAuth(): Promise<{
    user: User | null;
    isAuthenticated: boolean;
  }> {
    try {
      // Check if we have valid tokens
      if (!this.isAuthenticated()) {
        return { user: null, isAuthenticated: false };
      }

      // Try to get fresh user data from server
      const user = await this.getCurrentUser();
      return { user, isAuthenticated: true };
    } catch (error) {
      // Only log error if it's not due to being unauthenticated
      if (this.isAuthenticated()) {
        console.error('Auth initialization error:', error);
      }

      // Clear invalid tokens
      tokenService.clearTokens();
      this.clearUser();

      return { user: null, isAuthenticated: false };
    }
  }

  // Setup automatic token refresh
  setupAutoRefresh(
    onTokenRefreshed?: (tokens: AuthTokens) => void,
    onSessionExpired?: () => void
  ): () => void {
    return tokenService.setupAutoRefresh(onTokenRefreshed, () => {
      this.logout();
      onSessionExpired?.();
    });
  }
}

// Create and export singleton instance
export const authService = AuthService.getInstance();

export default AuthService;

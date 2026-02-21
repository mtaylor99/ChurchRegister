import type { AuthTokens, JwtPayload, AuthConfig } from './types';
import { authLogger } from './authLogger';
import { logger } from '../../utils/logger';

// Type declaration for Vite build-time replacements
declare const __API_BASE_URL__: string;

// Enhanced environment variable handling with proper initialization
const getApiBaseUrl = (): string => {
  // Test environment handling
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.process?.env?.NODE_ENV === 'test'
  ) {
    return 'http://localhost:5000/api';
  }

  // Production browser environment
  if (typeof window !== 'undefined') {
    // Try Vite build-time replacement first (most reliable for production)
    try {
      if (typeof __API_BASE_URL__ !== 'undefined' && __API_BASE_URL__) {
        return __API_BASE_URL__;
      }
    } catch {
      // __API_BASE_URL__ not available, continue to other methods
    }

    // Try runtime environment variables (Vite injects these)
    if (
      typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_API_BASE_URL
    ) {
      return import.meta.env.VITE_API_BASE_URL;
    }
  }

  // Node.js environment (for SSR or development)
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }

  // Development fallback
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    return 'http://localhost:5502'; // Match development API port
  }

  // Production fallback
  return 'https://api.churchregister.com';
};

// Environment configuration helper
const getEnvironmentConfig = () => {
  const isTest =
    (typeof globalThis !== 'undefined' &&
      globalThis.process?.env?.NODE_ENV === 'test') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');

  const isDevelopment =
    (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

  const isProduction = !isTest && !isDevelopment;

  return {
    isTest,
    isDevelopment,
    isProduction,
    apiBaseUrl: getApiBaseUrl(),
    enableLogging: isDevelopment || isTest,
  };
};

// Default configuration with enhanced environment handling
const createDefaultConfig = (): AuthConfig => {
  const env = getEnvironmentConfig();

  return {
    apiBaseUrl: env.apiBaseUrl,
    tokenStorageKey:
      import.meta.env?.VITE_AUTH_TOKEN_KEY || 'church_register_access_token',
    refreshTokenStorageKey:
      import.meta.env?.VITE_AUTH_REFRESH_KEY || 'church_register_refresh_token',
    userStorageKey: 'church_register_user',
    autoRefreshToken: true,
    tokenRefreshBuffer: 5, // Refresh 5 minutes before expiry
    sessionTimeout: 480, // 8 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    enableLogging: env.enableLogging,
  };
};

// Initialize default configuration
const defaultConfig: AuthConfig = createDefaultConfig();

class TokenService {
  private static instance: TokenService | null = null;
  private config: AuthConfig;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private refreshTimeoutId: NodeJS.Timeout | null = null;
  private refreshListeners: Set<(tokens: AuthTokens | null) => void> =
    new Set();
  private isRefreshing = false;

  private constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Start automatic refresh monitoring
    this.scheduleNextRefresh();
  }

  // Singleton access method
  public static getInstance(config: Partial<AuthConfig> = {}): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService(config);
    } else if (Object.keys(config).length > 0) {
      // Allow configuration updates on existing instance
      TokenService.instance.updateConfig(config);
    }
    return TokenService.instance;
  }

  // Method to reset singleton (useful for testing)
  public static resetInstance(): void {
    if (TokenService.instance) {
      // Clean up any pending refreshes
      TokenService.instance.cleanup();
      TokenService.instance = null;
    }
  }

  // Clean up method for proper resource management
  private cleanup(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    this.refreshListeners.clear();
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  // Enhanced token storage with automatic refresh scheduling
  setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.config.tokenStorageKey, tokens.accessToken);
      localStorage.setItem(
        this.config.refreshTokenStorageKey,
        tokens.refreshToken
      );

      // Handle both expiresAt (absolute date) and expiresIn (seconds from now)
      let expirationTime: Date;
      if (tokens.expiresAt) {
        // If we have an absolute expiration date, use it
        expirationTime = new Date(tokens.expiresAt);
      } else {
        // Fall back to calculating from expiresIn seconds
        expirationTime = new Date(Date.now() + tokens.expiresIn * 1000);
      }

      localStorage.setItem(
        `${this.config.tokenStorageKey}_expires_at`,
        expirationTime.toISOString()
      );

      authLogger.log('INFO', 'auth.token.set', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresAt: expirationTime.toISOString(),
        tokenLength: tokens.accessToken.length,
      });

      // Schedule the next automatic refresh
      this.scheduleNextRefresh();
    } catch (error) {
      authLogger.log('ERROR', 'auth.token.set_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to store authentication tokens');
    }
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.config.tokenStorageKey);
    } catch {
      return null;
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.config.refreshTokenStorageKey);
    } catch {
      return null;
    }
  }

  // Get all stored tokens
  getTokens(): AuthTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAtStr = localStorage.getItem(
      `${this.config.tokenStorageKey}_expires_at`
    );

    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null;
    }

    const expiresAt = new Date(expiresAtStr);
    const expiresIn = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      expiresAt,
    };
  }

  // Clear all tokens and cleanup
  clearTokens(): void {
    try {
      localStorage.removeItem(this.config.tokenStorageKey);
      localStorage.removeItem(this.config.refreshTokenStorageKey);
      localStorage.removeItem(`${this.config.tokenStorageKey}_expires_at`);
      localStorage.removeItem(this.config.userStorageKey);

      // Cancel any pending refresh
      if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }

      authLogger.log('INFO', 'auth.token.clear', {
        message: 'Authentication tokens cleared successfully',
      });
    } catch (error) {
      authLogger.log('WARN', 'auth.token.clear_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Ignore cleanup errors
    }
  }

  // Check if token exists
  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  // Check if token is valid (not expired)
  isTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) {
      logger.debug('TokenService: No tokens found');
      return false;
    }

    const now = Date.now();
    const expiryTime = tokens.expiresAt.getTime();
    const isValid = now < expiryTime;

    logger.debug('TokenService: Token validation', {
      now: new Date(now).toISOString(),
      expiresAt: tokens.expiresAt.toISOString(),
      isValid,
      timeUntilExpiry: Math.floor((expiryTime - now) / 1000) + ' seconds',
    });

    return isValid;
  }

  // Check if token will expire soon
  willExpireSoon(bufferMinutes?: number): boolean {
    const tokens = this.getTokens();
    if (!tokens) return true;

    const buffer =
      (bufferMinutes ?? this.config.tokenRefreshBuffer) * 60 * 1000;
    return Date.now() + buffer >= tokens.expiresAt.getTime();
  }

  // Decode JWT token (without verification - for client-side info only)
  decodeToken(token?: string): JwtPayload | null {
    const tokenToDecoded = token || this.getAccessToken();
    if (!tokenToDecoded) return null;

    try {
      const payload = tokenToDecoded.split('.')[1];
      if (!payload) return null;

      // Decode base64url
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      // Token decoding failed - return null
      return null;
    }
  }

  // Get user information from token
  getUserFromToken(): Partial<JwtPayload> | null {
    const payload = this.decodeToken();
    if (!payload) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUserFromToken();
    return user?.roles?.includes(role) ?? false;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.getUserFromToken();
    return user?.permissions?.includes(permission) ?? false;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUserFromToken();
    if (!user?.roles) return false;

    return roles.some((role) => user.roles!.includes(role));
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getUserFromToken();
    if (!user?.permissions) return false;

    return permissions.some((permission) =>
      user.permissions!.includes(permission)
    );
  }

  // Enhanced token refresh with race condition prevention and retry logic
  async refreshTokenIfNeeded(): Promise<AuthTokens | null> {
    if (!this.hasToken()) {
      return null;
    }

    // If token is still valid and not expiring soon, return current tokens
    if (this.isTokenValid() && !this.willExpireSoon()) {
      const tokens = this.getTokens();
      return tokens;
    }

    // If refresh is already in progress, wait for it to complete
    if (this.refreshPromise) {
      try {
        return await this.refreshPromise;
      } catch {
        return null;
      }
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // Start the refresh process
    this.isRefreshing = true;

    try {
      // Create refresh promise with retry logic
      this.refreshPromise = this.performTokenRefreshWithRetry(refreshToken);
      const newTokens = await this.refreshPromise;

      this.setTokens(newTokens);

      // Notify all listeners of successful refresh
      this.notifyRefreshListeners(newTokens);

      // Schedule the next refresh check
      this.scheduleNextRefresh();

      authLogger.log('INFO', 'auth.token.refresh_success', {
        message: 'Token refreshed successfully',
      });

      return newTokens;
    } catch (error) {
      authLogger.log('ERROR', 'auth.token.refresh_failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Notify listeners of failed refresh
      this.notifyRefreshListeners(null);

      // Clear invalid tokens
      this.clearTokens();
      return null;
    } finally {
      this.refreshPromise = null;
      this.isRefreshing = false;
    }
  }

  // Enhanced refresh with retry logic and exponential backoff
  private async performTokenRefreshWithRetry(
    refreshToken: string,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<AuthTokens> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performTokenRefresh(refreshToken);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors (e.g., invalid refresh token)
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Token refresh failed after all retries');
  }

  // Check if an error should not be retried
  private isNonRetryableError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';

    // Don't retry on authentication errors or invalid tokens
    return (
      errorMessage.includes('invalid') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden')
    );
  }

  // Simple delay utility
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Schedule the next automatic refresh check
  private scheduleNextRefresh(): void {
    // Clear any existing timeout
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }

    if (!this.config.autoRefreshToken) {
      return;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      return;
    }

    // Calculate when to check next (a bit before the buffer time)
    const bufferMs = this.config.tokenRefreshBuffer * 60 * 1000;
    const checkBeforeBuffer = 30 * 1000; // Check 30 seconds before buffer time
    const timeUntilCheck = Math.max(
      60000, // Minimum 1 minute
      tokens.expiresAt.getTime() - Date.now() - bufferMs - checkBeforeBuffer
    );

    this.refreshTimeoutId = setTimeout(() => {
      this.refreshTokenIfNeeded().catch(() => {});
    }, timeUntilCheck);
  }
  addRefreshListener(
    listener: (tokens: AuthTokens | null) => void
  ): () => void {
    this.refreshListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.refreshListeners.delete(listener);
    };
  }

  // Notify all refresh listeners
  private notifyRefreshListeners(tokens: AuthTokens | null): void {
    this.refreshListeners.forEach((listener) => {
      try {
        listener(tokens);
      } catch {
        // Ignore listener errors to prevent breaking other listeners
      }
    });
  }

  // Check if currently refreshing
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  // Perform the actual token refresh API call
  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.config.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresIn: data.data.expiresIn,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + data.data.expiresIn * 1000),
    };
  }

  // Get authorization header
  getAuthorizationHeader(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Setup automatic token refresh with enhanced monitoring
  setupAutoRefresh(
    onTokenRefreshed?: (tokens: AuthTokens) => void,
    onRefreshFailed?: () => void
  ): () => void {
    if (!this.config.autoRefreshToken) {
      return () => {}; // No-op cleanup function
    }

    // Add refresh listeners if callbacks provided
    const unsubscribeFunctions: (() => void)[] = [];

    if (onTokenRefreshed || onRefreshFailed) {
      const unsubscribe = this.addRefreshListener((tokens) => {
        if (tokens && onTokenRefreshed) {
          onTokenRefreshed(tokens);
        } else if (!tokens && onRefreshFailed) {
          onRefreshFailed();
        }
      });
      unsubscribeFunctions.push(unsubscribe);
    }

    // Start the automatic refresh scheduling
    this.scheduleNextRefresh();

    // Return comprehensive cleanup function
    return () => {
      // Unsubscribe from refresh listeners
      unsubscribeFunctions.forEach((unsub) => unsub());

      // Cancel scheduled refresh
      if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }
    };
  }

  // Update configuration
  updateConfig(config: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): Readonly<AuthConfig> {
    return { ...this.config };
  }
}

// Create and export singleton instance
export const tokenService = TokenService.getInstance();

export default TokenService;

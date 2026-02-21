import { tokenService } from './tokenService';
import type { AuthTokens } from './types';

/**
 * HTTP Interceptor for automatic token refresh and request retry
 * Prevents race conditions when multiple API calls need token refresh
 */
export class HttpInterceptor {
  private static instance: HttpInterceptor | null = null;
  private pendingRequests: Map<string, Promise<Response>> = new Map();

  private constructor() {}

  public static getInstance(): HttpInterceptor {
    if (!HttpInterceptor.instance) {
      HttpInterceptor.instance = new HttpInterceptor();
    }
    return HttpInterceptor.instance;
  }

  /**
   * Enhanced fetch with automatic token refresh and retry logic
   */
  async fetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
    maxRetries = 1
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();

    // Create a unique key for this request to prevent duplicates
    const requestKey = this.createRequestKey(url, init);

    // If the same request is already pending, return the existing promise
    if (this.pendingRequests.has(requestKey)) {
      const existingRequest = this.pendingRequests.get(requestKey)!;

      return existingRequest;
    }

    // Create the request promise
    const requestPromise = this.performRequestWithRetry(
      input,
      init,
      maxRetries
    );

    // Store the promise to prevent duplicate requests
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Perform request with automatic retry on authentication failure
   */
  private async performRequestWithRetry(
    input: RequestInfo | URL,
    init: RequestInit,
    maxRetries: number
  ): Promise<Response> {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Ensure we have a valid token before making the request
        const tokens = await this.ensureValidToken();

        // Add authorization headers
        const requestInit = await this.addSecurityHeaders(init, tokens);

        const response = await fetch(input, requestInit);

        // If the request succeeded or failed with non-auth error, return it
        if (response.ok || !this.isAuthenticationError(response)) {
          return response;
        }

        // If it's an authentication error and we have retries left, refresh token
        if (attempt < maxRetries) {
          // Force token refresh
          await this.forceTokenRefresh();
          attempt++;
          continue;
        }

        // No more retries, return the failed response
        return response;
      } catch (error) {
        // If it's a network error and we have retries left, try again
        if (attempt < maxRetries && this.isNetworkError(error)) {
          attempt++;
          await this.delay(1000 * attempt); // Progressive delay
          continue;
        }

        // Re-throw the error if no more retries
        throw error;
      }
    }

    throw new Error('Request failed after all retry attempts');
  }

  /**
   * Ensure we have a valid token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<AuthTokens | null> {
    try {
      return await tokenService.refreshTokenIfNeeded();
    } catch {
      // Token refresh failed
      return null;
    }
  }

  /**
   * Force a token refresh (used after auth failures)
   */
  private async forceTokenRefresh(): Promise<AuthTokens | null> {
    try {
      // Clear the current token to force a refresh
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        // Clear access token but keep refresh token
        const accessTokenKey = tokenService.getConfig().tokenStorageKey;
        localStorage.removeItem(accessTokenKey);
        localStorage.removeItem(`${accessTokenKey}_expires_at`);

        // Now refresh
        return await tokenService.refreshTokenIfNeeded();
      }
      return null;
    } catch {
      // Force refresh failed
      return null;
    }
  }

  /**
   * Add authorization headers to requests
   */
  private async addSecurityHeaders(
    init: RequestInit,
    tokens: AuthTokens | null
  ): Promise<RequestInit> {
    const headers = new Headers(init.headers);
    // Add authorization header if we have a token
    if (tokens) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }

    return {
      ...init,
      headers,
    };
  }

  /**
   * Check if response indicates an authentication error
   */
  private isAuthenticationError(response: Response): boolean {
    return response.status === 401 || response.status === 403;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  /**
   * Create a unique key for request deduplication
   */
  private createRequestKey(url: string, init: RequestInit): string {
    const method = init.method || 'GET';
    const body = typeof init.body === 'string' ? init.body : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests (useful for debugging)
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }
}

// Create and export singleton instance
export const httpInterceptor = HttpInterceptor.getInstance();

export default HttpInterceptor;

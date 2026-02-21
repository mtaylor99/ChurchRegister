import { tokenService } from './tokenService';
import type { AuthTokens } from './types';

// Session event types
export type SessionEvent =
  | 'token_refreshed'
  | 'session_expired'
  | 'session_warning'
  | 'logout_required'
  | 'inactivity_detected'
  | 'multiple_tabs_detected';

// Session callback function type
export type SessionCallback = (event: SessionEvent, data?: unknown) => void;

// Session configuration
export interface SessionConfig {
  warningTimeBeforeExpiry: number; // Minutes before expiry to show warning
  autoLogoutOnExpiry: boolean;
  trackUserActivity: boolean;
  inactivityTimeoutMinutes: number;
  enableMultiTabSync: boolean;
  enableAutoRefresh: boolean;
  refreshIntervalMinutes: number;
}

// Default session configuration
const defaultSessionConfig: SessionConfig = {
  warningTimeBeforeExpiry: 5, // 5 minutes warning
  autoLogoutOnExpiry: true,
  trackUserActivity: true,
  inactivityTimeoutMinutes: 30, // 30 minutes inactivity
  enableMultiTabSync: false, // Disabled for now
  enableAutoRefresh: true,
  refreshIntervalMinutes: 5, // Check every 5 minutes
};

/**
 * Advanced session management system with automatic token refresh,
 * inactivity detection, and multi-tab synchronization
 */
class SessionManager {
  private static instance: SessionManager | null = null;
  private config: SessionConfig;
  private callbacks: Set<SessionCallback> = new Set();
  private refreshInterval?: number;
  private inactivityTimeout?: number;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;
  private warningShown: boolean = false;
  private cleanupFunctions: (() => void)[] = [];

  private constructor(config?: Partial<SessionConfig>) {
    this.config = { ...defaultSessionConfig, ...config };
    this.setupEventListeners();
  }

  // Singleton access method
  public static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    } else if (config && Object.keys(config).length > 0) {
      // Allow configuration updates on existing instance
      SessionManager.instance.updateConfig(config);
    }
    return SessionManager.instance;
  }

  // Method to reset singleton (useful for testing)
  public static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.stop();
      SessionManager.instance = null;
    }
  }

  /**
   * Start the session manager
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.lastActivity = Date.now();
    this.warningShown = false;

    // Setup automatic token refresh
    if (this.config.enableAutoRefresh) {
      this.setupAutoRefresh();
    }

    // Setup inactivity tracking
    if (this.config.trackUserActivity) {
      this.setupInactivityTracking();
    }

    // Setup multi-tab synchronization
    if (this.config.enableMultiTabSync) {
      this.setupMultiTabSync();
    }
  }

  /**
   * Stop the session manager and cleanup
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Clear intervals
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = undefined;
    }

    // Run cleanup functions safely
    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    });
    this.cleanupFunctions = [];

    // Clear callbacks
    this.callbacks.clear();

    // Reset state
    this.lastActivity = Date.now();
    this.warningShown = false;
  }

  /**
   * Add a callback for session events
   */
  addCallback(callback: SessionCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Emit a session event to all callbacks
   */
  private emit(event: SessionEvent, data?: unknown): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in session callback:', error);
      }
    });
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    const refreshIntervalMs = this.config.refreshIntervalMinutes * 60 * 1000;

    this.refreshInterval = window.setInterval(async () => {
      if (!this.isActive) return;

      try {
        await this.checkAndRefreshToken();
      } catch (error) {
        console.error('Error during automatic token refresh:', error);
      }
    }, refreshIntervalMs);

    this.cleanupFunctions.push(() => {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    });
  }

  /**
   * Check token status and refresh if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    if (!tokenService.hasToken()) {
      if (this.isActive) {
        this.emit('session_expired');
        this.handleSessionExpired();
      }
      return;
    }

    // Check if token will expire soon
    const minutesUntilExpiry = this.getMinutesUntilExpiry();

    if (minutesUntilExpiry <= 0) {
      // Token has expired
      this.emit('session_expired');
      this.handleSessionExpired();
      return;
    }

    if (
      minutesUntilExpiry <= this.config.warningTimeBeforeExpiry &&
      !this.warningShown
    ) {
      // Show warning before expiry
      this.warningShown = true;
      this.emit('session_warning', { minutesUntilExpiry });
    }

    // Try to refresh token if it will expire soon
    if (minutesUntilExpiry <= this.config.warningTimeBeforeExpiry * 2) {
      try {
        const newTokens = await tokenService.refreshTokenIfNeeded();
        if (newTokens) {
          this.warningShown = false; // Reset warning flag
          this.emit('token_refreshed', newTokens as AuthTokens);
        }
      } catch (error) {
        console.error('Error checking token validity:', error);
        this.emit('session_expired');
        this.handleSessionExpired();
      }
    }
  }

  /**
   * Get minutes until token expiry
   */
  private getMinutesUntilExpiry(): number {
    const tokens = tokenService.getTokens();
    if (!tokens) return 0;

    const now = Date.now();
    const expiryTime = tokens.expiresAt.getTime();
    const msUntilExpiry = expiryTime - now;

    return Math.floor(msUntilExpiry / (1000 * 60));
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpired(): void {
    if (this.config.autoLogoutOnExpiry) {
      this.logout();
    }
  }

  /**
   * Setup user activity tracking
   */
  private setupInactivityTracking(): void {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.resetInactivityTimeout();
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup function
    this.cleanupFunctions.push(() => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    });

    // Start inactivity timeout
    this.resetInactivityTimeout();
  }

  /**
   * Reset the inactivity timeout
   */
  private resetInactivityTimeout(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    const timeoutMs = this.config.inactivityTimeoutMinutes * 60 * 1000;

    this.inactivityTimeout = window.setTimeout(() => {
      if (this.isActive) {
        this.emit('inactivity_detected');
        this.handleInactivity();
      }
    }, timeoutMs);
  }

  /**
   * Handle user inactivity
   */
  private handleInactivity(): void {
    this.emit('logout_required', { reason: 'inactivity' });
  }

  /**
   * Setup multi-tab synchronization
   */
  private setupMultiTabSync(): void {
    // Use localStorage events to sync between tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === tokenService.getConfig().tokenStorageKey) {
        if (event.newValue === null) {
          // Token was removed in another tab
          this.emit('logout_required', { reason: 'logout_in_other_tab' });
        } else if (event.oldValue !== event.newValue) {
          // Token was updated in another tab
          this.emit('token_refreshed');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    this.cleanupFunctions.push(() => {
      window.removeEventListener('storage', handleStorageChange);
    });
  }

  /**
   * Setup general event listeners
   */
  private setupEventListeners(): void {
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        // Page became visible, check token status
        this.checkAndRefreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });

    // Handle beforeunload for cleanup
    const handleBeforeUnload = () => {
      this.stop();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    this.cleanupFunctions.push(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }

  /**
   * Force logout
   */
  logout(): void {
    this.stop();
    tokenService.clearTokens();
    this.emit('logout_required', { reason: 'forced_logout' });
  }

  /**
   * Get current session status
   */
  getSessionStatus(): {
    isActive: boolean;
    hasValidToken: boolean;
    minutesUntilExpiry: number;
    lastActivity: Date;
    minutesSinceActivity: number;
  } {
    const now = Date.now();

    return {
      isActive: this.isActive,
      hasValidToken: tokenService.hasToken() && tokenService.isTokenValid(),
      minutesUntilExpiry: this.getMinutesUntilExpiry(),
      lastActivity: new Date(this.lastActivity),
      minutesSinceActivity: Math.floor((now - this.lastActivity) / (1000 * 60)),
    };
  }

  /**
   * Update session configuration
   */
  updateConfig(config: Partial<SessionConfig>): void {
    const wasActive = this.isActive;

    if (wasActive) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (wasActive) {
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<SessionConfig> {
    return { ...this.config };
  }
}

// Create and export singleton instance
export const sessionManager = SessionManager.getInstance();

export default SessionManager;

/**
 * Authentication Logger
 * Handles logging for authentication events, security monitoring, and debugging
 */

import { logger } from '../../utils/logger';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface AuthLogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

export interface LoginAttemptData {
  email?: string;
  roles?: string[];
  emailConfirmed?: boolean;
  error?: string;
  ip?: string;
  userAgent?: string;
}

export interface RegistrationData {
  email?: string;
  roles?: string[];
  autoLogin?: boolean;
  error?: string;
  ip?: string;
  userAgent?: string;
}

class AuthLogger {
  private static instance: AuthLogger | null = null;
  private logs: AuthLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries
  private enableConsoleLogging = true;
  private enableRemoteLogging = false;
  private remoteEndpoint?: string;

  private constructor() {
    // Private constructor for singleton
    this.enableConsoleLogging = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  /**
   * Configure the logger
   */
  configure(options: {
    enableConsoleLogging?: boolean;
    enableRemoteLogging?: boolean;
    remoteEndpoint?: string;
    maxLogs?: number;
  }): void {
    this.enableConsoleLogging =
      options.enableConsoleLogging ?? this.enableConsoleLogging;
    this.enableRemoteLogging =
      options.enableRemoteLogging ?? this.enableRemoteLogging;
    this.remoteEndpoint = options.remoteEndpoint ?? this.remoteEndpoint;
    this.maxLogs = options.maxLogs ?? this.maxLogs;
  }

  /**
   * Generic log method
   */
  log(
    level: LogLevel,
    event: string,
    metadata?: Record<string, unknown>,
    error?: Error,
    userId?: string
  ): void {
    const logEntry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      userId,
      sessionId: this.getSessionId(),
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
      metadata,
      error,
    };

    this.addLog(logEntry);
    this.outputLog(logEntry);

    if (this.enableRemoteLogging) {
      this.sendToRemote(logEntry);
    }
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(
    userIdOrEmail: string,
    success: boolean,
    data?: LoginAttemptData
  ): void {
    const event = success ? 'auth.login.success' : 'auth.login.failure';
    const level: LogLevel = success ? 'INFO' : 'WARN';

    this.log(
      level,
      event,
      {
        userIdOrEmail,
        success,
        ...data,
      },
      data?.error ? new Error(data.error) : undefined,
      success ? userIdOrEmail : undefined
    );
  }

  /**
   * Log registration attempt
   */
  logRegistration(
    userIdOrEmail: string,
    success: boolean,
    data?: RegistrationData
  ): void {
    const event = success
      ? 'auth.registration.success'
      : 'auth.registration.failure';
    const level: LogLevel = success ? 'INFO' : 'WARN';

    this.log(
      level,
      event,
      {
        userIdOrEmail,
        success,
        ...data,
      },
      data?.error ? new Error(data.error) : undefined,
      success ? userIdOrEmail : undefined
    );
  }

  /**
   * Log logout
   */
  logLogout(userId: string, reason: string): void {
    this.log(
      'INFO',
      'auth.logout',
      {
        userId,
        reason,
      },
      undefined,
      userId
    );
  }

  /**
   * Log token refresh
   */
  logTokenRefresh(userId: string, success: boolean, error?: string): void {
    const event = success
      ? 'auth.token.refresh.success'
      : 'auth.token.refresh.failure';
    const level: LogLevel = success ? 'DEBUG' : 'WARN';

    this.log(
      level,
      event,
      {
        userId,
        success,
      },
      error ? new Error(error) : undefined,
      userId
    );
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(
      'SECURITY',
      event,
      {
        userId,
        ...metadata,
      },
      undefined,
      userId
    );
  }

  /**
   * Log session events
   */
  logSessionEvent(
    event: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(
      'INFO',
      `auth.session.${event}`,
      {
        userId,
        ...metadata,
      },
      undefined,
      userId
    );
  }

  /**
   * Log permission checks
   */
  logPermissionCheck(
    userId: string,
    resource: string,
    permission: string,
    allowed: boolean
  ): void {
    this.log(
      'DEBUG',
      'auth.permission.check',
      {
        userId,
        resource,
        permission,
        allowed,
      },
      undefined,
      userId
    );
  }

  /**
   * Log API errors
   */
  logApiError(endpoint: string, error: Error, userId?: string): void {
    this.log(
      'ERROR',
      'auth.api.error',
      {
        endpoint,
        errorMessage: error.message,
        userId,
      },
      error,
      userId
    );
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): AuthLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): AuthLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string): AuthLogEntry[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Private methods
   */
  private addLog(logEntry: AuthLogEntry): void {
    this.logs.push(logEntry);

    // Trim logs if we exceed max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputLog(logEntry: AuthLogEntry): void {
    if (!this.enableConsoleLogging) return;

    const { timestamp, level, event, userId, metadata, error } = logEntry;
    const logMessage = `[${timestamp}] ${level} - ${event}${userId ? ` (User: ${userId})` : ''}`;

    switch (level) {
      case 'DEBUG':
        logger.debug(logMessage, { ...metadata, error });
        break;
      case 'INFO':
        logger.info(logMessage, { ...metadata, error });
        break;
      case 'WARN':
        logger.warn(logMessage, { ...metadata, error });
        break;
      case 'ERROR':
      case 'SECURITY':
        logger.error(logMessage, error, metadata);
        break;
      default:
        logger.debug(logMessage, { ...metadata, error });
    }
  }

  private async sendToRemote(logEntry: AuthLogEntry): Promise<void> {
    if (!this.remoteEndpoint) return;

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  private getSessionId(): string {
    // Try to get session ID from sessionStorage or generate one
    try {
      let sessionId = sessionStorage.getItem('auth_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('auth_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private getClientIP(): string {
    // In a browser environment, we can't directly get the client IP
    // This would typically be handled by the server
    return 'client_ip_not_available';
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }
}

// Create and export singleton instance
export const authLogger = AuthLogger.getInstance();

export default AuthLogger;

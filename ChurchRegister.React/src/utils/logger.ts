/**
 * Application-wide logger utility that provides consistent logging patterns
 * In production, console.log statements are removed by the build process
 * In development, logs are output to the browser console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    // Lazy load env to avoid circular dependency
    this.isDevelopment =
      typeof import.meta !== 'undefined' &&
      import.meta.env.MODE === 'development';
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.debug(`[DEBUG] ${message}`, metadata);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      if (metadata) {
        console.info(`[INFO] ${message}`, metadata);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (metadata) {
      console.warn(`[WARN] ${message}`, metadata);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(
    message: string,
    error?: Error | unknown,
    metadata?: LogMetadata
  ): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
        ...metadata,
      });
    } else if (metadata) {
      console.error(`[ERROR] ${message}`, metadata);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log with a specific level
   */
  log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    switch (level) {
      case 'debug':
        this.debug(message, metadata);
        break;
      case 'info':
        this.info(message, metadata);
        break;
      case 'warn':
        this.warn(message, metadata);
        break;
      case 'error':
        this.error(message, undefined, metadata);
        break;
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

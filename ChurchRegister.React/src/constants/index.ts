/**
 * Application Configuration Constants
 *
 * Centralized configuration values used throughout the application.
 * These values should be imported from this file rather than hardcoded.
 */

export const APP_CONFIG = {
  /**
   * Width of the sidebar drawer in pixels
   */
  DRAWER_WIDTH: 240,

  /**
   * API request timeout in milliseconds
   */
  API_TIMEOUT: 30000,

  /**
   * Default page size for paginated grids
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum file upload size in bytes (5MB)
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /**
   * Token refresh interval in milliseconds (14 minutes)
   */
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000,

  /**
   * Toast notification auto-hide duration in milliseconds
   */
  TOAST_DURATION: 6000,
} as const;

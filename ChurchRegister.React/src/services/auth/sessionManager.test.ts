/**
 * Unit tests for sessionManager
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import SessionManager, { sessionManager } from './sessionManager';

// Mock tokenService to avoid real token operations
vi.mock('./tokenService', () => ({
  tokenService: {
    hasToken: vi.fn().mockReturnValue(false),
    isTokenValid: vi.fn().mockReturnValue(false),
    getTokens: vi.fn().mockReturnValue(null),
    clearTokens: vi.fn(),
    refreshTokenIfNeeded: vi.fn().mockResolvedValue(null),
    setup: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ tokenStorageKey: 'church_register_access_token' }),
  },
}));

describe('SessionManager singleton', () => {
  beforeEach(() => {
    // Reset the singleton so each test gets a clean state
    SessionManager.resetInstance();
    vi.useRealTimers();
  });

  test('getInstance returns the same instance', () => {
    const a = SessionManager.getInstance();
    const b = SessionManager.getInstance();
    expect(a).toBe(b);
  });

  test('resetInstance creates a fresh instance', () => {
    const first = SessionManager.getInstance();
    SessionManager.resetInstance();
    const second = SessionManager.getInstance();
    expect(first).not.toBe(second);
  });
});

describe('sessionManager - start and stop', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
    vi.useFakeTimers();
  });

  test('can start without error', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false, enableMultiTabSync: false });
    expect(() => mgr.start()).not.toThrow();
    mgr.stop();
  });

  test('start is idempotent', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false, enableMultiTabSync: false });
    mgr.start();
    expect(() => mgr.start()).not.toThrow(); // second call should be no-op
    mgr.stop();
  });

  test('stop is idempotent', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false, enableMultiTabSync: false });
    mgr.start();
    mgr.stop();
    expect(() => mgr.stop()).not.toThrow(); // second stop should be no-op
  });
});

describe('sessionManager - addCallback', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
  });

  test('addCallback returns an unsubscribe function', () => {
    const mgr = SessionManager.getInstance();
    const cb = vi.fn();
    const unsub = mgr.addCallback(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  test('callback is not called after unsubscribe', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false, enableMultiTabSync: false });
    const cb = vi.fn();
    const unsub = mgr.addCallback(cb);
    unsub();
    mgr.start();
    mgr.stop();
    // callback should never have been called since we unsubscribed before events
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('sessionManager - getSessionStatus', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
  });

  test('returns session status object', () => {
    const mgr = SessionManager.getInstance();
    const status = mgr.getSessionStatus();

    expect(typeof status.isActive).toBe('boolean');
    expect(typeof status.hasValidToken).toBe('boolean');
    expect(typeof status.minutesUntilExpiry).toBe('number');
    expect(status.lastActivity).toBeInstanceOf(Date);
    expect(typeof status.minutesSinceActivity).toBe('number');
  });

  test('isActive is false initially', () => {
    const mgr = SessionManager.getInstance();
    const status = mgr.getSessionStatus();
    expect(status.isActive).toBe(false);
  });
});

describe('sessionManager - getConfig and updateConfig', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
  });

  test('getConfig returns current configuration', () => {
    const mgr = SessionManager.getInstance();
    const config = mgr.getConfig();
    expect(typeof config.warningTimeBeforeExpiry).toBe('number');
    expect(typeof config.autoLogoutOnExpiry).toBe('boolean');
    expect(typeof config.enableAutoRefresh).toBe('boolean');
  });

  test('getConfig returns a copy (not the internal object)', () => {
    const mgr = SessionManager.getInstance();
    const c1 = mgr.getConfig();
    const c2 = mgr.getConfig();
    expect(c1).not.toBe(c2);
    expect(c1).toEqual(c2);
  });

  test('updateConfig updates configuration values', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false });
    mgr.updateConfig({ warningTimeBeforeExpiry: 10 });
    const config = mgr.getConfig();
    expect(config.warningTimeBeforeExpiry).toBe(10);
  });
});

describe('sessionManager - logout', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
  });

  test('logout stops the session without throwing', () => {
    const mgr = SessionManager.getInstance({ enableAutoRefresh: false, trackUserActivity: false, enableMultiTabSync: false });
    mgr.start();
    expect(() => mgr.logout()).not.toThrow();
  });
});

describe('exported sessionManager singleton', () => {
  test('is an instance of SessionManager', () => {
    expect(sessionManager).toBeDefined();
    expect(typeof sessionManager.start).toBe('function');
    expect(typeof sessionManager.stop).toBe('function');
    expect(typeof sessionManager.addCallback).toBe('function');
    expect(typeof sessionManager.getSessionStatus).toBe('function');
  });
});

// ─── Timer-based event tests ──────────────────────────────────────────────────

describe('sessionManager - inactivity timeout fires inactivity_detected', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    SessionManager.resetInstance();
  });

  test('emits inactivity_detected after inactivityTimeoutMinutes', () => {
    const inactivityTimeoutMinutes = 1;
    const mgr = SessionManager.getInstance({
      enableAutoRefresh: false,
      trackUserActivity: true,
      enableMultiTabSync: false,
      inactivityTimeoutMinutes,
    });

    const cb = vi.fn();
    mgr.addCallback(cb);
    mgr.start();

    // Advance time past inactivity timeout
    vi.advanceTimersByTime(inactivityTimeoutMinutes * 60 * 1000 + 100);

    expect(cb).toHaveBeenCalledWith('inactivity_detected', undefined);
  });

  test('also emits logout_required with reason inactivity after inactivity_detected', () => {
    const inactivityTimeoutMinutes = 1;
    const mgr = SessionManager.getInstance({
      enableAutoRefresh: false,
      trackUserActivity: true,
      enableMultiTabSync: false,
      inactivityTimeoutMinutes,
    });

    const events: string[] = [];
    mgr.addCallback((event) => events.push(event));
    mgr.start();

    vi.advanceTimersByTime(inactivityTimeoutMinutes * 60 * 1000 + 100);

    expect(events).toContain('inactivity_detected');
    expect(events).toContain('logout_required');
  });
});

describe('sessionManager - auto refresh fires session_expired when no token', () => {
  beforeEach(() => {
    SessionManager.resetInstance();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    SessionManager.resetInstance();
  });

  test('emits session_expired when tokenService.hasToken() returns false', async () => {
    const { tokenService } = await import('./tokenService');
    vi.mocked(tokenService.hasToken).mockReturnValue(false);

    const refreshIntervalMinutes = 1;
    const mgr = SessionManager.getInstance({
      enableAutoRefresh: true,
      trackUserActivity: false,
      enableMultiTabSync: false,
      refreshIntervalMinutes,
      autoLogoutOnExpiry: false, // prevent logout() from stopping everything
    });

    const cb = vi.fn();
    mgr.addCallback(cb);
    mgr.start();

    // Advance past first refresh interval
    await vi.advanceTimersByTimeAsync(refreshIntervalMinutes * 60 * 1000 + 100);

    expect(cb).toHaveBeenCalledWith('session_expired', undefined);
  });
});


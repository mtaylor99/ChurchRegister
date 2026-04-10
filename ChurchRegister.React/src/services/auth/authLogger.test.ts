import { describe, test, expect, beforeEach } from 'vitest';
import AuthLogger, { authLogger } from './authLogger';

describe('AuthLogger', () => {
  beforeEach(() => {
    authLogger.clearLogs();
    authLogger.configure({
      enableConsoleLogging: false,
      enableRemoteLogging: false,
      maxLogs: 1000,
    });
  });

  describe('getInstance', () => {
    test('returns the same instance each time', () => {
      const a = AuthLogger.getInstance();
      const b = AuthLogger.getInstance();
      expect(a).toBe(b);
    });

    test('exported authLogger is the singleton', () => {
      expect(authLogger).toBe(AuthLogger.getInstance());
    });
  });

  describe('log', () => {
    test('stores a log entry', () => {
      authLogger.log('INFO', 'test.event', { foo: 'bar' });
      const logs = authLogger.getRecentLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].event).toBe('test.event');
      expect(logs[0].metadata).toEqual(expect.objectContaining({ foo: 'bar' }));
    });

    test('timestamp is an ISO string', () => {
      authLogger.log('DEBUG', 'ts.event');
      const logs = authLogger.getRecentLogs(1);
      expect(() => new Date(logs[0].timestamp)).not.toThrow();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('stores userId when provided', () => {
      authLogger.log('INFO', 'user.event', undefined, undefined, 'user-42');
      expect(authLogger.getRecentLogs(1)[0].userId).toBe('user-42');
    });

    test('stores error when provided', () => {
      const err = new Error('boom');
      authLogger.log('ERROR', 'err.event', undefined, err);
      expect(authLogger.getRecentLogs(1)[0].error).toBe(err);
    });
  });

  describe('logLoginAttempt', () => {
    test('successful login → INFO + success event', () => {
      authLogger.logLoginAttempt('user@test.com', true);
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.level).toBe('INFO');
      expect(log.event).toBe('auth.login.success');
    });

    test('failed login → WARN + failure event', () => {
      authLogger.logLoginAttempt('user@test.com', false);
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.level).toBe('WARN');
      expect(log.event).toBe('auth.login.failure');
    });

    test('includes extra data in metadata', () => {
      authLogger.logLoginAttempt('user@test.com', true, { roles: ['Admin'] });
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.metadata).toEqual(
        expect.objectContaining({ userIdOrEmail: 'user@test.com', success: true, roles: ['Admin'] })
      );
    });
  });

  describe('logRegistration', () => {
    test('successful registration → INFO', () => {
      authLogger.logRegistration('new@test.com', true);
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.registration.success');
      expect(log.level).toBe('INFO');
    });

    test('failed registration → WARN', () => {
      authLogger.logRegistration('new@test.com', false, { error: 'Email taken' });
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.registration.failure');
      expect(log.level).toBe('WARN');
    });
  });

  describe('logLogout', () => {
    test('stores logout event with userId', () => {
      authLogger.logLogout('user-1', 'manual');
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.logout');
      expect(log.userId).toBe('user-1');
    });
  });

  describe('logTokenRefresh', () => {
    test('successful refresh → DEBUG', () => {
      authLogger.logTokenRefresh('user-1', true);
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.token.refresh.success');
      expect(log.level).toBe('DEBUG');
    });

    test('failed refresh → WARN', () => {
      authLogger.logTokenRefresh('user-1', false, 'Token expired');
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.token.refresh.failure');
      expect(log.level).toBe('WARN');
    });
  });

  describe('logSecurityEvent', () => {
    test('logs with SECURITY level', () => {
      authLogger.logSecurityEvent('brute_force', 'user-1', { ip: '1.2.3.4' });
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.level).toBe('SECURITY');
      expect(log.event).toBe('brute_force');
    });
  });

  describe('logSessionEvent', () => {
    test('prefixes event with auth.session.', () => {
      authLogger.logSessionEvent('started', 'user-1');
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.session.started');
      expect(log.level).toBe('INFO');
    });
  });

  describe('logPermissionCheck', () => {
    test('logs permission metadata', () => {
      authLogger.logPermissionCheck('user-1', 'members', 'edit', true);
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.event).toBe('auth.permission.check');
      expect(log.metadata).toEqual(
        expect.objectContaining({ resource: 'members', permission: 'edit', allowed: true })
      );
    });
  });

  describe('logApiError', () => {
    test('logs ERROR with endpoint', () => {
      authLogger.logApiError('/api/users', new Error('404'), 'user-1');
      const log = authLogger.getRecentLogs(1)[0];
      expect(log.level).toBe('ERROR');
      expect(log.event).toBe('auth.api.error');
      expect(log.metadata).toEqual(expect.objectContaining({ endpoint: '/api/users' }));
    });
  });

  describe('getRecentLogs', () => {
    test('returns last N entries', () => {
      for (let i = 0; i < 10; i++) authLogger.log('INFO', `event-${i}`);
      const logs = authLogger.getRecentLogs(3);
      expect(logs).toHaveLength(3);
      expect(logs[2].event).toBe('event-9');
    });

    test('returns all when count > stored', () => {
      authLogger.log('INFO', 'only-one');
      expect(authLogger.getRecentLogs(50)).toHaveLength(1);
    });
  });

  describe('getLogsByLevel', () => {
    test('filters by level', () => {
      authLogger.log('INFO', 'a');
      authLogger.log('WARN', 'b');
      authLogger.log('INFO', 'c');
      const infoLogs = authLogger.getLogsByLevel('INFO');
      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every((l) => l.level === 'INFO')).toBe(true);
    });

    test('returns empty array when none match', () => {
      authLogger.log('INFO', 'a');
      expect(authLogger.getLogsByLevel('ERROR')).toHaveLength(0);
    });
  });

  describe('getLogsByUser', () => {
    test('filters by userId', () => {
      authLogger.log('INFO', 'e1', undefined, undefined, 'user-1');
      authLogger.log('INFO', 'e2', undefined, undefined, 'user-2');
      authLogger.log('INFO', 'e3', undefined, undefined, 'user-1');
      expect(authLogger.getLogsByUser('user-1')).toHaveLength(2);
    });
  });

  describe('clearLogs', () => {
    test('removes all stored logs', () => {
      authLogger.log('INFO', 'event');
      authLogger.clearLogs();
      expect(authLogger.getRecentLogs(100)).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    test('returns parseable JSON array', () => {
      authLogger.log('INFO', 'export-test');
      const parsed = JSON.parse(authLogger.exportLogs());
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].event).toBe('export-test');
    });
  });

  describe('configure', () => {
    test('updates maxLogs setting', () => {
      authLogger.configure({ maxLogs: 5 });
      for (let i = 0; i < 10; i++) authLogger.log('INFO', `event-${i}`);
      const logs = authLogger.getRecentLogs(100);
      expect(logs.length).toBeLessThanOrEqual(5);
      expect(logs[logs.length - 1].event).toBe('event-9');
    });
  });
});

/**
 * Unit tests for notificationManager
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { notificationManager } from './notificationManager';

describe('notificationManager', () => {
  beforeEach(() => {
    // Reset handler between tests
    notificationManager.setNotificationHandler(null as never);
  });

  describe('showNotification without handler', () => {
    test('warns when no handler is registered', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      notificationManager.showNotification('test message', 'info');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification handler not registered'),
        expect.any(String)
      );
      warnSpy.mockRestore();
    });

    test('does not throw when no handler', () => {
      expect(() =>
        notificationManager.showNotification('test', 'success')
      ).not.toThrow();
    });
  });

  describe('showNotification with handler', () => {
    test('calls handler with message and severity', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showNotification('hello', 'success');
      expect(handler).toHaveBeenCalledWith('hello', 'success');
    });

    test('defaults severity to info', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showNotification('test');
      expect(handler).toHaveBeenCalledWith('test', 'info');
    });
  });

  describe('showSuccess', () => {
    test('calls handler with success severity', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showSuccess('Operation done');
      expect(handler).toHaveBeenCalledWith('Operation done', 'success');
    });
  });

  describe('showError', () => {
    test('calls handler with error severity', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showError('Something failed');
      expect(handler).toHaveBeenCalledWith('Something failed', 'error');
    });
  });

  describe('showWarning', () => {
    test('calls handler with warning severity', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showWarning('Be careful');
      expect(handler).toHaveBeenCalledWith('Be careful', 'warning');
    });
  });

  describe('showInfo', () => {
    test('calls handler with info severity', () => {
      const handler = vi.fn();
      notificationManager.setNotificationHandler(handler);
      notificationManager.showInfo('FYI');
      expect(handler).toHaveBeenCalledWith('FYI', 'info');
    });
  });
});

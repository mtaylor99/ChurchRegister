import { describe, test, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('warn', () => {
    test('logs warning message', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('test warning');
      expect(spy).toHaveBeenCalledWith('[WARN] test warning');
    });

    test('logs warning message with metadata', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const meta = { key: 'value' };
      logger.warn('test warning', meta);
      expect(spy).toHaveBeenCalledWith('[WARN] test warning', meta);
    });
  });

  describe('error', () => {
    test('logs error message without error object', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('test error');
      expect(spy).toHaveBeenCalledWith('[ERROR] test error');
    });

    test('logs error message with Error object', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('something broke');
      logger.error('test error', err);
      expect(spy).toHaveBeenCalledWith(
        '[ERROR] test error',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'something broke',
          }),
        })
      );
    });

    test('logs error message with metadata only', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('test error', undefined, { context: 'login' });
      expect(spy).toHaveBeenCalledWith('[ERROR] test error', {
        context: 'login',
      });
    });
  });

  describe('log', () => {
    test('delegates to warn for warn level', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.log('warn', 'delegated warning');
      expect(spy).toHaveBeenCalledWith('[WARN] delegated warning');
    });

    test('delegates to error for error level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.log('error', 'delegated error');
      expect(spy).toHaveBeenCalledWith('[ERROR] delegated error');
    });
  });
});

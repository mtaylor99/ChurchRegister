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

    test('delegates to debug for debug level', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.log('debug', 'delegated debug');
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[DEBUG] delegated debug');
    });

    test('delegates to info for info level', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.log('info', 'delegated info');
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[INFO] delegated info');
    });
  });

  describe('debug', () => {
    test('logs debug message in development mode', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.debug('debug message');
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[DEBUG] debug message');
    });

    test('logs debug message with metadata in development mode', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.debug('debug message', { key: 'value' });
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[DEBUG] debug message', { key: 'value' });
    });

    test('does not log in non-development mode', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      logger.debug('should not log');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    test('logs info message in development mode', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.info('info message');
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[INFO] info message');
    });

    test('logs info message with metadata in development mode', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = true;
      logger.info('info message', { context: 'test' });
      (logger as unknown as { isDevelopment: boolean }).isDevelopment = false;
      expect(spy).toHaveBeenCalledWith('[INFO] info message', { context: 'test' });
    });
  });
});

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidEmail, generateReportEmailBody, sendEmailWithAttachment } from './emailService';

describe('emailService', () => {
  describe('isValidEmail', () => {
    test('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('first.last@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@test.org')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });

    test('trims whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('generateReportEmailBody', () => {
    test('includes event count in body', () => {
      const body = generateReportEmailBody(5);
      expect(body).toContain('5 events');
    });

    test('includes date in body', () => {
      const body = generateReportEmailBody(3);
      expect(body).toContain(new Date().toLocaleDateString());
    });

    test('is a non-empty string', () => {
      const body = generateReportEmailBody(1);
      expect(body.length).toBeGreaterThan(50);
    });
  });
});

describe('sendEmailWithAttachment', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns success response when fetch succeeds', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ message: 'Email sent successfully' }) };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await sendEmailWithAttachment({
      toEmail: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Email sent successfully');
  });

  test('posts to /api/email/send-report', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ message: 'OK' }) };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    await sendEmailWithAttachment({ toEmail: 'a@b.com', subject: 'S', body: 'B' });

    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/email/send-report');
    expect(options.method).toBe('POST');
  });

  test('includes attachment when provided', async () => {
    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ message: 'OK' }) };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const blob = new Blob(['pdf content'], { type: 'application/pdf' });
    await sendEmailWithAttachment({
      toEmail: 'a@b.com',
      subject: 'S',
      body: 'B',
      attachment: blob,
      attachmentName: 'report.pdf',
    });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeInstanceOf(FormData);
  });

  test('returns failure response when server returns non-ok status', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'Internal Server Error' }),
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await sendEmailWithAttachment({ toEmail: 'a@b.com', subject: 'S', body: 'B' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Internal Server Error');
  });

  test('returns failure response when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network down'));

    const result = await sendEmailWithAttachment({ toEmail: 'a@b.com', subject: 'S', body: 'B' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Network down');
  });

  test('returns fallback message when error is not an Error instance', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

    const result = await sendEmailWithAttachment({ toEmail: 'a@b.com', subject: 'S', body: 'B' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to send email');
  });
});

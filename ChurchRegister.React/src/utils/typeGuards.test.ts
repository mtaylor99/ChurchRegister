/**
 * Unit tests for typeGuards utility functions
 *
 * Covers primitive guards, error extraction, event type guards,
 * Zod API schemas, and validateApiArray — including the additions
 * from Phase 8 (TASK-061, TASK-062).
 */

import { describe, test, expect, vi } from 'vitest';
import {
  isString,
  isNumber,
  isBoolean,
  isPlainObject,
  isNonEmptyString,
  isNullish,
  isPresent,
  extractErrorMessage,
  isKeyboardEvent,
  isKeyPress,
  isMouseEvent,
  isActivationKey,
  contributionSummarySchema,
  reminderSummarySchema,
  riskAssessmentSummarySchema,
  validateApiArray,
  filterWithGuard,
  safeParseJson,
} from './typeGuards';
import { z } from 'zod';

// ── Primitive type guards ────────────────────────────────────────────────────

describe('isString', () => {
  test('returns true for string values', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
  });
  test('returns false for non-string values', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });
});

describe('isNumber', () => {
  test('returns true for finite numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-3.14)).toBe(true);
  });
  test('returns false for NaN and Infinity', () => {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
  });
  test('returns false for non-numbers', () => {
    expect(isNumber('42')).toBe(false);
    expect(isNumber(null)).toBe(false);
  });
});

describe('isBoolean', () => {
  test('returns true for booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });
  test('returns false for non-booleans', () => {
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean('')).toBe(false);
  });
});

describe('isPlainObject', () => {
  test('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });
  test('returns false for null, arrays, and primitives', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject('str')).toBe(false);
    expect(isPlainObject(42)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  test('returns true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });
  test('returns false for empty or whitespace-only strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
  });
});

describe('isNullish', () => {
  test('returns true for null and undefined', () => {
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
  });
  test('returns false for all other values', () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish('')).toBe(false);
    expect(isNullish(false)).toBe(false);
  });
});

describe('isPresent', () => {
  test('returns true for non-null, non-undefined values', () => {
    expect(isPresent(0)).toBe(true);
    expect(isPresent('')).toBe(true);
    expect(isPresent(false)).toBe(true);
    expect(isPresent({})).toBe(true);
  });
  test('returns false for null and undefined', () => {
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
  });
});

// ── extractErrorMessage ───────────────────────────────────────────────────

describe('extractErrorMessage', () => {
  test('returns string error as-is', () => {
    expect(extractErrorMessage('something went wrong')).toBe(
      'something went wrong'
    );
  });

  test('returns Error.message', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  test('extracts message from plain object', () => {
    expect(extractErrorMessage({ message: 'oops' })).toBe('oops');
  });

  test('extracts message from Axios-style error response', () => {
    const axiosError = {
      response: { data: { message: 'Unauthorised' } },
    };
    expect(extractErrorMessage(axiosError)).toBe('Unauthorised');
  });

  test('extracts error field from Axios-style error response', () => {
    const axiosError = { response: { data: { error: 'Forbidden' } } };
    expect(extractErrorMessage(axiosError)).toBe('Forbidden');
  });

  test('returns fallback for unrecognised error shapes', () => {
    expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  test('uses custom fallback', () => {
    expect(extractErrorMessage(undefined, 'Custom fallback')).toBe(
      'Custom fallback'
    );
  });
});

// ── Event type guards (Phase 8 — TASK-062) ───────────────────────────────

describe('isKeyboardEvent', () => {
  test('returns true for objects with a string key property', () => {
    expect(isKeyboardEvent({ key: 'Enter', type: 'keydown' })).toBe(true);
    expect(
      isKeyboardEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    ).toBe(true);
  });

  test('returns false for non-keyboard-event values', () => {
    expect(isKeyboardEvent(null)).toBe(false);
    expect(isKeyboardEvent({ clientX: 0 })).toBe(false);
    expect(isKeyboardEvent('keydown')).toBe(false);
  });
});

describe('isKeyPress', () => {
  const makeKeyEvent = (key: string) => new KeyboardEvent('keydown', { key });

  test('returns true when key matches one of the supplied keys', () => {
    expect(isKeyPress(makeKeyEvent('Enter'), 'Enter', 'Space')).toBe(true);
    expect(isKeyPress(makeKeyEvent(' '), ' ')).toBe(true);
  });

  test('returns false when key does not match', () => {
    expect(isKeyPress(makeKeyEvent('Escape'), 'Enter', ' ')).toBe(false);
  });
});

describe('isMouseEvent', () => {
  test('returns true for native MouseEvent', () => {
    const e = new MouseEvent('click');
    expect(isMouseEvent(e)).toBe(true);
  });

  test('returns true for plain object with numeric clientX', () => {
    expect(isMouseEvent({ clientX: 100, clientY: 200 })).toBe(true);
  });

  test('returns false for keyboard events and primitives', () => {
    expect(isMouseEvent(new KeyboardEvent('keydown', { key: 'a' }))).toBe(
      false
    );
    expect(isMouseEvent(null)).toBe(false);
    expect(isMouseEvent('click')).toBe(false);
  });
});

describe('isActivationKey', () => {
  test('returns true for Enter', () => {
    expect(
      isActivationKey(new KeyboardEvent('keydown', { key: 'Enter' }))
    ).toBe(true);
  });

  test('returns true for Space ( )', () => {
    expect(isActivationKey(new KeyboardEvent('keydown', { key: ' ' }))).toBe(
      true
    );
  });

  test('returns false for other keys', () => {
    expect(
      isActivationKey(new KeyboardEvent('keydown', { key: 'Escape' }))
    ).toBe(false);
    expect(isActivationKey(new KeyboardEvent('keydown', { key: 'Tab' }))).toBe(
      false
    );
  });
});

// ── API response Zod schemas (Phase 8 — TASK-061) ────────────────────────

describe('contributionSummarySchema', () => {
  test('parses a valid contribution summary', () => {
    const input = {
      id: 1,
      churchMemberId: 2,
      amount: 50.0,
      date: '2026-01-01',
      description: 'Monthly giving',
      bankReference: 'REF123',
    };
    expect(() => contributionSummarySchema.parse(input)).not.toThrow();
  });

  test('fails when required fields are missing', () => {
    expect(() => contributionSummarySchema.parse({ id: 1 })).toThrow();
  });
});

describe('reminderSummarySchema', () => {
  test('parses a valid reminder summary', () => {
    const input = {
      id: 10,
      description: 'Call back',
      dueDate: '2026-03-01',
      isCompleted: false,
      priority: true,
    };
    expect(() => reminderSummarySchema.parse(input)).not.toThrow();
  });
});

describe('riskAssessmentSummarySchema', () => {
  test('parses a valid risk assessment', () => {
    const input = {
      id: 5,
      title: 'Fire Safety',
      categoryId: 1,
      reviewDate: '2026-06-01',
      isApproved: true,
    };
    expect(() => riskAssessmentSummarySchema.parse(input)).not.toThrow();
  });

  test('allows reviewDate to be null', () => {
    const input = {
      id: 5,
      title: 'TBC',
      categoryId: 1,
      reviewDate: null,
      isApproved: false,
    };
    expect(() => riskAssessmentSummarySchema.parse(input)).not.toThrow();
  });
});

// ── validateApiArray ──────────────────────────────────────────────────────

describe('validateApiArray', () => {
  const numSchema = z.object({ id: z.number() });

  test('returns all valid items', () => {
    const result = validateApiArray([{ id: 1 }, { id: 2 }], numSchema);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('filters out invalid items and logs a warning', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateApiArray(
      [{ id: 1 }, { id: 'bad' }, { id: 3 }],
      numSchema
    );
    expect(result).toEqual([{ id: 1 }, { id: 3 }]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('returns an empty array when given a non-array', () => {
    expect(validateApiArray(null, numSchema)).toEqual([]);
    expect(validateApiArray({ items: [] }, numSchema)).toEqual([]);
  });

  test('returns an empty array when given an empty array', () => {
    expect(validateApiArray([], numSchema)).toEqual([]);
  });
});

// ── filterWithGuard ───────────────────────────────────────────────────────

describe('filterWithGuard', () => {
  test('filters array items using a type guard', () => {
    const mixed: unknown[] = [1, 'hello', 2, 'world', null];
    const strings = filterWithGuard(mixed, isString);
    expect(strings).toEqual(['hello', 'world']);
  });
});

// ── safeParseJson ─────────────────────────────────────────────────────────

describe('safeParseJson', () => {
  const schema = z.object({ value: z.number() });

  test('parses valid JSON that matches the schema', () => {
    expect(safeParseJson('{"value":42}', schema)).toEqual({ value: 42 });
  });

  test('returns null for JSON that does not match the schema', () => {
    expect(safeParseJson('{"value":"not-a-number"}', schema)).toBeNull();
  });

  test('returns null for malformed JSON', () => {
    expect(safeParseJson('not json', schema)).toBeNull();
  });
});

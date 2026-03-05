/**
 * Unit tests for useFormFocus hook
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { FieldErrors } from 'react-hook-form';
import { useFormFocus } from './useFormFocus';

function createInput(attrs: Record<string, string>): HTMLInputElement {
  const el = document.createElement('input');
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.body.appendChild(el);
  return el;
}

function cleanup(...elements: HTMLElement[]) {
  elements.forEach((el) => el.parentNode?.removeChild(el));
}

describe('useFormFocus', () => {
  beforeEach(() => {
    // Track focus calls via the focusin event
    document.addEventListener('focusin', (_e) => {
      // focus tracked via document.activeElement
    });
  });

  afterEach(() => {
    // Remove all appended inputs
    document.querySelectorAll('input[data-test]').forEach((el) => el.remove());
  });

  test('does nothing when there are no errors', () => {
    const input = createInput({ name: 'email', 'data-test': 'true' });
    input.tabIndex = 0;

    renderHook(() => useFormFocus({}));

    // input should not be focused
    expect(document.activeElement).not.toBe(input);
    cleanup(input);
  });

  test('focuses the first field matching an error key by name attribute', () => {
    const emailInput = createInput({
      name: 'email',
      'data-test': 'true',
      tabIndex: '0',
    });
    const passwordInput = createInput({
      name: 'password',
      'data-test': 'true',
      tabIndex: '0',
    });

    renderHook(() =>
      useFormFocus({
        email: { type: 'required', message: 'Required' },
        password: { type: 'required', message: 'Required' },
      })
    );

    expect(document.activeElement).toBe(emailInput);
    cleanup(emailInput, passwordInput);
  });

  test('falls back to aria-invalid="true" when no name match is found', () => {
    const selectWrapper = document.createElement('div');
    selectWrapper.setAttribute('aria-invalid', 'true');
    selectWrapper.tabIndex = 0;
    document.body.appendChild(selectWrapper);

    renderHook(() =>
      useFormFocus({
        district: { type: 'required', message: 'Required' },
      })
    );

    expect(document.activeElement).toBe(selectWrapper);
    selectWrapper.remove();
  });

  test('re-runs when errors object changes', () => {
    const firstInput = createInput({
      name: 'email',
      'data-test': 'true',
      tabIndex: '0',
    });
    const secondInput = createInput({
      name: 'phone',
      'data-test': 'true',
      tabIndex: '0',
    });

    const { rerender } = renderHook(
      ({ errors }: { errors: Record<string, unknown> }) =>
        useFormFocus(errors as FieldErrors<Record<string, unknown>>),
      { initialProps: { errors: {} } }
    );

    // No errors initially — nothing focused
    expect(document.activeElement).not.toBe(firstInput);

    // Errors introduced
    rerender({ errors: { phone: { type: 'required', message: 'Required' } } });
    expect(document.activeElement).toBe(secondInput);

    cleanup(firstInput, secondInput);
  });
});

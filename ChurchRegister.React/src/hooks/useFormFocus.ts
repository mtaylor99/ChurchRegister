/**
 * useFormFocus — Focus the first invalid field after a failed form submission
 *
 * Integrates with React Hook Form's `formState.errors` to automatically move
 * keyboard focus to the first field that has a validation error. This ensures
 * keyboard and screen-reader users are directed to the problem immediately after
 * submitting a form with errors.
 *
 * @example
 * ```tsx
 * const { control, handleSubmit, formState: { errors } } = useForm();
 * useFormFocus(errors);
 *
 * // The hook will focus the first field with an error whenever `errors` changes
 * // and is non-empty.
 * ```
 */
import { useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';

/**
 * Attempts to focus the first DOM input whose `name` attribute matches
 * one of the keys in `fieldErrors`.
 *
 * Falls back to querying `[aria-invalid="true"]` elements if no name match
 * is found, which covers MUI select/datepicker wrappers.
 *
 * @param fieldErrors - The `errors` object from `useForm().formState`
 */
export function useFormFocus<T extends Record<string, unknown>>(
  fieldErrors: FieldErrors<T>
): void {
  useEffect(() => {
    const errorKeys = Object.keys(fieldErrors);
    if (errorKeys.length === 0) return;

    // Try to find the first input by name attribute
    for (const key of errorKeys) {
      const el = document.querySelector<HTMLElement>(
        `[name="${key}"], input[id="${key}"], textarea[id="${key}"]`
      );
      if (el) {
        el.focus();
        return;
      }
    }

    // Fallback: focus the first element marked aria-invalid
    const invalidEl = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    invalidEl?.focus();
  }, [fieldErrors]);
}

/**
 * Test Utilities Barrel Export
 *
 * Exports all test utilities from a single entry point.
 * Use this to import test utilities in your test files.
 *
 * @example
 * ```tsx
 * import {
 *   render,
 *   screen,
 *   waitFor,
 *   createMockUser,
 *   createMockChurchMember
 * } from '@/test-utils';
 * ```
 */

// Re-export custom render and all @testing-library/react utilities
export * from './render';

// Export mock data factories
export * from './factories';

// Export MSW mocks for test-specific overrides
export { server } from '../mocks/server';
export { handlers } from '../mocks/handlers';

/**
 * Utility: Wait for element removal with timeout
 *
 * @example
 * ```tsx
 * await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
 * ```
 */
export { waitForElementToBeRemoved } from '@testing-library/react';

/**
 * Utility: User event simulation
 * Use this for simulating user interactions in tests
 *
 * @example
 * ```tsx
 * import { render, screen } from '@/test-utils';
 * import userEvent from '@testing-library/user-event';
 *
 * test('handles click', async () => {
 *   const user = userEvent.setup();
 *   render(<Button>Click me</Button>);
 *   await user.click(screen.getByRole('button'));
 * });
 * ```
 */
export { default as userEvent } from '@testing-library/user-event';

/**
 * Utility: Act for manual state updates
 * Usually not needed with modern @testing-library, but available for edge cases
 *
 * @example
 * ```tsx
 * import { act } from '@/test-utils';
 *
 * await act(async () => {
 *   // perform state updates
 * });
 * ```
 */
export { act } from '@testing-library/react';

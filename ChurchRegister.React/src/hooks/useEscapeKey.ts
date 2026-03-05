/**
 * useEscapeKey — Close modals/drawers on Escape key press
 *
 * Attaches a `keydown` listener on the document that calls `onClose` when
 * the Escape key is pressed, provided the handler is `enabled`.
 * The listener is automatically removed when the component unmounts or
 * `enabled` becomes false.
 *
 * @example
 * ```tsx
 * export const MyDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({
 *   open,
 *   onClose,
 * }) => {
 *   useEscapeKey(onClose, open);
 *   return <Drawer open={open} onClose={onClose}>...</Drawer>;
 * };
 * ```
 */
import { useEffect } from 'react';

/**
 * Calls `onClose` when the Escape key is pressed, iff `enabled` is true.
 *
 * @param onClose  - Callback invoked when Escape is pressed
 * @param enabled  - Whether the listener is active (default: true)
 */
export function useEscapeKey(
  onClose: (() => void) | undefined,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled || !onClose) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, enabled]);
}

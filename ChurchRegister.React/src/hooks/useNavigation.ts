import { useContext } from 'react';
import { NavigationContext } from '../components/Navigation/NavigationProvider';
import type { NavigationContextType } from '../components/Navigation/NavigationProvider';

/**
 * Hook to access the navigation context.
 * Must be used within a NavigationProvider.
 * @returns NavigationContextType with navigate, currentPath, and breadcrumbs
 * @throws Error if used outside NavigationProvider
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

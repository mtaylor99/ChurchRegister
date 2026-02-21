import { useContext } from 'react';
import { NavigationContext } from '../components/Navigation/NavigationProvider';
import type { NavigationContextType } from '../components/Navigation/NavigationProvider';

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

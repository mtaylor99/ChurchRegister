import React, { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface NavigationContextType {
  currentPath: string;
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  navigateTo: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

// Export the context for use in custom hooks
export { NavigationContext };

export interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Update current path when location changes
  useEffect(() => {
    setCurrentPath(location.pathname);
    setIsMenuOpen(false); // Close menu on navigation
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    closeMenu();
  };

  const value: NavigationContextType = {
    currentPath,
    isMenuOpen,
    toggleMenu,
    closeMenu,
    navigateTo,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;

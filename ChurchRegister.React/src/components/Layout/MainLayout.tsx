import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar, type NavigationItem } from './Sidebar';

interface User {
  displayName: string;
  email: string;
  roles?: string[];
}

interface MainLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  currentPath?: string;
  navigationItems?: NavigationItem[];
  showSidebar?: boolean;
  onNavigate?: (path: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  currentPath = '',
  navigationItems,
  showSidebar = true,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Determine sidebar variant based on screen size
  const sidebarVariant = isMobile ? 'temporary' : 'permanent';
  const shouldShowSidebar = showSidebar && !!user; // Only show sidebar for authenticated users

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        onMenuToggle={handleSidebarToggle}
        showMenuButton={shouldShowSidebar && isMobile}
      />

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar */}
        {shouldShowSidebar && (
          <Sidebar
            open={isMobile ? sidebarOpen : true}
            onClose={handleSidebarClose}
            onNavigate={onNavigate || (() => {})}
            currentPath={currentPath}
            navigationItems={navigationItems}
            variant={sidebarVariant}
          />
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Allows content to shrink
            backgroundColor: theme.palette.background.default,
          }}
        >
          {/* Content Area */}
          <Box
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              width: '100%',
              maxWidth: shouldShowSidebar ? '100%' : '1200px',
              mx: shouldShowSidebar ? 0 : 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

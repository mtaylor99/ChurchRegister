import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { UserProfileDropdown } from '../../components/profile/UserProfileDropdown';
import { AuthContext } from '../../contexts/AuthContext';
import theme from '../../theme';
import type { User } from '../../services/auth/types';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </BrowserRouter>
);

const mockUser: User = {
  id: '1',
  email: 'john.doe@church.com',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  roles: ['User'],
  permissions: ['read:profile'],
  emailConfirmed: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuthenticatedContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  sessionWarning: false,
  sessionExpiry: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshUser: vi.fn(),
  clearError: vi.fn(),
  clearSessionWarning: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
  confirmEmail: vi.fn(),
  resendEmailConfirmation: vi.fn(),
  hasRole: vi.fn(() => true),
  hasAnyRole: vi.fn(() => true),
  hasAllRoles: vi.fn(() => true),
  hasPermission: vi.fn(() => true),
  hasAnyPermission: vi.fn(() => true),
  hasAllPermissions: vi.fn(() => true),
  getAccessToken: vi.fn(() => null),
  isTokenValid: vi.fn(() => true),
};

const mockUnauthenticatedContext = {
  ...mockAuthenticatedContext,
  user: null,
  isAuthenticated: false,
  logout: vi.fn(),
};

describe('UserProfileDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Authenticated User', () => {
    it('should render avatar with user initials', () => {
      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      expect(avatar).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    });

    it('should open dropdown when avatar is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText('Change Password')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should open profile drawer when "My Profile" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      const profileMenuItem = await screen.findByText('My Profile');
      await user.click(profileMenuItem);

      // Should open drawer instead of navigating
      expect(mockNavigate).not.toHaveBeenCalled();
      // Drawer should be visible
      expect(await screen.findByText('My Profile')).toBeInTheDocument();
    });

    it('should navigate to change password page when "Change Password" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      const changePasswordMenuItem = await screen.findByText('Change Password');
      await user.click(changePasswordMenuItem);

      expect(mockNavigate).toHaveBeenCalledWith('/auth/change-password');
    });

    it('should call logout and navigate to home when "Logout" is clicked', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn().mockResolvedValue(undefined);

      render(
        <AuthContext.Provider
          value={{ ...mockAuthenticatedContext, logout: mockLogout }}
        >
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      const logoutMenuItem = await screen.findByText('Logout');
      await user.click(logoutMenuItem);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should generate initials from email when no name is provided', () => {
      const userWithEmailOnly = {
        ...mockUser,
        firstName: '',
        lastName: '',
        displayName: 'test@example.com',
      };

      render(
        <AuthContext.Provider
          value={{ ...mockAuthenticatedContext, user: userWithEmailOnly }}
        >
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      expect(screen.getByText('TE')).toBeInTheDocument(); // First two letters of email
    });

    it('should handle single character name correctly', () => {
      const userWithSingleName = {
        ...mockUser,
        firstName: 'J',
        lastName: '',
        displayName: 'J',
      };

      render(
        <AuthContext.Provider
          value={{ ...mockAuthenticatedContext, user: userWithSingleName }}
        >
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <div data-testid="outside-element">Outside Element</div>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      // Verify dropdown is open
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);

      // Verify dropdown is closed
      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User', () => {
    it('should render login and register buttons when not authenticated', () => {
      render(
        <AuthContext.Provider value={mockUnauthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/user profile menu/i)
      ).not.toBeInTheDocument();
    });

    it('should navigate to register page when "Register" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockUnauthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const registerButton = screen.getByText('Register');
      await user.click(registerButton);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should navigate to login page when "Login" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockUnauthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const loginButton = screen.getByText('Login');
      await user.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for authenticated user', () => {
      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      expect(avatar).toHaveAttribute('aria-label', 'User profile menu');
      expect(avatar).toHaveAttribute('aria-haspopup', 'true');
      expect(avatar).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when dropdown is opened', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      await waitFor(() => {
        expect(avatar).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <AuthContext.Provider value={mockAuthenticatedContext}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);

      // Focus and activate with keyboard
      avatar.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      // Navigate with arrow keys and activate with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Error Handling', () => {
    it('should handle logout errors gracefully', async () => {
      const user = userEvent.setup();
      const mockLogoutWithError = vi
        .fn()
        .mockRejectedValue(new Error('Logout failed'));
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <AuthContext.Provider
          value={{ ...mockAuthenticatedContext, logout: mockLogoutWithError }}
        >
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      const avatar = screen.getByLabelText(/user profile menu/i);
      await user.click(avatar);

      const logoutMenuItem = await screen.findByText('Logout');
      await user.click(logoutMenuItem);

      await waitFor(() => {
        expect(mockLogoutWithError).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Logout failed:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing user data gracefully', () => {
      const contextWithNullUser = {
        ...mockAuthenticatedContext,
        user: null,
        isAuthenticated: true, // This shouldn't happen but test the edge case
      };

      render(
        <AuthContext.Provider value={contextWithNullUser}>
          <TestWrapper>
            <UserProfileDropdown />
          </TestWrapper>
        </AuthContext.Provider>
      );

      // Should fall back to unauthenticated view
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
});

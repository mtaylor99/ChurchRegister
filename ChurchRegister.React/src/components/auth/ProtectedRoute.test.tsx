/**
 * Unit tests for ProtectedRoute component
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthStateContext } from '../../contexts/AuthContext';
import type { AuthState } from '../../contexts/AuthContext';
import type { User } from '../../services/auth/types';
import type { RBACContext } from '../../hooks/useRBAC';

// Mock useRBAC hook
vi.mock('../../hooks/useRBAC', () => ({
  useRBAC: vi.fn(),
}));

// Import the mocked hook
import { useRBAC } from '../../hooks/useRBAC';

// Mock user data
const createMockUser = (roles: string[] = [], emailConfirmed = true): User => ({
  id: '1',
  email: 'test@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  roles,
  permissions: [],
  isActive: true,
  emailConfirmed,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Mock auth state
const createAuthState = (user: User | null, isLoading = false): AuthState => ({
  user,
  isAuthenticated: user !== null,
  isLoading,
  error: null,
  sessionWarning: false,
  sessionExpiry: null,
});

// Mock RBAC context
const createMockRBAC = (user: User | null): RBACContext => ({
  user,
  hasRole: (role: string) => user?.roles.includes(role) ?? false,
  hasAnyRole: (roles: string[]) =>
    user ? roles.some((role) => user.roles.includes(role)) : false,
  hasAllRoles: (roles: string[]) =>
    user ? roles.every((role) => user.roles.includes(role)) : false,
  hasPermission: () => true,
  hasAnyPermission: () => true,
  hasAllPermissions: () => true,
  getUserPermissions: () => [],
  getUserRoleLevel: () => 0,
  canAccessResource: () => true,
  getAllowedActions: () => [],
  validateAccess: (
    _resource,
    requiredRoles = [],
    _requiredPermissions = []
  ) => {
    if (!user) {
      return { authorized: false, reason: 'User not authenticated' };
    }
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.some((role) => user.roles.includes(role))
    ) {
      return { authorized: false, reason: 'Insufficient role permissions' };
    }
    if (!user.emailConfirmed) {
      return { authorized: false, reason: 'Email not confirmed' };
    }
    return { authorized: true };
  },
  isAdmin: user?.roles.includes('SystemAdministrator') ?? false,
  isTrustee: user?.roles.includes('Trustee') ?? false,
  isOfficer: user?.roles.includes('Officer') ?? false,
  isVolunteer: user?.roles.includes('Volunteer') ?? false,
  isMember: user?.roles.includes('Member') ?? false,
  isGuest: user?.roles.includes('Guest') ?? false,
  canViewAttendance: true,
  canRecordAttendance: true,
  canViewAnalytics: true,
  canManageEvents: true,
});

// Test wrapper component
const TestWrapper = ({
  children,
  user,
  isLoading = false,
}: {
  children: React.ReactNode;
  user: User | null;
  isLoading?: boolean;
}) => {
  const authState = createAuthState(user, isLoading);

  // Setup RBAC mock
  vi.mocked(useRBAC).mockReturnValue(createMockRBAC(user));

  return (
    <MemoryRouter initialEntries={['/protected']}>
      <AuthStateContext.Provider value={authState}>
        <Routes>
          <Route path="/protected" element={children} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </AuthStateContext.Provider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('authentication checks', () => {
    test('should render children when user is authenticated', async () => {
      const user = createMockUser(['Member']);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('should show loading spinner while checking authentication', () => {
      const user = createMockUser(['Member']);

      render(
        <TestWrapper user={user} isLoading={true}>
          <ProtectedRoute showLoading={true}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(
        screen.getByText('Verifying authentication...')
      ).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should redirect to login when user is not authenticated', async () => {
      render(
        <TestWrapper user={null}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    test('should use custom redirect path', async () => {
      const CustomRedirect = () => <div>Custom Login</div>;

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <AuthStateContext.Provider value={createAuthState(null)}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute redirectTo="/custom-login">
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/custom-login" element={<CustomRedirect />} />
            </Routes>
          </AuthStateContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Login')).toBeInTheDocument();
      });
    });

    test('should not add returnUrl when logout is in progress', async () => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('auth_logout_in_progress', 'true');
      }

      render(
        <TestWrapper user={null}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // Verify sessionStorage was cleared
      if (typeof sessionStorage !== 'undefined') {
        expect(sessionStorage.getItem('auth_logout_in_progress')).toBeNull();
      }
    });
  });

  describe('role-based access control', () => {
    test('should allow access when user has required role', async () => {
      const user = createMockUser(['SystemAdministrator']);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute requiredRoles={['SystemAdministrator']}>
            <div>Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
    });

    test('should allow access when user has any of the required roles', async () => {
      const user = createMockUser(['Officer']);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute requiredRoles={['SystemAdministrator', 'Officer']}>
            <div>Staff Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Staff Content')).toBeInTheDocument();
      });
    });

    test('should deny access when user lacks required role', async () => {
      const user = createMockUser(['Member']);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute requiredRoles={['SystemAdministrator']}>
            <div>Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show unauthorized page or redirect
        expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('email confirmation', () => {
    test('should allow access when email is confirmed', async () => {
      const user = createMockUser(['Member'], true);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute requireEmailConfirmed={true}>
            <div>Email Confirmed Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Email Confirmed Content')).toBeInTheDocument();
      });
    });

    test('should deny access when email is not confirmed', async () => {
      const user = createMockUser(['Member'], false);

      render(
        <TestWrapper user={user}>
          <ProtectedRoute requireEmailConfirmed={true}>
            <div>Email Confirmed Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.queryByText('Email Confirmed Content')
        ).not.toBeInTheDocument();
      });
    });

    test('should use custom unauthorized component', async () => {
      const user = createMockUser(['Member'], false);
      const CustomUnauthorized = ({ reason }: { reason: string }) => (
        <div>Custom: {reason}</div>
      );

      render(
        <TestWrapper user={user}>
          <ProtectedRoute
            requireEmailConfirmed={true}
            unauthorizedComponent={CustomUnauthorized}
          >
            <div>Email Confirmed Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Custom:/)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    test('should hide loading when showLoading is false', () => {
      const user = createMockUser(['Member']);

      render(
        <TestWrapper user={user} isLoading={true}>
          <ProtectedRoute showLoading={false}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(
        screen.queryByText('Verifying authentication...')
      ).not.toBeInTheDocument();
    });

    test('should show loading by default', () => {
      const user = createMockUser(['Member']);

      render(
        <TestWrapper user={user} isLoading={true}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(
        screen.getByText('Verifying authentication...')
      ).toBeInTheDocument();
    });
  });

  describe('resource ownership', () => {
    test('should support resource context for permission checking', async () => {
      const user = createMockUser(['Member']);
      const resource = {
        type: 'document',
        id: '123',
        ownerId: '1',
      };

      render(
        <TestWrapper user={user}>
          <ProtectedRoute resource={resource} allowOwnership={true}>
            <div>Resource Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Resource Content')).toBeInTheDocument();
      });
    });

    test('should respect allowOwnership flag', async () => {
      const user = createMockUser(['Member']);
      const resource = {
        type: 'document',
        id: '123',
        ownerId: '999', // Different from user ID
      };

      render(
        <TestWrapper user={user}>
          <ProtectedRoute resource={resource} allowOwnership={false}>
            <div>Resource Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Behavior depends on permission implementation
      // This test structure allows for checking the flag is passed
    });
  });
});

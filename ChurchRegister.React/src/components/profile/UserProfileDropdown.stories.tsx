import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Box } from '@mui/material';
import { UserProfileDropdown } from './UserProfileDropdown';
import theme from '../../theme';
import { AuthContext } from '../../contexts/AuthContext';
import type { User } from '../../services/auth/types';

// Mock AuthContext for authenticated user
const mockAuthenticatedContext = {
  user: {
    id: '1',
    email: 'john.doe@church.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    roles: ['User'],
    emailConfirmed: true,
  } as User,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  sessionWarning: false,
  sessionExpiry: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  refreshUser: async () => {},
  clearError: () => {},
  clearSessionWarning: () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  requestPasswordReset: async () => {},
  confirmPasswordReset: async () => {},
  confirmEmail: async () => {},
  resendEmailConfirmation: async () => {},
  hasRole: () => true,
  hasAnyRole: () => true,
  hasAllRoles: () => true,
  hasPermission: () => true,
  hasAnyPermission: () => true,
  hasAllPermissions: () => true,
  getAccessToken: () => null,
  isTokenValid: () => true,
};

// Mock AuthContext for unauthenticated user
const mockUnauthenticatedContext = {
  ...mockAuthenticatedContext,
  user: null,
  isAuthenticated: false,
};

const meta = {
  title: 'Components/Profile/UserProfileDropdown',
  component: UserProfileDropdown,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The UserProfileDropdown component provides a user profile menu for authenticated users
and login/register buttons for unauthenticated users. It matches the design of the 
existing Blazor MyProfile component.

**Features:**
- Avatar with user initials when authenticated
- Dropdown menu with profile actions
- Automatic generation of initials from user name or email
- Login/Register buttons when unauthenticated
- Responsive design with mobile optimizations
- Accessible keyboard navigation
        `,
      },
    },
  },
  decorators: [
    (Story, { args }) => (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="static">
            <Toolbar sx={{ justifyContent: 'flex-end', minHeight: '64px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Story {...args} />
              </Box>
            </Toolbar>
          </AppBar>
        </ThemeProvider>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof UserProfileDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AuthenticatedUser: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider value={mockAuthenticatedContext}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the dropdown with an authenticated user. Click the avatar to see the menu options.',
      },
    },
  },
};

export const AuthenticatedUserWithLongName: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          ...mockAuthenticatedContext,
          user: {
            ...mockAuthenticatedContext.user!,
            firstName: 'Christopher',
            lastName: 'Washington',
            displayName: 'Christopher Washington',
          },
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component handles longer names.',
      },
    },
  },
};

export const AuthenticatedUserEmailOnly: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          ...mockAuthenticatedContext,
          user: {
            ...mockAuthenticatedContext.user!,
            firstName: '',
            lastName: '',
            displayName: 'john.doe@church.com',
          },
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows how initials are generated when only email is available.',
      },
    },
  },
};

export const UnauthenticatedUser: Story = {
  decorators: [
    (Story) => (
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the Login and Register buttons for unauthenticated users.',
      },
    },
  },
};

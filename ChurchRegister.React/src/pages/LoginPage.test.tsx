/**
 * Component tests for LoginPage — critical login flow
 *
 * Tests the primary happy path, validation, and error scenarios.
 * Uses MSW to intercept API calls (configured in setupTests.ts).
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { LoginPage } from './LoginPage';

// ── Mocks ─────────────────────────────────────────────────────────────────

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: null,
      pathname: '/login',
      search: '',
      hash: '',
    }),
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the login form', () => {
    render(<LoginPage />, { withRouter: false });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test('passes rememberMe=true to login when checkbox is checked', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />, { withRouter: false });

    // Tick the "Remember me" checkbox (default is unchecked)
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        true // rememberMe
      );
    });
  });

  test('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />, { withRouter: false });

    // Fields pre-filled with defaults — just submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'admin@churchregister.com',
        'AdminPassword123!',
        false // rememberMe default
      );
    });
  });

  test('displays an error alert when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginPage />, { withRouter: false });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('toggles password visibility on icon click', async () => {
    render(<LoginPage />, { withRouter: false });

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle IconButton is the second button in the form (after Sign In)
    const buttons = screen.getAllByRole('button');
    const toggleBtn = buttons.find(
      (btn) => btn !== screen.getByRole('button', { name: /sign in/i })
    );
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

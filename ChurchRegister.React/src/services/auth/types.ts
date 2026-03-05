// Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  expiresAt: Date;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
  requirePasswordChange?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface EmailConfirmationRequest {
  token: string;
  email: string;
}

// Authentication State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  message: string;
  success: boolean;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: string;
  validationErrors?: ValidationError[];
}

// Permission and Role Types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

// Authentication Events
export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'PROFILE_UPDATED';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: Date;
  user?: User;
  error?: AuthError;
  metadata?: Record<string, string | number | boolean>;
}

// Authentication Configuration
export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  userStorageKey: string;
  autoRefreshToken: boolean;
  tokenRefreshBuffer: number; // minutes before expiry to refresh
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  enableLogging?: boolean; // optional logging configuration
}

// JWT Token Payload
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Authentication Hook Types
export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  confirmEmail: (data: EmailConfirmationRequest) => Promise<void>;
  resendEmailConfirmation: (email: string) => Promise<void>;

  // Utility
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  clearError: () => void;
}

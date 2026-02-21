/**
 * Mock Data Factories
 *
 * Factory functions to generate mock data for tests.
 * These factories create realistic test data with sensible defaults
 * and allow overriding specific properties.
 *
 * @example
 * ```tsx
 * import { createMockChurchMember } from '@/test-utils';
 *
 * const member = createMockChurchMember({ firstName: 'John' });
 * ```
 */

/**
 * Mock User
 */
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  status: number;
  roles: string[];
  dateJoined: string;
  emailConfirmed: boolean;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    jobTitle: 'Member',
    status: 2, // Active
    roles: ['User'],
    dateJoined: '2020-01-01',
    emailConfirmed: true,
    ...overrides,
  };
}

/**
 * Mock Church Member
 */
export interface MockChurchMember {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  membershipDate: string;
  status: number;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
}

export function createMockChurchMember(
  overrides: Partial<MockChurchMember> = {}
): MockChurchMember {
  return {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '555-0100',
    dateOfBirth: '1980-01-15',
    membershipDate: '2020-01-01',
    status: 1, // Active
    address: {
      street: '123 Main St',
      city: 'London',
      postalCode: 'SW1A 1AA',
    },
    ...overrides,
  };
}

/**
 * Mock Contribution
 */
export interface MockContribution {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  date: string;
  type: string;
  paymentMethod: string;
}

export function createMockContribution(
  overrides: Partial<MockContribution> = {}
): MockContribution {
  return {
    id: 1,
    memberId: 1,
    memberName: 'John Doe',
    amount: 50.0,
    date: '2024-01-15',
    type: 'Tithe',
    paymentMethod: 'Cash',
    ...overrides,
  };
}

/**
 * Mock Attendance Record
 */
export interface MockAttendanceRecord {
  id: number;
  eventId: number;
  eventName: string;
  date: string;
  attendance: number;
}

export function createMockAttendanceRecord(
  overrides: Partial<MockAttendanceRecord> = {}
): MockAttendanceRecord {
  return {
    id: 1,
    eventId: 1,
    eventName: 'Sunday Service',
    date: '2024-01-21',
    attendance: 150,
    ...overrides,
  };
}

/**
 * Mock Event
 */
export interface MockEvent {
  id: number;
  name: string;
  isActive: boolean;
}

export function createMockEvent(overrides: Partial<MockEvent> = {}): MockEvent {
  return {
    id: 1,
    name: 'Sunday Service',
    isActive: true,
    ...overrides,
  };
}

/**
 * Mock Paginated Response
 */
export interface MockPaginatedResponse<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function createMockPaginatedResponse<T>(
  items: T[],
  overrides: Partial<MockPaginatedResponse<T>> = {}
): MockPaginatedResponse<T> {
  const defaults: MockPaginatedResponse<T> = {
    items,
    currentPage: 1,
    pageSize: 20,
    totalCount: items.length,
    totalPages: Math.ceil(items.length / 20),
    hasPreviousPage: false,
    hasNextPage: false,
  };

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Mock Auth Tokens
 */
export interface MockAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function createMockAuthTokens(
  overrides: Partial<MockAuthTokens> = {}
): MockAuthTokens {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    ...overrides,
  };
}

/**
 * Mock Login Response
 */
export interface MockLoginResponse {
  user: MockUser;
  tokens: MockAuthTokens;
}

export function createMockLoginResponse(
  overrides: Partial<MockLoginResponse> = {}
): MockLoginResponse {
  return {
    user: createMockUser(),
    tokens: createMockAuthTokens(),
    ...overrides,
  };
}

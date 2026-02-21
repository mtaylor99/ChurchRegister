/**
 * MSW (Mock Service Worker) Request Handlers
 *
 * Defines mock API responses for testing and development.
 * These handlers intercept network requests and return mock data.
 *
 * @see https://mswjs.io/docs/basics/request-handler
 */

import { http, HttpResponse } from 'msw';
import { env } from '../config/env';

const API_BASE_URL = env.VITE_API_BASE_URL;

/**
 * Authentication Handlers
 */
export const authHandlers = [
  // Login
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Simulate successful login
    if (body.email === 'test@example.com' && body.password === 'AdminPassword123!') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['Admin'],
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
      });
    }

    // Simulate login failure
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register
  http.post(`${API_BASE_URL}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;

    return HttpResponse.json({
      user: {
        id: '2',
        email: body.email as string,
        firstName: body.firstName as string,
        lastName: body.lastName as string,
        roles: ['User'],
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      },
    });
  }),

  // Logout
  http.post(`${API_BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),
];

/**
 * Church Members Handlers
 */
export const churchMembersHandlers = [
  // Get all church members (paginated)
  http.get(`${API_BASE_URL}/api/church-members`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    return HttpResponse.json({
      items: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '555-0100',
          dateOfBirth: '1980-01-15',
          membershipDate: '2020-01-01',
          status: 1,
          address: {
            street: '123 Main St',
            city: 'London',
            postalCode: 'SW1A 1AA',
          },
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phoneNumber: '555-0101',
          dateOfBirth: '1985-05-20',
          membershipDate: '2019-06-15',
          status: 1,
          address: {
            street: '456 Oak Ave',
            city: 'Manchester',
            postalCode: 'M1 1AA',
          },
        },
      ],
      currentPage: page,
      pageSize: pageSize,
      totalCount: 50,
      totalPages: 3,
      hasPreviousPage: page > 1,
      hasNextPage: page < 3,
    });
  }),

  // Get single church member
  http.get(`${API_BASE_URL}/api/church-members/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id: Number(id),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '555-0100',
      dateOfBirth: '1980-01-15',
      membershipDate: '2020-01-01',
      status: 1,
      address: {
        street: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
      },
    });
  }),

  // Create church member
  http.post(`${API_BASE_URL}/api/church-members`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;

    return HttpResponse.json(
      {
        id: 999,
        ...(body as object),
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Update church member
  http.put(
    `${API_BASE_URL}/api/church-members/:id`,
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as Record<string, any>;

      return HttpResponse.json({
        id: Number(id),
        ...(body as object),
        updatedAt: new Date().toISOString(),
      });
    }
  ),

  // Delete church member
  http.delete(`${API_BASE_URL}/api/church-members/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];

/**
 * Contributions Handlers
 */
export const contributionsHandlers = [
  // Get all contributions (paginated)
  http.get(`${API_BASE_URL}/api/contributions`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    return HttpResponse.json({
      items: [
        {
          id: 1,
          memberId: 1,
          memberName: 'John Doe',
          amount: 50.0,
          date: '2024-01-15',
          type: 'Tithe',
          paymentMethod: 'Cash',
        },
        {
          id: 2,
          memberId: 2,
          memberName: 'Jane Smith',
          amount: 100.0,
          date: '2024-01-20',
          type: 'Offering',
          paymentMethod: 'Card',
        },
      ],
      currentPage: page,
      pageSize: pageSize,
      totalCount: 100,
      totalPages: 5,
      hasPreviousPage: page > 1,
      hasNextPage: page < 5,
    });
  }),

  // Create contribution
  http.post(`${API_BASE_URL}/api/contributions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;

    return HttpResponse.json(
      {
        id: 999,
        ...(body as object),
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),
];

/**
 * Users (Administration) Handlers
 */
export const usersHandlers = [
  // Get all users (paginated)
  http.get(`${API_BASE_URL}/api/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    return HttpResponse.json({
      items: [
        {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          jobTitle: 'System Administrator',
          status: 2,
          roles: ['SystemAdministrator'],
          dateJoined: '2020-01-01',
          emailConfirmed: true,
        },
        {
          id: '2',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          jobTitle: 'Member',
          status: 2,
          roles: ['User'],
          dateJoined: '2021-06-15',
          emailConfirmed: true,
        },
      ],
      currentPage: page,
      pageSize: pageSize,
      totalCount: 25,
      totalPages: 2,
      hasPreviousPage: page > 1,
      hasNextPage: page < 2,
    });
  }),

  // Get single user
  http.get(`${API_BASE_URL}/api/users/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id: String(id),
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      jobTitle: 'System Administrator',
      status: 2,
      roles: ['SystemAdministrator'],
      dateJoined: '2020-01-01',
      emailConfirmed: true,
    });
  }),
];

/**
 * Attendance Handlers
 */
export const attendanceHandlers = [
  // Get attendance records
  http.get(`${API_BASE_URL}/api/attendance`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;

    return HttpResponse.json({
      items: [
        {
          id: 1,
          eventId: 1,
          eventName: 'Sunday Service',
          date: '2024-01-21',
          attendance: 150,
        },
        {
          id: 2,
          eventId: 2,
          eventName: 'Bible Study',
          date: '2024-01-24',
          attendance: 45,
        },
      ],
      currentPage: page,
      pageSize: pageSize,
      totalCount: 50,
      totalPages: 3,
      hasPreviousPage: page > 1,
      hasNextPage: page < 3,
    });
  }),

  // Get events
  http.get(`${API_BASE_URL}/api/events`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Sunday Service', isActive: true },
      { id: 2, name: 'Bible Study', isActive: true },
      { id: 3, name: 'Prayer Meeting', isActive: true },
    ]);
  }),
];

/**
 * Combined handlers for all API endpoints
 */
export const handlers = [
  ...authHandlers,
  ...churchMembersHandlers,
  ...contributionsHandlers,
  ...usersHandlers,
  ...attendanceHandlers,
];

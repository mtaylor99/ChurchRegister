/**
 * API Seed Helpers
 *
 * Utility functions for seeding and cleaning up test data via the REST
 * API. Import these in spec files that need deterministic backend data.
 *
 * Usage:
 *   import { getAuthHeaders, deleteTestMembers } from '../helpers/api-seed';
 *
 *   test.beforeAll(async ({ request }) => {
 *     const headers = await getAuthHeaders(request);
 *     await seedTestMember(request, headers);
 *   });
 */

import { type APIRequestContext } from '@playwright/test';

const API_URL =
  process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:5502';

/** Shape returned by POST /api/auth/login */
interface LoginResponse {
  token?: string;
  accessToken?: string;
}

/**
 * Obtain a bearer token from the API using the admin test credentials.
 * The token can be passed as an Authorization header in subsequent calls.
 */
export async function getAdminToken(
  request: APIRequestContext
): Promise<string> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email:
        process.env.TEST_ADMIN_EMAIL ?? 'admin@churchregister.com',
      password:
        process.env.TEST_ADMIN_PASSWORD ?? 'AdminPassword123!',
    },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to obtain admin token: ${response.status()} ${await response.text()}`
    );
  }

  const body = (await response.json()) as LoginResponse;
  const token = body.token ?? body.accessToken;
  if (!token) {
    throw new Error('Login response contained no token');
  }
  return token;
}

/**
 * Build the Authorization header object for the given bearer token.
 */
export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

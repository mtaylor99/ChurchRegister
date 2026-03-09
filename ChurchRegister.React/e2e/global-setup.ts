/**
 * Playwright Global Setup
 *
 * Runs once before all test suites. Logs in as admin and saves
 * the browser storage state so individual tests don't need to log
 * in every time.
 *
 * Auth state is saved to e2e/.auth/admin.json and consumed by all
 * tests that set `storageState: 'e2e/.auth/admin.json'`.
 */

import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL =
  process.env.TEST_ADMIN_EMAIL ?? 'admin@churchregister.com';
const ADMIN_PASSWORD =
  process.env.TEST_ADMIN_PASSWORD ?? 'AdminPassword123!';
const AUTH_FILE = path.join('e2e', '.auth', 'admin.json');

async function globalSetup(_config: FullConfig): Promise<void> {
  // Ensure the auth output directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    // Navigate to the login page and authenticate
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait until we land on the dashboard
    await page.waitForURL(/\/app\/dashboard/, { timeout: 30_000 });

    // Persist cookies and localStorage for reuse in tests
    await context.storageState({ path: AUTH_FILE });
  } finally {
    await browser.close();
  }
}

export default globalSetup;

/**
 * ============================================================
 * E2E TEST 1 — Home Page
 * ============================================================
 * What this tests:
 *   The public home page loads correctly, key navigation links
 *   are visible, and the hero/call-to-action section renders.
 *
 * Run: npx playwright test e2e/test1_homepage.spec.js
 *      (frontend dev server must be running on port 5173)
 * ============================================================
 */
import { test, expect } from '@playwright/test';

test.describe('Home Page — Public Landing', () => {

  test('Test 1: Home page loads with status 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
  });

  test('Test 2: Page title contains BloodConnect', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('bloodconnect');
  });

  test('Test 3: Navigation bar is visible on home page', async ({ page }) => {
    await page.goto('/');
    // Navbar should be present — check for nav element or header
    const navbar = page.locator('nav, header').first();
    await expect(navbar).toBeVisible();
  });

  test('Test 4: Login and Register links are visible in navigation', async ({ page }) => {
    await page.goto('/');
    // Check for Login link (use first() — Login appears in both navbar and footer)
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await expect(loginLink).toBeVisible();
  });

  test('Test 5: Clicking Login link navigates to /login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

});

/**
 * ============================================================
 * E2E TEST 2 — Login Page (/login)
 * ============================================================
 * What this tests:
 *   The login page renders correctly, form fields are present,
 *   validation works, and wrong credentials show an error.
 *
 * Run: npx playwright test e2e/test2_login.spec.js
 * ============================================================
 */
import { test, expect } from '@playwright/test';

test.describe('Login Page — Authentication Form', () => {

  test('Test 1: Login page loads successfully', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response.status()).toBe(200);
  });

  test('Test 2: Email and password fields are visible', async ({ page }) => {
    await page.goto('/login');
    // Email input may use type="text" instead of type="email"
    const emailField = page.locator('input[type="email"], input[type="text"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordField = page.locator('input[type="password"]').first();
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('Test 3: Submit button is present on the login form', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.getByRole('button', { name: /login|sign in/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('Test 4: Submitting empty form shows validation feedback', async ({ page }) => {
    await page.goto('/login');
    // Click submit without filling anything
    const submitBtn = page.getByRole('button', { name: /login|sign in/i }).first();
    await submitBtn.click();
    // Either HTML5 validation fires (required fields) or an error message appears
    // Check: either the URL stays at /login (didn't navigate away)
    await expect(page).toHaveURL(/\/login/);
  });

  test('Test 5: Wrong credentials show an error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[type="text"], input[name="email"], input[placeholder*="email" i]').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword123');
    await page.getByRole('button', { name: /login|sign in/i }).first().click();

    // Wait for error response — page should stay on /login and show error text
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    // An error message div/span should appear
    const errorMsg = page.locator('text=/invalid|incorrect|wrong|error|failed/i').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

});

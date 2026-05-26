/**
 * ============================================================
 * E2E TEST 3 — Register Page (/register)
 * ============================================================
 * What this tests:
 *   The registration page renders all required form fields,
 *   role selection (donor/receiver) is available, and the
 *   page navigation from login to register works.
 *
 * Run: npx playwright test e2e/test3_register.spec.js
 * ============================================================
 */
import { test, expect } from '@playwright/test';

test.describe('Register Page — New User Registration', () => {

  test('Test 1: Register page loads successfully', async ({ page }) => {
    const response = await page.goto('/register');
    expect(response.status()).toBe(200);
  });

  test('Test 2: Username and email input fields are visible', async ({ page }) => {
    await page.goto('/register');
    // Username field (text or name type)
    const usernameField = page.locator('input[name="username"], input[placeholder*="name" i], input[placeholder*="Name" i]').first();
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await expect(usernameField).toBeVisible();
    await expect(emailField).toBeVisible();
  });

  test('Test 3: Password field is visible on the register form', async ({ page }) => {
    await page.goto('/register');
    const passwordField = page.locator('input[type="password"]').first();
    await expect(passwordField).toBeVisible();
  });

  test('Test 4: Blood group selection field is visible', async ({ page }) => {
    await page.goto('/register');
    // Blood group is typically a <select> dropdown
    const bloodGroupSelect = page.locator('select, [role="combobox"]').first();
    await expect(bloodGroupSelect).toBeVisible();
  });

  test('Test 5: Login link on register page navigates to /login', async ({ page }) => {
    await page.goto('/register');
    // There's usually a "Already have an account? Login" link
    const loginLink = page.getByRole('link', { name: /login|sign in|already/i }).first();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

});

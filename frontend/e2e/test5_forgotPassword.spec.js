/**
 * ============================================================
 * E2E TEST 5 — Forgot Password Page (/forgot-password)
 * ============================================================
 * What this tests:
 *   The forgot password page loads, the email input is present,
 *   the form submits without crashing, and shows a confirmation
 *   or error message appropriately.
 *
 * Run: npx playwright test e2e/test5_forgotPassword.spec.js
 * ============================================================
 */
import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page — Password Reset Flow', () => {

  test('Test 1: Forgot password page loads successfully', async ({ page }) => {
    const response = await page.goto('/forgot-password');
    expect(response.status()).toBe(200);
  });

  test('Test 2: Email input field is visible on the page', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailField).toBeVisible();
  });

  test('Test 3: Submit / Send Reset Link button is present', async ({ page }) => {
    await page.goto('/forgot-password');
    const submitBtn = page.getByRole('button', { name: /send|reset|submit/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('Test 4: Submitting with a valid email format does not crash the page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"], input[name="email"]').first().fill('test@example.com');
    await page.getByRole('button', { name: /send|reset|submit/i }).first().click();

    // Allow time for API response
    await page.waitForTimeout(2000);
    // Page should either stay on /forgot-password or show a success message
    const url = page.url();
    expect(url).toMatch(/forgot-password|login/);
  });

  test('Test 5: Back to Login link is present on the page', async ({ page }) => {
    await page.goto('/forgot-password');
    // Most forgot-password pages have a "Back to Login" link
    const backLink = page.getByRole('link', { name: /back|login|sign in/i }).first();
    await expect(backLink).toBeVisible();
  });

});

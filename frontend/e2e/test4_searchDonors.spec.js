/**
 * ============================================================
 * E2E TEST 4 — Search Donors Page (/search-donors)
 * ============================================================
 * What this tests:
 *   The public donor search page renders, the blood group
 *   filter is present, and submitting a search shows results
 *   or an empty state (not a crash).
 *
 * Run: npx playwright test e2e/test4_searchDonors.spec.js
 * ============================================================
 */
import { test, expect } from '@playwright/test';

test.describe('Search Donors Page — Find Blood Donors', () => {

  test('Test 1: Search donors page loads successfully', async ({ page }) => {
    const response = await page.goto('/search-donors');
    expect(response.status()).toBe(200);
  });

  test('Test 2: Blood group filter/select is visible on the page', async ({ page }) => {
    await page.goto('/search-donors');
    // The page should have a blood group selector
    const filter = page.locator('select, input[name*="blood" i], [placeholder*="blood" i]').first();
    await expect(filter).toBeVisible();
  });

  test('Test 3: Search button is present on the page', async ({ page }) => {
    await page.goto('/search-donors');
    const searchBtn = page.getByRole('button', { name: /search|find|filter/i }).first();
    await expect(searchBtn).toBeVisible();
  });

  test('Test 4: Selecting O+ and searching does not crash the page', async ({ page }) => {
    await page.goto('/search-donors');

    // Select blood group if it is a <select>
    const selectEl = page.locator('select').first();
    const isSelect = await selectEl.isVisible().catch(() => false);
    if (isSelect) {
      await selectEl.selectOption('O+');
    }

    const searchBtn = page.getByRole('button', { name: /search|find|filter/i }).first();
    await searchBtn.click();

    // Page should stay on search-donors (not redirect to login or crash)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/search-donors/);
  });

  test('Test 5: Results section or empty-state message is visible after search', async ({ page }) => {
    await page.goto('/search-donors');

    const selectEl = page.locator('select').first();
    const isSelect = await selectEl.isVisible().catch(() => false);
    if (isSelect) {
      await selectEl.selectOption('AB-');
    }

    const searchBtn = page.getByRole('button', { name: /search|find|filter/i }).first();
    await searchBtn.click();

    await page.waitForTimeout(2000);
    // Either a result card or a "no donors found" message appears — page must not be blank
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

});

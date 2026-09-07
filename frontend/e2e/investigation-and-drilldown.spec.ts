import { test, expect } from '@playwright/test';

test.describe('DataSense AI - Interactive Investigation & Deep Dive Suite', () => {
  test('should trigger finding drilldown modal with multivariate evidence points', async ({ page }) => {
    await page.goto('/');

    // 1. Navigate to Insights View
    const navInsights = page.locator('button:has-text("Deep Dive Insights")').first();
    await navInsights.click();

    // 2. Click "Investigate This Finding" on first insight card
    const investigateBtn = page.locator('button:has-text("Investigate This Finding")').first();
    await expect(investigateBtn).toBeVisible();
    await investigateBtn.click();

    // 3. Drilldown modal dialog should appear
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();

    // 4. Verify Root-Cause Title and Evidence Points
    const modalTitle = modal.locator('h3:has-text("Root Cause Analysis"), h3:has-text("Deep Dive")').first();
    await expect(modalTitle).toBeVisible();

    const evidenceSection = modal.locator('text=Statistical Evidence Points').first();
    await expect(evidenceSection).toBeVisible();

    // 5. Close Modal
    const closeBtn = modal.locator('button:has-text("Done"), button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });

  test('should verify data cleaning audit and export controls', async ({ page }) => {
    await page.goto('/');

    // 1. Navigate to Data Cleaning View
    const navCleaning = page.locator('button:has-text("Data Cleaning")').first();
    await navCleaning.click();

    // 2. Verify Cleaning Summary Cards or Audit Trail
    await expect(page.locator('text=Data Health Score, text=Health Score, text=Cleaning Audit').first()).toBeVisible();

    // 3. Verify Download Buttons exist
    const exportCsvBtn = page.locator('button:has-text("CSV"), a:has-text("CSV"), button:has-text("Export")').first();
    await expect(exportCsvBtn).toBeVisible();
  });
});

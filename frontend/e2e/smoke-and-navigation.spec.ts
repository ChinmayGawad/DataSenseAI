import { test, expect } from '@playwright/test';

test.describe('DataSense AI - Smoke & Responsive Navigation Suite', () => {
  test('should load the home page and render key navigation elements', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Branding and Title
    await expect(page).toHaveTitle(/DataSense AI|DataSense/i);
    const branding = page.locator('text=DataSense AI').first();
    await expect(branding).toBeVisible();

    // 2. Verify View Switcher items in Sidebar
    const navDashboard = page.locator('button:has-text("Presentation Dashboard")').first();
    const navInsights = page.locator('button:has-text("Deep Dive Insights")').first();
    const navCleaning = page.locator('button:has-text("Data Cleaning")').first();
    const navScorecard = page.locator('button:has-text("Evaluation Scorecard")').first();

    await expect(navDashboard).toBeVisible();
    await expect(navInsights).toBeVisible();
    await expect(navCleaning).toBeVisible();
    await expect(navScorecard).toBeVisible();

    // 3. Test Navigation to Insights View
    await navInsights.click();
    await expect(page.locator('header span:has-text("insights")').first()).toBeVisible();

    // 4. Test Navigation to Data Cleaning View
    await navCleaning.click();
    await expect(page.locator('header span:has-text("cleaning")').first()).toBeVisible();

    // 5. Test Navigation to Evaluation Scorecard
    await navScorecard.click();
    await expect(page.locator('header span:has-text("evaluation")').first()).toBeVisible();
  });

  test('should support mobile drawer toggle and auto-dismiss on view selection', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 1. Hamburger button should be visible on mobile
    const hamburgerBtn = page.locator('button[title="Open navigation menu"]');
    await expect(hamburgerBtn).toBeVisible();

    // 2. Click hamburger button to open mobile drawer
    await hamburgerBtn.click();

    // 3. Mobile overlay drawer should become visible
    const mobileDrawer = page.locator('.fixed.inset-0.z-50');
    await expect(mobileDrawer).toBeVisible();

    // 4. Select a navigation item inside the drawer
    const drawerInsightsBtn = mobileDrawer.locator('button:has-text("Deep Dive Insights")');
    await drawerInsightsBtn.click();

    // 5. Mobile drawer should auto-dismiss
    await expect(mobileDrawer).not.toBeVisible();

    // 6. View should reflect Insights
    await expect(page.locator('header span:has-text("insights")').first()).toBeVisible();
  });
});

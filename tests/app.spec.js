import { test, expect } from '@playwright/test';

test('Game loads successfully', async ({ page }) => {
    await page.goto('/');

    // 1. Check title
    await expect(page).toHaveTitle(/Baseball/i);

    // 2. Check for canvas (game element)
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // 3. Check for specific UI element (e.g., Start button or container)
    const startScreen = page.locator('#start-screen');
    await expect(startScreen).toBeVisible();
});

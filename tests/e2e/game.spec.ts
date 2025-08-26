import { test, expect } from '@playwright/test';

test.describe('Pokémon Auto Battle game flow', () => {
  test('start game, win a battle and purchase upgrade', async ({ page }) => {
    // Visit home page
    await page.goto('/');
    // Click Play button
    await page.getByRole('button', { name: /play/i }).click();
    // Wait for starter selection overlay and then for it to disappear
    await page.waitForSelector('div[role="dialog"]', { state: 'visible' });
    await page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
    // Start the first battle
    await page.getByRole('button', { name: /start/i }).click();
    // Wait for battle to finish (won)
    await page.getByText(/next battle/i).waitFor();
    // Purchase first upgrade if affordable
    const upgradeButtons = await page.getByRole('button', { name: /coins/i }).all();
    if (upgradeButtons.length > 0) {
      await upgradeButtons[0].click();
    }
  });
});
const { test, expect } = require('@playwright/test');

test.describe('REQ-011: username is required before sending', () => {
  for (const username of ['', '   ']) {
    test(`REQ-011: rejects ${username === '' ? 'an empty' : 'a whitespace-only'} username`, async ({ page }) => {
      await page.goto('/');

      const transcript = page.locator('#messages');
      const transcriptBeforeSend = await transcript.innerHTML();

      await page.locator('#nombre').fill(username);
      await page.locator('#m').fill('A real message that must not be sent.');
      await page.getByRole('button', { name: 'Send' }).click();

      await expect(page.locator('#nombre')).toHaveValue('');
      await expect(transcript).toHaveJSProperty('innerHTML', transcriptBeforeSend);
      await expect(page.locator('#error')).toContainText(/write\s+(?:a\s+)?name|escrib(?:e|a)\s+(?:un\s+)?nombre/i);
    });
  }
});

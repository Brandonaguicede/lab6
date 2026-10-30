const { test, expect } = require('@playwright/test');

test.describe('REQ-012 - message-length limit', () => {
  test('REQ-012 accepts 279- and 280-character messages', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nombre').fill('REQ-012 visitor');

    const field = page.locator('#m');
    const transcript = page.locator('#messages');

    for (const length of [279, 280]) {
      const message = 'a'.repeat(length);

      await field.fill(message);
      await page.getByRole('button', { name: 'Send', exact: true }).click();

      await expect(transcript).toContainText(message);
    }
  });

  test('REQ-012 rejects 281-character and much longer messages without clearing the field', async ({ page }) => {
    await page.goto('/');
    await page.locator('#nombre').fill('REQ-012 visitor');

    const field = page.locator('#m');
    const transcript = page.locator('#messages');
    const error = page.locator('#error');

    for (const length of [281, 1024]) {
      const message = 'b'.repeat(length);

      await field.fill(message);
      await page.getByRole('button', { name: 'Send', exact: true }).click();

      await expect(field).toHaveValue(message);
      await expect(transcript).not.toContainText(message);
      await expect(error).toContainText(/too long|demasiado largo/i);
    }
  });
});

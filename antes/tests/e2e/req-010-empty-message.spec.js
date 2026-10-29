const { test, expect } = require('@playwright/test');

const WRITE_SOMETHING_NOTICE = /(?:write|enter|type|escribe|ingresa|introduce)\s+(?:something|a message|algo|un mensaje)|(?:something|a message|algo|un mensaje)\s+(?:to write|to enter|to type|para escribir|para ingresar|para introducir)/i;

const invalidMessages = [
  ['empty message', ''],
  ['spaces-only message', '   \t  '],
  ['line-breaks-only message', '\n\n']
];

for (const [description, message] of invalidMessages) {
  test(`REQ-010: Send rejects a ${description}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#nombre').fill('Ana');

    const transcript = page.locator('#messages');
    const transcriptBefore = await transcript.innerHTML();

    await page.locator('#m').fill(message);
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('#error')).toContainText(WRITE_SOMETHING_NOTICE);
    await expect(transcript).toHaveJSProperty('innerHTML', transcriptBefore);
    await expect(page.locator('#m')).toHaveValue('');
  });
}

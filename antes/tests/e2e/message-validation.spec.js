const { test, expect } = require('@playwright/test');

async function submit(page, nombre, mensaje) {
  await page.locator('#nombre').fill(nombre);
  await page.locator('#m').fill(mensaje);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('REQ-010: un mensaje vacio o solo espacios no se publica y se explica el problema', async ({ page }) => {
  await submit(page, 'Ana', '   ');

  await expect(page.locator('#messages li')).toHaveCount(0);
  await expect(page.locator('#m')).toHaveValue('');
  await expect(page.locator('#error')).toContainText('Escribe un mensaje.');
});

test('REQ-010: saltos de linea se consideran un mensaje vacio', async ({ page }) => {
  await page.locator('#nombre').fill('Ana');
  await page.locator('#m').evaluate(function (input) { input.value = '\n\n'; });
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.locator('#messages li')).toHaveCount(0);
  await expect(page.locator('#m')).toHaveValue('');
  await expect(page.locator('#error')).toContainText('Escribe un mensaje.');
});

test('REQ-011: un nombre vacio o solo espacios no se publica y se solicita nombre', async ({ page }) => {
  await submit(page, '   ', 'Mensaje real');

  await expect(page.locator('#messages li')).toHaveCount(0);
  await expect(page.locator('#nombre')).toHaveValue('');
  await expect(page.locator('#m')).toHaveValue('Mensaje real');
  await expect(page.locator('#error')).toContainText('Escribe un nombre.');
});

test('REQ-012: 279 y 280 caracteres se publican', async ({ page }) => {
  await submit(page, 'Ana', 'a'.repeat(279));
  await expect(page.locator('#messages li')).toHaveCount(1);
  await expect(page.locator('#m')).toHaveValue('');

  await submit(page, 'Ana', 'b'.repeat(280));
  await expect(page.locator('#messages li')).toHaveCount(2);
  await expect(page.locator('#m')).toHaveValue('');
});

test('REQ-012: 281 caracteres no se publican, se conservan y muestran el limite', async ({ page }) => {
  var tooLong = 'a'.repeat(281);
  await submit(page, 'Ana', tooLong);

  await expect(page.locator('#messages li')).toHaveCount(0);
  await expect(page.locator('#m')).toHaveValue(tooLong);
  await expect(page.locator('#error')).toContainText('El mensaje es demasiado largo');
});

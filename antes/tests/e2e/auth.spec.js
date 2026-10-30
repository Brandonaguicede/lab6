'use strict';

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

test.beforeEach(async function ({ page }) {
  await page.goto('/');
});

test('US-01: el chat permanece protegido antes de iniciar sesion', async function ({ page }) {
  await expect(page.getByRole('button', { name: 'Iniciar sesion con Google' })).toBeVisible();
  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#identity')).toContainText('Sin autenticar');
});

test('US-01: iniciar sesion muestra identidad y habilita el chat', async function ({ page }) {
  await page.getByRole('button', { name: 'Iniciar sesion con Google' }).click();

  await expect(page.locator('#identity')).toContainText('Ana');
  await expect(page.locator('#chat-form')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar sesion' })).toBeVisible();
});

test('US-01: cerrar sesion desconecta y vuelve a proteger el chat', async function ({ page }) {
  await page.getByRole('button', { name: 'Iniciar sesion con Google' }).click();
  await expect(page.locator('#chat-form')).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesion' }).click();

  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#identity')).toContainText('Sin autenticar');
});

test('US-01: una sesion autenticada se restaura y el logout exige autenticarse otra vez', async function ({ page }) {
  await page.getByRole('button', { name: 'Iniciar sesion con Google' }).click();
  await expect(page.locator('#chat-form')).toBeVisible();

  await page.reload();
  await expect(page.locator('#identity')).toContainText('Ana');
  await expect(page.locator('#chat-form')).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesion' }).click();
  await page.reload();
  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#identity')).toContainText('Sin autenticar');
});

test('US-01: cancelar el proveedor deja el chat protegido y muestra un error generico', async function ({ page }) {
  await page.goto('/?error=access_denied&error_description=provider-sensitive-detail');

  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#error')).toContainText('Tu sesion no es valida');
  await expect(page.locator('#error')).not.toContainText('provider-sensitive-detail');
  await expect(page).toHaveURL('/');
});

const { test, expect } = require('@playwright/test');

const TEST_IMAGE = 'https://media.test/una-chat-image.png';
const TEST_YOUTUBE = 'https://www.youtube.com/watch?v=qYwlqx-JLok';
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2JwAAAABJRU5ErkJggg==', 'base64');

async function send(page, text) {
  await page.locator('#m').fill(text);
  await page.getByRole('button', { name: 'Enviar' }).click();
}

async function signIn(page) {
  await page.getByRole('button', { name: 'Iniciar sesion con Google' }).click();
  await expect(page.locator('#identity')).toContainText('Ana');
}

test.beforeEach(async ({ page }) => {
  await page.route(TEST_IMAGE, async route => route.fulfill({ contentType: 'image/png', body: PNG_1X1 }));
  await page.route('https://www.youtube-nocookie.com/**', async route => route.fulfill({ contentType: 'text/html', body: '<title>Vídeo de prueba</title>' }));
  await page.goto('/');
  await signIn(page);
});

test('E2E: una URL válida de imagen aparece y termina de cargar', async ({ page }) => {
  await send(page, TEST_IMAGE);
  var image = page.locator('#messages img[src="' + TEST_IMAGE + '"]');
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
});

test('E2E: un vídeo de YouTube permitido muestra y carga un reproductor restringido', async ({ page }) => {
  await send(page, TEST_YOUTUBE);
  var player = page.locator('#messages iframe[title="Video de YouTube"]');
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/qYwlqx-JLok');
  await expect(player).toHaveAttribute('data-loaded', 'true');
});

test('E2E: un script no genera alert ni se publica como HTML', async ({ page }) => {
  var dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await send(page, "<script>alert('Inyección de script');</script>");
  await expect(page.locator('#messages script')).toHaveCount(0);
  await expect(page.locator('#messages')).not.toContainText('Inyección de script');
  await expect(page.locator('#error')).toContainText('MENSAJE_HTML_NO_PERMITIDO');
  expect(dialogs).toEqual([]);
});

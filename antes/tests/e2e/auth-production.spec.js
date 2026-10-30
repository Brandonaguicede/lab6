'use strict';

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

var RUNTIME_CONFIG = {
  ready: true,
  auth0Domain: 'tenant.example.auth0.com',
  auth0ClientId: 'public-client-id',
  auth0Audience: 'https://api.example.test',
  auth0RedirectUri: 'http://127.0.0.1:3000',
  socketUrl: 'http://127.0.0.1:3000',
  testMode: false
};

var AUTH0_STUB = [
  "window.auth0 = { createAuth0Client: async function (options) {",
  "  sessionStorage.setItem('sdk-options', JSON.stringify(options));",
  "  return {",
  "    isAuthenticated: async function () { return sessionStorage.getItem('sdk-auth') === '1'; },",
  "    loginWithRedirect: async function (options) {",
  "      sessionStorage.setItem('sdk-login', JSON.stringify(options));",
  "      sessionStorage.setItem('sdk-auth', '1');",
  "      window.location.assign('/?code=stub-code&state=stub-state');",
  "      return new Promise(function () {});",
  "    },",
  "    handleRedirectCallback: async function () { sessionStorage.setItem('sdk-callback', '1'); },",
  "    getUser: async function () { return { sub: 'test|ana', name: 'Ana' }; },",
  "    getTokenSilently: async function () {",
  "      var count = Number(sessionStorage.getItem('sdk-token-count') || '0') + 1;",
  "      sessionStorage.setItem('sdk-token-count', String(count));",
  "      if (sessionStorage.getItem('sdk-fail-token') === '1') throw new Error('TOKEN_FAILED');",
  "      return 'test-token-ana';",
  "    },",
  "    logout: async function (options) {",
  "      sessionStorage.setItem('sdk-logout', JSON.stringify(options));",
  "      sessionStorage.removeItem('sdk-auth');",
  "      if (sessionStorage.getItem('sdk-fail-logout') === '1') throw new Error('LOGOUT_FAILED');",
  "    }",
  "  };",
  "} };"
].join('\n');

async function installProductionAuthBoundary(page) {
  await page.route('**/runtime-config.js', function (route) {
    return route.fulfill({
      contentType: 'application/javascript',
      body: 'window.UNA_CHAT_CONFIG = ' + JSON.stringify(RUNTIME_CONFIG) + ';'
    });
  });
  await page.route('https://cdn.auth0.com/js/auth0-spa-js/**', function (route) {
    return route.fulfill({ contentType: 'application/javascript', body: AUTH0_STUB });
  });
  await page.route('**/socket.io/socket.io.js', async function (route) {
    var response = await route.fetch();
    var body = await response.text();
    await route.fulfill({
      response: response,
      body: body + "\nwindow.__unaIo = window.io; window.io = function () { var socket = window.__unaIo.apply(this, arguments); window.__unaSocket = socket; return socket; };"
    });
  });
}

async function signInThroughStubbedUniversalLogin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesion con Google' }).click();
  await expect(page.locator('#identity')).toContainText('Ana');
  await expect(page.locator('#chat-form')).toBeVisible();
}

test.beforeEach(async function ({ page }) {
  await installProductionAuthBoundary(page);
});

test('US-01 production branch: configura el SDK, procesa callback y cierra sesion', async function ({ page }) {
  await signInThroughStubbedUniversalLogin(page);

  var sdkState = await page.evaluate(function () {
    return {
      options: JSON.parse(sessionStorage.getItem('sdk-options')),
      login: JSON.parse(sessionStorage.getItem('sdk-login')),
      callback: sessionStorage.getItem('sdk-callback')
    };
  });
  expect(sdkState.options.cacheLocation).toBe('memory');
  expect(sdkState.options.authorizationParams.audience).toBe(RUNTIME_CONFIG.auth0Audience);
  expect(sdkState.options.authorizationParams.redirect_uri).toBe(RUNTIME_CONFIG.auth0RedirectUri);
  expect(sdkState.login.authorizationParams.connection).toBe('google-oauth2');
  expect(sdkState.callback).toBe('1');
  await expect(page).toHaveURL('/');

  await page.getByRole('button', { name: 'Cerrar sesion' }).click();
  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#identity')).toContainText('Sin autenticar');
});

test('US-01 production branch: un fallo de logout conserva el chat protegido', async function ({ page }) {
  await signInThroughStubbedUniversalLogin(page);
  await page.evaluate(function () { sessionStorage.setItem('sdk-fail-logout', '1'); });

  await page.getByRole('button', { name: 'Cerrar sesion' }).click();

  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#identity')).toContainText('Sin autenticar');
  await expect(page.locator('#error')).toContainText('Tu sesion no es valida');
});

test('US-01 production branch: la reconexion renueva token y falla cerrada', async function ({ page }) {
  await signInThroughStubbedUniversalLogin(page);
  var initialCount = Number(await page.evaluate(function () { return sessionStorage.getItem('sdk-token-count'); }));

  await page.evaluate(function () { window.__unaSocket.io.engine.close(); });
  await expect.poll(async function () {
    return Number(await page.evaluate(function () { return sessionStorage.getItem('sdk-token-count'); }));
  }).toBeGreaterThan(initialCount);
  await expect(page.locator('#chat-form')).toBeVisible();

  await page.evaluate(function () {
    sessionStorage.setItem('sdk-fail-token', '1');
    window.__unaSocket.io.engine.close();
  });
  await expect(page.locator('#chat-form')).toBeHidden();
  await expect(page.locator('#error')).toContainText('Tu sesion no es valida');
});

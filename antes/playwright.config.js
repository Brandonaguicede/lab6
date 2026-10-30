const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3000', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
    env: Object.assign({}, process.env, { NODE_ENV: 'test', AUTH_TEST_MODE: '1' })
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

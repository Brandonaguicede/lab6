'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var buildFrontend = require('../scripts/build-frontend').buildFrontend;

function deploymentEnv(overrides) {
  return Object.assign({
    AUTH0_DOMAIN: 'tenant.example.auth0.com',
    AUTH0_AUDIENCE: 'https://api.example.test',
    AUTH0_CLIENT_ID: 'public-client-id',
    AUTH0_REDIRECT_URI: 'https://chat.example.test',
    SOCKET_URL: 'https://socket.example.test',
    ALLOWED_ORIGINS: 'https://chat.example.test',
    AUTH0_CLIENT_SECRET: 'secret-sentinel-must-not-ship'
  }, overrides);
}

describe('Vercel static frontend build', function () {
  var outputDirectory;

  beforeEach(function () {
    outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'una-chat-build-'));
  });

  afterEach(function () {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  });

  it('emits only static browser assets and public runtime values', function () {
    buildFrontend({ env: deploymentEnv(), outputDirectory: outputDirectory });

    assert.deepEqual(fs.readdirSync(outputDirectory).sort(), ['client.js', 'index.html', 'runtime-config.js']);
    var runtime = fs.readFileSync(path.join(outputDirectory, 'runtime-config.js'), 'utf8');
    assert.match(runtime, /tenant\.example\.auth0\.com/);
    assert.match(runtime, /https:\/\/socket\.example\.test/);
    assert.equal(runtime.includes('secret-sentinel-must-not-ship'), false);
  });

  it('refuses incomplete or test-mode production builds', function () {
    assert.throws(function () {
      buildFrontend({ env: {}, outputDirectory: outputDirectory });
    }, /AUTH_CONFIGURATION_REQUIRED/);
    assert.throws(function () {
      buildFrontend({
        env: deploymentEnv({ NODE_ENV: 'test', AUTH_TEST_MODE: '1' }),
        outputDirectory: outputDirectory
      });
    }, /AUTH_TEST_MODE_FORBIDDEN/);
  });
});

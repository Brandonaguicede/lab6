'use strict';

var assert = require('assert');
var auth0 = require('../libs/auth0');

function deploymentEnv(overrides) {
  return Object.assign({
    AUTH0_DOMAIN: 'tenant.example.auth0.com',
    AUTH0_AUDIENCE: 'https://api.example.test',
    AUTH0_CLIENT_ID: 'public-client-id',
    APP_URL: 'https://chat.example.test',
    AUTH0_CLIENT_SECRET: 'secret-sentinel-must-not-ship'
  }, overrides);
}

describe('unified Node deployment configuration', function () {
  it('derives browser, Socket.IO and CORS origins from APP_URL', function () {
    var internal = auth0.loadAuthConfig(deploymentEnv());
    var runtime = auth0.publicRuntimeConfig(deploymentEnv());

    assert.equal(internal.redirectUri, 'https://chat.example.test');
    assert.equal(internal.socketUrl, 'https://chat.example.test');
    assert.deepEqual(internal.allowedOrigins, ['https://chat.example.test']);
    assert.equal(runtime.auth0RedirectUri, 'https://chat.example.test');
    assert.equal(runtime.socketUrl, 'https://chat.example.test');
    assert.equal(JSON.stringify(runtime).includes('secret-sentinel-must-not-ship'), false);
  });

  it('accepts local HTTP but requires HTTPS for non-local deployments', function () {
    assert.equal(auth0.loadAuthConfig(deploymentEnv({ APP_URL: 'http://127.0.0.1:3000' })).ready, true);
    assert.equal(auth0.loadAuthConfig(deploymentEnv({ APP_URL: 'http://chat.example.test' })).ready, false);
  });
});

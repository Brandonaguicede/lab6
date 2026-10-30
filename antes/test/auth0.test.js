'use strict';

var assert = require('assert');
var auth0 = require('../libs/auth0');

function validEnv(overrides) {
  return Object.assign({
    AUTH0_DOMAIN: 'tenant.example.auth0.com',
    AUTH0_AUDIENCE: 'https://api.example.test',
    AUTH0_CLIENT_ID: 'public-client-id',
    AUTH0_REDIRECT_URI: 'https://chat.example.test',
    SOCKET_URL: 'https://socket.example.test',
    ALLOWED_ORIGINS: 'https://chat.example.test,http://127.0.0.1:3000'
  }, overrides);
}

describe('Auth0 runtime configuration', function () {
  it('fails closed and identifies missing required values', function () {
    var config = auth0.loadAuthConfig({});

    assert.equal(config.ready, false);
    assert.deepEqual(config.missing, [
      'AUTH0_DOMAIN',
      'AUTH0_AUDIENCE',
      'AUTH0_CLIENT_ID',
      'AUTH0_REDIRECT_URI',
      'SOCKET_URL',
      'ALLOWED_ORIGINS'
    ]);
  });

  it('normalizes issuer, JWKS URI and exact allowed origins', function () {
    var config = auth0.loadAuthConfig(validEnv());

    assert.equal(config.ready, true);
    assert.equal(config.issuer, 'https://tenant.example.auth0.com/');
    assert.equal(config.jwksUri, 'https://tenant.example.auth0.com/.well-known/jwks.json');
    assert.deepEqual(config.algorithms, ['RS256']);
    assert.deepEqual(config.allowedOrigins, ['https://chat.example.test', 'http://127.0.0.1:3000']);
  });

  it('exposes only public browser configuration', function () {
    var config = auth0.publicRuntimeConfig(validEnv({ AUTH0_CLIENT_SECRET: 'never-public' }));

    assert.deepEqual(config, {
      ready: true,
      auth0Domain: 'tenant.example.auth0.com',
      auth0ClientId: 'public-client-id',
      auth0Audience: 'https://api.example.test',
      auth0RedirectUri: 'https://chat.example.test',
      socketUrl: 'https://socket.example.test',
      testMode: false
    });
    assert.equal(JSON.stringify(config).includes('never-public'), false);
  });
});

describe('Auth0 access-token verifier', function () {
  it('passes issuer, audience and RS256 restrictions to JWT verification', async function () {
    var observed;
    var getKey = function () {};
    var verifier = auth0.createAuth0Verifier(auth0.loadAuthConfig(validEnv()), {
      createRemoteJWKSet: function () { return getKey; },
      jwtVerify: async function (token, key, options) {
        observed = { token: token, key: key, options: options };
        return { payload: { sub: 'google-oauth2|123', name: 'Ana' } };
      }
    });

    var principal = await verifier('signed-token');

    assert.deepEqual(principal, { sub: 'google-oauth2|123', displayName: 'Ana' });
    assert.equal(observed.token, 'signed-token');
    assert.equal(observed.key, getKey);
    assert.deepEqual(observed.options, {
      issuer: 'https://tenant.example.auth0.com/',
      audience: 'https://api.example.test',
      algorithms: ['RS256']
    });
  });

  it('rejects missing tokens and configurations without provider values', async function () {
    var configured = auth0.createAuth0Verifier(auth0.loadAuthConfig(validEnv()), {});
    var unconfigured = auth0.createAuth0Verifier(auth0.loadAuthConfig({}), {});

    await assert.rejects(function () { return configured(); }, { code: 'TOKEN_MISSING' });
    await assert.rejects(function () { return unconfigured('token'); }, { code: 'AUTH_CONFIGURATION_REQUIRED' });
  });

  it('uses the verified subject when no display claim is present', async function () {
    var verifier = auth0.createAuth0Verifier(auth0.loadAuthConfig(validEnv()), {
      createRemoteJWKSet: function () { return function () {}; },
      jwtVerify: async function () { return { payload: { sub: 'google-oauth2|456' } }; }
    });

    assert.deepEqual(await verifier('signed-token'), {
      sub: 'google-oauth2|456',
      displayName: 'google-oauth2|456'
    });
  });
});

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

  it('fails closed when public URLs or allowed origins are malformed', function () {
    var config = auth0.loadAuthConfig(validEnv({
      AUTH0_REDIRECT_URI: 'not-a-url',
      SOCKET_URL: 'javascript:alert(1)',
      ALLOWED_ORIGINS: ','
    }));

    assert.equal(config.ready, false);
    assert.deepEqual(config.allowedOrigins, []);
    assert.ok(config.missing.includes('AUTH0_REDIRECT_URI'));
    assert.ok(config.missing.includes('SOCKET_URL'));
    assert.ok(config.missing.includes('ALLOWED_ORIGINS'));
  });

  it('rejects callback paths that the static SPA does not serve', function () {
    var config = auth0.loadAuthConfig(validEnv({
      AUTH0_REDIRECT_URI: 'https://chat.example.test/callback'
    }));

    assert.equal(config.ready, false);
    assert.ok(config.missing.includes('AUTH0_REDIRECT_URI'));
  });

  it('enables deterministic test mode only with both explicit flags', function () {
    assert.equal(auth0.loadAuthConfig({ NODE_ENV: 'test' }).testMode, false);
    assert.equal(auth0.loadAuthConfig({ AUTH_TEST_MODE: '1' }).testMode, false);
    assert.equal(auth0.loadAuthConfig({ NODE_ENV: 'test', AUTH_TEST_MODE: '1' }).testMode, true);
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
        return { payload: { sub: 'google-oauth2|123', name: 'Ana', exp: 4102444800 } };
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
      jwtVerify: async function () { return { payload: { sub: 'google-oauth2|456', exp: 4102444800 } }; }
    });

    assert.deepEqual(await verifier('signed-token'), {
      sub: 'google-oauth2|456',
      displayName: 'google-oauth2|456'
    });
  });

  it('rejects expired, wrong-audience and wrong-algorithm JWT fixtures', async function () {
    var jose = await import('jose');
    var pair = await jose.generateKeyPair('RS256');
    var config = auth0.loadAuthConfig(validEnv());
    var verifier = auth0.createAuth0Verifier(config, {
      createRemoteJWKSet: function () { return pair.publicKey; },
      jwtVerify: jose.jwtVerify
    });
    var now = Math.floor(Date.now() / 1000);

    async function sign(overrides) {
      overrides = overrides || {};
      return new jose.SignJWT({ sub: 'google-oauth2|789', name: 'Ana' })
        .setProtectedHeader({ alg: overrides.algorithm || 'RS256' })
        .setIssuer(overrides.issuer || config.issuer)
        .setAudience(overrides.audience || config.audience)
        .setIssuedAt(now - 60)
        .setExpirationTime(overrides.expiration || now + 300)
        .sign(overrides.key || pair.privateKey);
    }

    var expired = await sign({ expiration: now - 1 });
    var wrongAudience = await sign({ audience: 'https://other-api.example.test' });
    var wrongIssuer = await sign({ issuer: 'https://other.example.test/' });
    var secret = new TextEncoder().encode('01234567890123456789012345678901');
    var wrongAlgorithm = await sign({ algorithm: 'HS256', key: secret });

    await assert.rejects(function () { return verifier(expired); }, { code: 'TOKEN_INVALID' });
    await assert.rejects(function () { return verifier(wrongAudience); }, { code: 'TOKEN_INVALID' });
    await assert.rejects(function () { return verifier(wrongIssuer); }, { code: 'TOKEN_INVALID' });
    await assert.rejects(function () { return verifier(wrongAlgorithm); }, { code: 'TOKEN_INVALID' });
  });

  it('rejects a signed access token that omits its expiration claim', async function () {
    var jose = await import('jose');
    var pair = await jose.generateKeyPair('RS256');
    var config = auth0.loadAuthConfig(validEnv());
    var verifier = auth0.createAuth0Verifier(config, {
      createRemoteJWKSet: function () { return pair.publicKey; },
      jwtVerify: jose.jwtVerify
    });
    var tokenWithoutExpiration = await new jose.SignJWT({ sub: 'google-oauth2|789', name: 'Ana' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(config.issuer)
      .setAudience(config.audience)
      .setIssuedAt()
      .sign(pair.privateKey);

    await assert.rejects(function () { return verifier(tokenWithoutExpiration); }, { code: 'TOKEN_INVALID' });
  });

  it('accepts a valid signed JWT and rejects malformed, bad-signature and missing-subject tokens', async function () {
    var jose = await import('jose');
    var pair = await jose.generateKeyPair('RS256');
    var otherPair = await jose.generateKeyPair('RS256');
    var config = auth0.loadAuthConfig(validEnv());
    var verifier = auth0.createAuth0Verifier(config, {
      createRemoteJWKSet: function () { return pair.publicKey; },
      jwtVerify: jose.jwtVerify
    });
    var now = Math.floor(Date.now() / 1000);

    function signed(payload, key) {
      return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuer(config.issuer)
        .setAudience(config.audience)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(key || pair.privateKey);
    }

    assert.deepEqual(await verifier(await signed({ sub: 'google-oauth2|valid', name: 'Ana' })), {
      sub: 'google-oauth2|valid',
      displayName: 'Ana'
    });
    await assert.rejects(function () { return verifier('not-a-jwt'); }, { code: 'TOKEN_INVALID' });
    await assert.rejects(function () {
      return signed({ sub: 'google-oauth2|forged' }, otherPair.privateKey).then(verifier);
    }, { code: 'TOKEN_INVALID' });
    await assert.rejects(function () { return signed({ name: 'Sin sujeto' }).then(verifier); }, {
      code: 'TOKEN_SUBJECT_MISSING'
    });
  });
});

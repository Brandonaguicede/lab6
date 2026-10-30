'use strict';

var REQUIRED_VALUES = [
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'AUTH0_CLIENT_ID',
  'AUTH0_REDIRECT_URI',
  'SOCKET_URL',
  'ALLOWED_ORIGINS'
];

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDomain(value) {
  var raw = text(value);
  if (!raw) return '';
  try {
    var url = new URL(raw.includes('://') ? raw : 'https://' + raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return '';
    }
    return url.host;
  } catch (error) {
    return '';
  }
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function normalizePublicUrl(value, originOnly) {
  var raw = text(value);
  if (!raw) return '';
  try {
    var url = new URL(raw);
    var allowedProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && isLocalHostname(url.hostname));
    if (!allowedProtocol || url.username || url.password || url.search || url.hash) return '';
    if (originOnly && url.pathname !== '/') return '';
    return originOnly ? url.origin : raw;
  } catch (error) {
    return '';
  }
}

function exactOrigins(value) {
  var parts = text(value).split(',').map(function (origin) { return origin.trim(); });
  var origins = parts.map(function (origin) { return normalizePublicUrl(origin, true); });
  return {
    valid: parts.length > 0 && origins.every(Boolean),
    values: origins.filter(Boolean)
  };
}

function authError(code, cause) {
  var error = new Error(code);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function loadAuthConfig(env) {
  env = env || {};
  var missing = REQUIRED_VALUES.filter(function (name) { return !text(env[name]); });
  var domain = normalizeDomain(env.AUTH0_DOMAIN);
  if (text(env.AUTH0_DOMAIN) && !domain && !missing.includes('AUTH0_DOMAIN')) missing.push('AUTH0_DOMAIN');
  var redirectUri = normalizePublicUrl(env.AUTH0_REDIRECT_URI, true);
  var socketUrl = normalizePublicUrl(env.SOCKET_URL, true);
  var origins = exactOrigins(env.ALLOWED_ORIGINS);
  if (text(env.AUTH0_REDIRECT_URI) && !redirectUri && !missing.includes('AUTH0_REDIRECT_URI')) missing.push('AUTH0_REDIRECT_URI');
  if (text(env.SOCKET_URL) && !socketUrl && !missing.includes('SOCKET_URL')) missing.push('SOCKET_URL');
  if (text(env.ALLOWED_ORIGINS) && !origins.valid && !missing.includes('ALLOWED_ORIGINS')) missing.push('ALLOWED_ORIGINS');
  var testMode = env.NODE_ENV === 'test' && env.AUTH_TEST_MODE === '1';
  var issuer = domain ? 'https://' + domain + '/' : '';

  return {
    ready: missing.length === 0 || testMode,
    missing: missing,
    domain: domain,
    audience: text(env.AUTH0_AUDIENCE),
    clientId: text(env.AUTH0_CLIENT_ID),
    redirectUri: redirectUri,
    socketUrl: socketUrl,
    issuer: issuer,
    jwksUri: issuer ? issuer + '.well-known/jwks.json' : '',
    algorithms: ['RS256'],
    allowedOrigins: origins.values,
    displayNameClaim: text(env.AUTH0_DISPLAY_NAME_CLAIM),
    testMode: testMode
  };
}

function publicRuntimeConfig(env) {
  var config = loadAuthConfig(env);
  return {
    ready: config.ready,
    auth0Domain: config.domain,
    auth0ClientId: config.clientId,
    auth0Audience: config.audience,
    auth0RedirectUri: config.redirectUri,
    socketUrl: config.socketUrl,
    testMode: config.testMode
  };
}

function displayName(payload, claim) {
  var value = claim && payload[claim];
  value = value || payload.name || payload.nickname || payload.email || payload.sub;
  return String(value).trim().slice(0, 50) || String(payload.sub);
}

function createAuth0Verifier(config, dependencies) {
  dependencies = dependencies || {};
  var key;
  var josePromise;

  async function primitives() {
    if (dependencies.jwtVerify && dependencies.createRemoteJWKSet) return dependencies;
    if (!josePromise) josePromise = import('jose');
    return josePromise;
  }

  return async function verifyAccessToken(token) {
    if (!config || !config.ready || config.testMode) throw authError('AUTH_CONFIGURATION_REQUIRED');
    if (!text(token)) throw authError('TOKEN_MISSING');

    try {
      var jose = await primitives();
      if (!key) key = jose.createRemoteJWKSet(new URL(config.jwksUri));
      var result = await jose.jwtVerify(token, key, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: config.algorithms
      });
      if (!result.payload || !text(result.payload.sub)) throw authError('TOKEN_SUBJECT_MISSING');
      if (!Number.isFinite(result.payload.exp)) throw authError('TOKEN_EXPIRATION_MISSING');
      return {
        sub: result.payload.sub,
        displayName: displayName(result.payload, config.displayNameClaim)
      };
    } catch (error) {
      if (error && ['TOKEN_SUBJECT_MISSING', 'TOKEN_MISSING', 'AUTH_CONFIGURATION_REQUIRED'].includes(error.code)) {
        throw error;
      }
      throw authError('TOKEN_INVALID', error);
    }
  };
}

function createTestVerifier(config) {
  return async function verifyTestToken(token) {
    if (!config || !config.testMode) throw authError('AUTH_CONFIGURATION_REQUIRED');
    var principals = {
      'test-token-ana': { sub: 'test|ana', displayName: 'Ana' },
      'test-token-bruno': { sub: 'test|bruno', displayName: 'Bruno' }
    };
    if (!principals[token]) throw authError(token ? 'TOKEN_INVALID' : 'TOKEN_MISSING');
    return principals[token];
  };
}

module.exports = {
  loadAuthConfig: loadAuthConfig,
  publicRuntimeConfig: publicRuntimeConfig,
  createAuth0Verifier: createAuth0Verifier,
  createTestVerifier: createTestVerifier,
  authError: authError
};

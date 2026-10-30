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

function exactOrigins(value) {
  return text(value).split(',').map(function (origin) { return origin.trim(); }).filter(Boolean);
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
  var testMode = env.NODE_ENV === 'test' && env.AUTH_TEST_MODE === '1';
  var issuer = domain ? 'https://' + domain + '/' : '';

  return {
    ready: missing.length === 0 || testMode,
    missing: missing,
    domain: domain,
    audience: text(env.AUTH0_AUDIENCE),
    clientId: text(env.AUTH0_CLIENT_ID),
    redirectUri: text(env.AUTH0_REDIRECT_URI),
    socketUrl: text(env.SOCKET_URL),
    issuer: issuer,
    jwksUri: issuer ? issuer + '.well-known/jwks.json' : '',
    algorithms: ['RS256'],
    allowedOrigins: exactOrigins(env.ALLOWED_ORIGINS),
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

module.exports = {
  loadAuthConfig: loadAuthConfig,
  publicRuntimeConfig: publicRuntimeConfig,
  createAuth0Verifier: createAuth0Verifier,
  authError: authError
};

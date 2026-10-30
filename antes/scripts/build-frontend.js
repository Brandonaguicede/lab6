'use strict';

var fs = require('fs');
var path = require('path');
var auth0 = require('../libs/auth0');

function serializeRuntimeConfig(config) {
  return JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function buildFrontend(options) {
  options = options || {};
  var env = options.env || process.env;
  var outputDirectory = options.outputDirectory || path.join(__dirname, '..', 'dist');
  var config = auth0.publicRuntimeConfig(env);

  if (config.testMode) throw new Error('AUTH_TEST_MODE_FORBIDDEN');
  if (!config.ready) throw new Error('AUTH_CONFIGURATION_REQUIRED');

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', 'index.html'), path.join(outputDirectory, 'index.html'));
  fs.copyFileSync(path.join(__dirname, '..', 'client.js'), path.join(outputDirectory, 'client.js'));
  fs.writeFileSync(
    path.join(outputDirectory, 'runtime-config.js'),
    'window.UNA_CHAT_CONFIG = ' + serializeRuntimeConfig(config) + ';\n',
    'utf8'
  );
}

if (require.main === module) buildFrontend();

module.exports = { buildFrontend: buildFrontend, serializeRuntimeConfig: serializeRuntimeConfig };

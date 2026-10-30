'use strict';

var express = require('express');
var createHttpServer = require('http').createServer;
var SocketIOServer = require('socket.io').Server;
var validation = require('./libs/unalib');
var auth0 = require('./libs/auth0');
var port = process.env.PORT || 3000;

function createServer(options) {
  options = options || {};
  var validator = options.validator || validation;
  var env = options.env || process.env;
  var authConfig = options.authConfig || auth0.loadAuthConfig(env);
  var tokenVerifier = options.tokenVerifier || (authConfig.testMode
    ? auth0.createTestVerifier(authConfig)
    : auth0.createAuth0Verifier(authConfig));
  var browserConfig = options.publicConfig || auth0.publicRuntimeConfig(env);
  var app = express();
  var http = createHttpServer(app);
  var ioOptions = {};

  if (authConfig.allowedOrigins.length) {
    ioOptions.cors = { origin: authConfig.allowedOrigins, methods: ['GET', 'POST'] };
    ioOptions.allowRequest = function (request, callback) {
      var origin = request.headers.origin;
      callback(null, !origin || authConfig.allowedOrigins.includes(origin));
    };
  }

  var io = new SocketIOServer(http, ioOptions);

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/client.js', function (req, res) {
    res.sendFile(__dirname + '/client.js');
  });

  app.get('/runtime-config.js', function (req, res) {
    var serialized = JSON.stringify(browserConfig).replace(/</g, '\\u003c');
    res.set('Cache-Control', 'no-store');
    res.type('application/javascript').send('window.UNA_CHAT_CONFIG = ' + serialized + ';\n');
  });

  io.use(function (socket, next) {
    var token = socket.handshake.auth && socket.handshake.auth.token;
    Promise.resolve(tokenVerifier(token)).then(function (principal) {
      if (!principal || typeof principal.sub !== 'string' || typeof principal.displayName !== 'string') {
        throw auth0.authError('TOKEN_SUBJECT_MISSING');
      }
      socket.data.principal = principal;
      next();
    }).catch(function () {
      var error = new Error('AUTHENTICATION_REQUIRED');
      error.data = { code: 'AUTHENTICATION_REQUIRED' };
      next(error);
    });
  });

  io.on('connection', function (socket) {
    socket.on('Evento-Mensaje-Server', function (rawMessage, acknowledgement) {
      var messageWithTrustedIdentity = rawMessage;
      try {
        var parsedMessage = JSON.parse(rawMessage);
        if (parsedMessage && !Array.isArray(parsedMessage) && typeof parsedMessage === 'object') {
          parsedMessage.nombre = socket.data.principal.displayName;
          messageWithTrustedIdentity = JSON.stringify(parsedMessage);
        }
      } catch (error) {
        // El validador existente conserva el contrato de error para JSON invalido.
      }
      var result = validator.validarMensaje(messageWithTrustedIdentity);

      if (!result.valid) {
        socket.emit('Evento-Error-Server', JSON.stringify({ code: result.code }));
        if (typeof acknowledgement === 'function') {
          acknowledgement({ ok: false, code: result.code });
        }
        return;
      }

      io.emit('Evento-Mensaje-Server', JSON.stringify(result.value));
      if (typeof acknowledgement === 'function') {
        acknowledgement({ ok: true });
      }
    });
  });

  return { app: app, http: http, io: io, authConfig: authConfig };
}

if (require.main === module) {
  createServer().http.listen(port, function () {
    console.log('listening on *:' + port);
  });
}

module.exports = { createServer: createServer };

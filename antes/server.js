'use strict';

var express = require('express');
var createHttpServer = require('http').createServer;
var SocketIOServer = require('socket.io').Server;
var validation = require('./libs/unalib');
var port = process.env.PORT || 3000;

function createServer(options) {
  options = options || {};
  var validator = options.validator || validation;
  var app = express();
  var http = createHttpServer(app);
  var io = new SocketIOServer(http);

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', function (socket) {
    socket.on('Evento-Mensaje-Server', function (rawMessage, acknowledgement) {
      var result = validator.validarMensaje(rawMessage);

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

  return { app: app, http: http, io: io };
}

if (require.main === module) {
  createServer().http.listen(port, function () {
    console.log('listening on *:' + port);
  });
}

module.exports = { createServer: createServer };

var { io: createClient } = require('socket.io-client');
var unaLib = require('../../libs/unalib');
var createServer = require('../../server').createServer;

function payload(overrides) {
  return JSON.stringify(Object.assign({ nombre: 'Ana', mensaje: 'Hola', color: '#123ABC' }, overrides));
}

function connect(url) {
  return new Promise(function (resolve, reject) {
    var socket = createClient(url, { transports: ['websocket'], forceNew: true });
    socket.once('connect', function () { resolve(socket); });
    socket.once('connect_error', reject);
  });
}

function emitWithAck(socket, message) {
  return new Promise(function (resolve) { socket.emit('Evento-Mensaje-Server', message, resolve); });
}

describe('integración Socket.IO: chat y una-lib', function () {
  var service;
  var baseUrl;
  var clients;
  var validationCalls;

  beforeAll(function (done) {
    validationCalls = 0;
    service = createServer({ validator: { validarMensaje: function (message) {
      validationCalls += 1;
      return unaLib.validarMensaje(message);
    } } });
    service.http.listen(0, '127.0.0.1', function () {
      baseUrl = 'http://127.0.0.1:' + service.http.address().port;
      clients = [];
      done();
    });
  });

  afterEach(function () {
    clients.forEach(function (client) { client.close(); });
    clients = [];
  });

  afterAll(function (done) {
    // Socket.IO cierra el servidor HTTP adjunto; no se debe cerrar dos veces.
    service.io.close(done);
  });

  test('acepta una imagen HTTPS y llama a validarMensaje', async function () {
    var sender = await connect(baseUrl);
    clients.push(sender);
    var received = new Promise(function (resolve) { sender.once('Evento-Mensaje-Server', resolve); });

    var acknowledgement = await emitWithAck(sender, payload({ mensaje: 'https://media.example/photo.png' }));
    var message = JSON.parse(await received);

    expect(acknowledgement).toEqual({ ok: true });
    expect(message.tipo).toBe('imagen');
    expect(message.mensaje).toBe('https://media.example/photo.png');
    expect(validationCalls).toBeGreaterThan(0);
  });

  test('acepta un vídeo de YouTube válido por el evento real', async function () {
    var sender = await connect(baseUrl);
    clients.push(sender);
    var received = new Promise(function (resolve) { sender.once('Evento-Mensaje-Server', resolve); });

    var acknowledgement = await emitWithAck(sender, payload({ mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok' }));
    var message = JSON.parse(await received);

    expect(acknowledgement).toEqual({ ok: true });
    expect(message.tipo).toBe('youtube');
  });

  test('no publica un intento XSS y reporta el error al emisor', async function () {
    var sender = await connect(baseUrl);
    var observer = await connect(baseUrl);
    clients.push(sender, observer);
    var published = false;
    observer.once('Evento-Mensaje-Server', function () { published = true; });
    var error = new Promise(function (resolve) { sender.once('Evento-Error-Server', resolve); });

    var acknowledgement = await emitWithAck(sender, payload({ mensaje: '<script>alert(1)</script>' }));
    var result = await error;
    await new Promise(function (resolve) { setTimeout(resolve, 75); });

    expect(acknowledgement).toEqual({ ok: false, code: 'MENSAJE_HTML_NO_PERMITIDO' });
    expect(JSON.parse(result)).toEqual({ code: 'MENSAJE_HTML_NO_PERMITIDO' });
    expect(published).toBe(false);
  });
});

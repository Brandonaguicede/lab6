'use strict';

var createClient = require('socket.io-client').io;
var createServer = require('../../server').createServer;

function verifier(token) {
  if (token === 'test-token-ana') return Promise.resolve({ sub: 'test|ana', displayName: 'Ana' });
  if (token === 'test-token-bruno') return Promise.resolve({ sub: 'test|bruno', displayName: 'Bruno' });
  var error = new Error('TOKEN_INVALID');
  error.code = token ? 'TOKEN_INVALID' : 'TOKEN_MISSING';
  return Promise.reject(error);
}

function connect(url, token) {
  return new Promise(function (resolve, reject) {
    var socket = createClient(url, {
      transports: ['websocket'],
      forceNew: true,
      auth: token === undefined ? {} : { token: token }
    });
    socket.once('connect', function () { resolve(socket); });
    socket.once('connect_error', reject);
  });
}

function rejected(url, token) {
  return new Promise(function (resolve, reject) {
    var socket = createClient(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      auth: token === undefined ? {} : { token: token }
    });
    socket.once('connect_error', function (error) {
      socket.close();
      resolve(error);
    });
    socket.once('connect', function () {
      socket.close();
      reject(new Error('Expected the Socket.IO connection to be rejected'));
    });
  });
}

function emitWithAck(socket, message) {
  return new Promise(function (resolve) {
    socket.emit('Evento-Mensaje-Server', JSON.stringify(message), resolve);
  });
}

describe('integracion Socket.IO autenticada', function () {
  var service;
  var baseUrl;
  var clients;

  beforeAll(function (done) {
    service = createServer({ tokenVerifier: verifier });
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
    service.io.close(done);
  });

  test('rechaza una conexion sin token sin exponer detalles', async function () {
    var error = await rejected(baseUrl);

    expect(error.message).toBe('AUTHENTICATION_REQUIRED');
    expect(JSON.stringify(error)).not.toContain('TOKEN_MISSING');
  });

  test('rechaza una conexion con token invalido', async function () {
    var error = await rejected(baseUrl, 'invalid-test-token');

    expect(error.message).toBe('AUTHENTICATION_REQUIRED');
  });

  test('un cliente rechazado no publica mensajes para un observador autenticado', async function () {
    var observer = await connect(baseUrl, 'test-token-bruno');
    clients.push(observer);
    var published = false;
    observer.once('Evento-Mensaje-Server', function () { published = true; });

    await rejected(baseUrl, 'invalid-test-token');
    await new Promise(function (resolve) { setTimeout(resolve, 75); });

    expect(published).toBe(false);
  });

  test('acepta un socket autenticado y sustituye el nombre no confiable', async function () {
    var ana = await connect(baseUrl, 'test-token-ana');
    clients.push(ana);
    var received = new Promise(function (resolve) { ana.once('Evento-Mensaje-Server', resolve); });

    var acknowledgement = await emitWithAck(ana, {
      nombre: 'Mallory',
      mensaje: 'Hola',
      color: '#123ABC'
    });
    var message = JSON.parse(await received);

    expect(acknowledgement).toEqual({ ok: true });
    expect(message.nombre).toBe('Ana');
  });

  test('la identidad autenticada no depende de un nombre valido enviado por el navegador', async function () {
    var ana = await connect(baseUrl, 'test-token-ana');
    clients.push(ana);
    var received = new Promise(function (resolve) { ana.once('Evento-Mensaje-Server', resolve); });

    var acknowledgement = await emitWithAck(ana, {
      mensaje: 'Hola sin nombre del cliente',
      color: '#123ABC'
    });
    var message = JSON.parse(await received);

    expect(acknowledgement).toEqual({ ok: true });
    expect(message.nombre).toBe('Ana');
  });

  test('entrega mensajes entre dos usuarios autenticados', async function () {
    var ana = await connect(baseUrl, 'test-token-ana');
    var bruno = await connect(baseUrl, 'test-token-bruno');
    clients.push(ana, bruno);
    var received = new Promise(function (resolve) { bruno.once('Evento-Mensaje-Server', resolve); });

    await emitWithAck(ana, { nombre: 'No confiable', mensaje: 'Hola Bruno', color: '#123ABC' });
    var message = JSON.parse(await received);

    expect(message.nombre).toBe('Ana');
    expect(message.mensaje).toBe('Hola Bruno');
  });
});

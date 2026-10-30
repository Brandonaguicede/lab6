'use strict';

var http = require('http');
var createClient = require('socket.io-client').io;
var createServer = require('../../server').createServer;

function get(url) {
  return new Promise(function (resolve, reject) {
    http.get(url, function (response) {
      var body = '';
      response.setEncoding('utf8');
      response.on('data', function (chunk) { body += chunk; });
      response.on('end', function () { resolve({ response: response, body: body }); });
    }).on('error', reject);
  });
}

function connect(url, origin) {
  return new Promise(function (resolve, reject) {
    var socket = createClient(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      auth: { token: 'valid-test-token' },
      extraHeaders: { Origin: origin }
    });
    socket.once('connect', function () { resolve(socket); });
    socket.once('connect_error', function (error) {
      socket.close();
      reject(error);
    });
  });
}

describe('integracion de configuracion publica y origenes', function () {
  var service;
  var baseUrl;
  var clients;

  beforeAll(function (done) {
    service = createServer({
      authConfig: { allowedOrigins: ['https://chat.example.test'], testMode: false },
      publicConfig: {
        ready: true,
        auth0Domain: 'tenant.example.auth0.com',
        auth0ClientId: 'public-client-id',
        auth0Audience: 'https://api.example.test',
        auth0RedirectUri: 'https://chat.example.test',
        socketUrl: 'https://socket.example.test',
        testMode: false
      },
      tokenVerifier: async function () { return { sub: 'test|ana', displayName: 'Ana' }; }
    });
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

  test('expone configuracion publica sin cache ni secretos', async function () {
    var result = await get(baseUrl + '/runtime-config.js');

    expect(result.response.statusCode).toBe(200);
    expect(result.response.headers['content-type']).toMatch(/^application\/javascript/);
    expect(result.response.headers['cache-control']).toBe('no-store');
    expect(result.body).toContain('public-client-id');
    expect(result.body).not.toContain('CLIENT_SECRET');
  });

  test('acepta el origen exacto configurado y rechaza un subdominio impostor', async function () {
    var allowed = await connect(baseUrl, 'https://chat.example.test');
    clients.push(allowed);

    await expect(connect(baseUrl, 'https://evil.chat.example.test')).rejects.toBeTruthy();
  });
});

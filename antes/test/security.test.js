var assert = require('assert');
var val = require('../libs/unalib');

function rawMessage(overrides) {
  return JSON.stringify(Object.assign({
    nombre: 'Ana',
    mensaje: 'Hola, mundo',
    color: '#123ABC'
  }, overrides));
}

describe('una-lib: seguridad y multimedia', function () {
  describe('clasificación segura de URL', function () {
    it('acepta solamente imágenes HTTPS con una extensión permitida', function () {
      assert.equal(val.is_valid_url_image('https://media.example/photo.jpeg?size=2'), true);
      assert.equal(val.is_valid_url_image('https://media.example/photo.webp'), true);
    });

    it('rechaza imágenes HTTP, data URL, SVG y extensiones simuladas', function () {
      assert.equal(val.is_valid_url_image('http://media.example/photo.jpg'), false);
      assert.equal(val.is_valid_url_image('data:image/png;base64,AAAA'), false);
      assert.equal(val.is_valid_url_image('https://media.example/payload.svg'), false);
      assert.equal(val.is_valid_url_image('https://media.example/photo.jpg.exe'), false);
    });

    it('acepta únicamente variantes HTTPS válidas de YouTube', function () {
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);
      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);
      assert.equal(val.is_valid_yt_video('https://evil.example/watch?v=qYwlqx-JLok'), false);
      assert.equal(val.is_valid_yt_video('javascript:alert(1)'), false);
    });

    it('clasifica archivos de vídeo HTTPS admitidos', function () {
      assert.equal(val.is_valid_video_file('https://media.example/clip.webm'), true);
      assert.equal(val.is_valid_video_file('https://media.example/clip.mp4?download=1'), true);
      assert.equal(val.is_valid_video_file('https://media.example/clip.mov'), false);
    });

    it('no genera HTML a partir de una URL de usuario', function () {
      var image = val.getImageTag('https://media.example/photo.png');
      var embed = val.getEmbeddedCode('https://youtu.be/qYwlqx-JLok');

      assert.equal(image, 'https://media.example/photo.png');
      assert.equal(embed, 'https://www.youtube-nocookie.com/embed/qYwlqx-JLok');
      assert.equal(image.includes('<'), false);
      assert.equal(embed.includes('<'), false);
    });
  });

  describe('validarMensaje', function () {
    it('preserva un mensaje de texto normal y sus caracteres especiales', function () {
      var result = val.validarMensaje(rawMessage({ mensaje: '¡Hola, José & compañía!' }));

      assert.deepEqual(result, {
        valid: true,
        value: {
          nombre: 'Ana',
          mensaje: '¡Hola, José & compañía!',
          color: '#123ABC',
          tipo: 'texto'
        }
      });
    });

    it('clasifica imágenes, vídeos de YouTube y archivos de vídeo sin insertar etiquetas', function () {
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'https://media.example/photo.png' })).value.tipo, 'imagen');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'https://youtu.be/qYwlqx-JLok' })).value.tipo, 'youtube');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'https://media.example/clip.mp4' })).value.tipo, 'video');
    });

    it('rechaza HTML y scripts en vez de devolverlos al cliente', function () {
      var result = val.validarMensaje(rawMessage({ mensaje: "<script>alert('Inyección de script');</script>" }));

      assert.equal(result.valid, false);
      assert.equal(result.code, 'MENSAJE_HTML_NO_PERMITIDO');
    });

    it('rechaza protocolos peligrosos y URLs HTTPS que no son multimedia admitido', function () {
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'javascript:alert(1)' })).code, 'URL_NO_PERMITIDA');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'data:text/html;base64,PHNjcmlwdD4=' })).code, 'URL_NO_PERMITIDA');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'https://example.com/index.html' })).code, 'URL_NO_PERMITIDA');
    });

    it('rechaza nombre y mensaje vacíos', function () {
      assert.equal(val.validarMensaje(rawMessage({ nombre: '   ' })).code, 'NOMBRE_REQUERIDO');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: '   ' })).code, 'MENSAJE_REQUERIDO');
    });

    it('controla el límite de longitud', function () {
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'a'.repeat(279) })).valid, true);
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'a'.repeat(280) })).valid, true);
      assert.equal(val.validarMensaje(rawMessage({ mensaje: 'a'.repeat(281) })).code, 'MENSAJE_DEMASIADO_LARGO');
      assert.equal(val.validarMensaje(rawMessage({ nombre: 'a'.repeat(51) })).code, 'NOMBRE_DEMASIADO_LARGO');
    });

    it('trata espacios y saltos de linea como nombre o mensaje vacio', function () {
      assert.equal(val.validarMensaje(rawMessage({ nombre: ' \n\t ' })).code, 'NOMBRE_REQUERIDO');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: ' \n\t ' })).code, 'MENSAJE_REQUERIDO');
    });

    it('rechaza entradas de tipo o formato inesperado', function () {
      assert.equal(val.validarMensaje(null).code, 'FORMATO_INVALIDO');
      assert.equal(val.validarMensaje({ mensaje: 'hola' }).code, 'FORMATO_INVALIDO');
      assert.equal(val.validarMensaje('{').code, 'JSON_INVALIDO');
      assert.equal(val.validarMensaje(rawMessage({ mensaje: null })).code, 'MENSAJE_REQUERIDO');
    });

    it('mantiene validateMessage como compatibilidad y no serializa HTML', function () {
      var serialized = val.validateMessage(rawMessage({ mensaje: 'https://media.example/photo.png' }));
      var parsed = JSON.parse(serialized);

      assert.equal(parsed.tipo, 'imagen');
      assert.equal(parsed.mensaje, 'https://media.example/photo.png');
      assert.equal(serialized.includes('<img'), false);
    });
  });
});

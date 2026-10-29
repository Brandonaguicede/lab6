'use strict';

var IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
var VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv'];
var MAX_MESSAGE_LENGTH = 1000;
var MAX_NAME_LENGTH = 50;
var SAFE_COLOR = /^#[0-9a-fA-F]{6}$/;
var YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
var HTML_TAG = /<\s*\/?\s*[a-zA-Z][^>]*>/;
var SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;

function parseHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) {
    return null;
  }

  try {
    var url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      return null;
    }
    return url;
  } catch (error) {
    return null;
  }
}

function hasAllowedExtension(url, extensions) {
  var pathname = url.pathname.toLowerCase();
  return extensions.some(function (extension) {
    return pathname.endsWith(extension);
  });
}

function getYouTubeVideoId(value) {
  var url = parseHttpsUrl(value);
  if (!url) {
    return null;
  }

  var hostname = url.hostname.toLowerCase();
  var id = null;
  var pathSegments = url.pathname.split('/').filter(Boolean);

  if (hostname === 'youtu.be' && pathSegments.length === 1) {
    id = pathSegments[0];
  } else if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else if (['embed', 'shorts', 'v'].includes(pathSegments[0]) && pathSegments.length === 2) {
      id = pathSegments[1];
    }
  }

  return typeof id === 'string' && YOUTUBE_ID.test(id) ? id : null;
}

function invalid(code) {
  return { valid: false, code: code };
}

function classifyMessage(message) {
  if (HTML_TAG.test(message)) {
    return invalid('MENSAJE_HTML_NO_PERMITIDO');
  }

  if (SCHEME.test(message)) {
    if (api.is_valid_url_image(message)) {
      return { valid: true, tipo: 'imagen' };
    }
    if (api.is_valid_yt_video(message)) {
      return { valid: true, tipo: 'youtube' };
    }
    if (api.is_valid_video_file(message)) {
      return { valid: true, tipo: 'video' };
    }
    return invalid('URL_NO_PERMITIDA');
  }

  return { valid: true, tipo: 'texto' };
}

var api = {
  MAX_MESSAGE_LENGTH: MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH: MAX_NAME_LENGTH,

  is_valid_phone: function (phone) {
    return typeof phone === 'string' && /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i.test(phone);
  },

  is_valid_url_image: function (url) {
    var parsed = parseHttpsUrl(url);
    return Boolean(parsed && hasAllowedExtension(parsed, IMAGE_EXTENSIONS));
  },

  is_valid_yt_video: function (url) {
    return getYouTubeVideoId(url) !== null;
  },

  is_valid_video_file: function (url) {
    var parsed = parseHttpsUrl(url);
    return Boolean(parsed && hasAllowedExtension(parsed, VIDEO_EXTENSIONS));
  },

  getYTVideoId: function (url) {
    return getYouTubeVideoId(url);
  },

  // Compatibilidad: conserva el nombre histórico, pero ya no produce una etiqueta HTML.
  getEmbeddedCode: function (url) {
    var id = getYouTubeVideoId(url);
    return id ? 'https://www.youtube-nocookie.com/embed/' + id : null;
  },

  // Compatibilidad: conserva el nombre histórico, pero devuelve solo una URL validada.
  getImageTag: function (url) {
    return this.is_valid_url_image(url) ? url : null;
  },

  validarMensaje: function (rawMessage) {
    if (typeof rawMessage !== 'string') {
      return invalid('FORMATO_INVALIDO');
    }

    var message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      return invalid('JSON_INVALIDO');
    }

    if (!message || Array.isArray(message) || typeof message !== 'object') {
      return invalid('FORMATO_INVALIDO');
    }
    if (typeof message.nombre !== 'string' || !message.nombre.trim()) {
      return invalid('NOMBRE_REQUERIDO');
    }
    if (message.nombre.trim().length > MAX_NAME_LENGTH) {
      return invalid('NOMBRE_DEMASIADO_LARGO');
    }
    if (HTML_TAG.test(message.nombre)) {
      return invalid('NOMBRE_HTML_NO_PERMITIDO');
    }
    if (typeof message.mensaje !== 'string' || !message.mensaje.trim()) {
      return invalid('MENSAJE_REQUERIDO');
    }

    var texto = message.mensaje.trim();
    if (texto.length > MAX_MESSAGE_LENGTH) {
      return invalid('MENSAJE_DEMASIADO_LARGO');
    }
    if (message.color !== undefined && (typeof message.color !== 'string' || !SAFE_COLOR.test(message.color))) {
      return invalid('COLOR_INVALIDO');
    }

    var classification = classifyMessage(texto);
    if (!classification.valid) {
      return classification;
    }

    return {
      valid: true,
      value: {
        nombre: message.nombre.trim(),
        mensaje: texto,
        color: message.color || '#333333',
        tipo: classification.tipo
      }
    };
  },

  // API anterior: retorna JSON para los consumidores que aún la utilicen.
  validateMessage: function (rawMessage) {
    var result = this.validarMensaje(rawMessage);
    return JSON.stringify(result.valid ? result.value : { error: result.code });
  }
};

module.exports = api;

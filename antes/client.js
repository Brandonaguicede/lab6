'use strict';

(function () {
  var AUTH0_SDK = 'https://cdn.auth0.com/js/auth0-spa-js/2.30.0/auth0-spa-js.production.js';
  var config = window.UNA_CHAT_CONFIG || { ready: false };
  var authClient;
  var socket;
  var currentUser;
  var colorHexTxt = '';
  var form = document.getElementById('chat-form');
  var messages = document.getElementById('messages');
  var error = document.getElementById('error');
  var messageInput = document.getElementById('m');
  var identity = document.getElementById('identity');
  var loginButton = document.getElementById('login');
  var logoutButton = document.getElementById('logout');
  var errorMessages = {
    MENSAJE_REQUERIDO: 'Escribe un mensaje.',
    MENSAJE_DEMASIADO_LARGO: 'El mensaje es demasiado largo (maximo 280 caracteres).',
    MENSAJE_HTML_NO_PERMITIDO: 'MENSAJE_HTML_NO_PERMITIDO: no se permite publicar HTML.',
    AUTHENTICATION_REQUIRED: 'Tu sesion no es valida. Inicia sesion otra vez.',
    AUTH_CONFIGURATION_REQUIRED: 'La autenticacion no esta configurada.'
  };

  function showError(code) {
    error.textContent = errorMessages[code] || (/^[A-Z0-9_]{1,64}$/.test(code || '')
      ? code
      : 'No fue posible completar la operacion.');
  }

  function setBusy(busy) {
    loginButton.disabled = busy;
    logoutButton.disabled = busy;
  }

  function setSignedOut() {
    currentUser = null;
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    identity.textContent = 'Sin autenticar';
    loginButton.hidden = false;
    logoutButton.hidden = true;
    form.hidden = true;
  }

  function setSignedIn(user) {
    currentUser = user;
    identity.textContent = 'Sesion: ' + (user.name || user.nickname || user.email || user.sub);
    loginButton.hidden = true;
    logoutButton.hidden = false;
    form.hidden = false;
    error.textContent = '';
  }

  function loadScript(source, id) {
    return new Promise(function (resolve, reject) {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.id = id;
      script.src = source;
      script.onload = resolve;
      script.onerror = function () {
        script.remove();
        reject(new Error('SCRIPT_LOAD_FAILED'));
      };
      document.head.appendChild(script);
    });
  }

  function createTestClient() {
    return {
      isAuthenticated: async function () { return sessionStorage.getItem('una-test-auth') === '1'; },
      loginWithRedirect: async function () { sessionStorage.setItem('una-test-auth', '1'); },
      handleRedirectCallback: async function () {},
      getUser: async function () { return { sub: 'test|ana', name: 'Ana' }; },
      getTokenSilently: async function () { return 'test-token-ana'; },
      logout: async function () { sessionStorage.removeItem('una-test-auth'); }
    };
  }

  async function createIdentityClient() {
    if (config.testMode) return createTestClient();
    await loadScript(AUTH0_SDK, 'auth0-spa-sdk');
    return window.auth0.createAuth0Client({
      domain: config.auth0Domain,
      clientId: config.auth0ClientId,
      cacheLocation: 'memory',
      authorizationParams: {
        audience: config.auth0Audience,
        redirect_uri: config.auth0RedirectUri
      }
    });
  }

  function socketBaseUrl() {
    var value = config.socketUrl || window.location.origin;
    var url = new URL(value, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('INVALID_SOCKET_URL');
    return url.origin;
  }

  async function connectSocket(user) {
    var baseUrl = socketBaseUrl();
    await loadScript(baseUrl + '/socket.io/socket.io.js', 'socket-io-client');
    if (socket) socket.disconnect();
    socket = window.io(baseUrl, {
      autoConnect: false,
      auth: function (callback) {
        authClient.getTokenSilently().then(function (token) {
          callback({ token: token });
        }).catch(function () {
          callback({ token: '' });
        });
      }
    });

    socket.on('connect', function () { setSignedIn(user); });
    socket.on('connect_error', function () {
      setSignedOut();
      showError('AUTHENTICATION_REQUIRED');
    });
    socket.on('Evento-Mensaje-Server', receiveMessage);
    socket.on('Evento-Error-Server', function (rawError) {
      try { showError(JSON.parse(rawError).code); }
      catch (exception) { showError('MENSAJE_INVALIDO'); }
    });
    socket.connect();
  }

  async function restoreSession() {
    authClient = await createIdentityClient();
    var query = new URLSearchParams(window.location.search);
    if (query.has('error')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      throw new Error('AUTH_REDIRECT_FAILED');
    }
    if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
      await authClient.handleRedirectCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (await authClient.isAuthenticated()) {
      await connectSocket(await authClient.getUser());
    } else {
      setSignedOut();
    }
  }

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i += 1) color += letters[Math.floor(Math.random() * 16)];
    return color;
  }

  function isSecureUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch (exception) {
      return false;
    }
  }

  function getYoutubeEmbedUrl(value) {
    try {
      var url = new URL(value);
      var hostname = url.hostname.toLowerCase();
      var parts = url.pathname.split('/').filter(Boolean);
      var isYoutube = hostname === 'youtube.com' || hostname === 'www.youtube.com';
      var id = hostname === 'youtu.be' && parts.length === 1 ? parts[0] : null;
      if (isYoutube && url.pathname === '/watch') id = url.searchParams.get('v');
      else if (isYoutube && ['embed', 'shorts', 'v'].includes(parts[0]) && parts.length === 2) id = parts[1];
      return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id)
        ? 'https://www.youtube-nocookie.com/embed/' + id
        : null;
    } catch (exception) {
      return null;
    }
  }

  function setLoadStatus(element) {
    element.addEventListener('load', function () { element.dataset.loaded = 'true'; });
    element.addEventListener('error', function () {
      element.replaceWith(document.createTextNode('[No se pudo cargar el recurso multimedia]'));
    });
  }

  function addMedia(message, listItem) {
    var resource;
    if (message.tipo === 'imagen' && isSecureUrl(message.mensaje)) {
      resource = document.createElement('img');
      resource.src = message.mensaje;
      resource.alt = 'Imagen compartida por ' + message.nombre;
      resource.loading = 'lazy';
      resource.className = 'chat-media';
    } else if (message.tipo === 'youtube') {
      var embedUrl = getYoutubeEmbedUrl(message.mensaje);
      if (embedUrl) {
        resource = document.createElement('iframe');
        resource.src = embedUrl;
        resource.title = 'Video de YouTube';
        resource.className = 'chat-player';
        resource.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        resource.referrerPolicy = 'strict-origin-when-cross-origin';
        resource.sandbox = 'allow-scripts allow-same-origin allow-presentation';
      }
    } else if (message.tipo === 'video' && isSecureUrl(message.mensaje)) {
      resource = document.createElement('video');
      resource.src = message.mensaje;
      resource.controls = true;
      resource.preload = 'metadata';
      resource.className = 'chat-media';
    }
    if (resource) {
      setLoadStatus(resource);
      listItem.appendChild(resource);
    } else {
      var textNode = document.createElement('span');
      textNode.textContent = message.mensaje;
      listItem.appendChild(textNode);
    }
  }

  function receiveMessage(rawMessage) {
    try {
      var message = JSON.parse(rawMessage);
      if (!message || typeof message !== 'object') return;
      var item = document.createElement('li');
      var author = document.createElement('strong');
      author.style.color = /^#[0-9a-fA-F]{6}$/.test(message.color) ? message.color : '#333333';
      author.textContent = message.nombre;
      item.appendChild(author);
      item.appendChild(document.createTextNode(': '));
      if (message.tipo === 'texto') {
        var textNode = document.createElement('span');
        textNode.textContent = message.mensaje;
        item.appendChild(textNode);
      } else {
        addMedia(message, item);
      }
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    } catch (exception) {
      showError('MENSAJE_RECIBIDO_INVALIDO');
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var mensaje = messageInput.value;
    if (!currentUser || !socket || !socket.connected) {
      showError('AUTHENTICATION_REQUIRED');
      return;
    }
    if (!mensaje.trim()) {
      messageInput.value = '';
      showError('MENSAJE_REQUERIDO');
      return;
    }
    if (mensaje.trim().length > 280) {
      showError('MENSAJE_DEMASIADO_LARGO');
      return;
    }
    if (!colorHexTxt) colorHexTxt = getRandomColor();
    error.textContent = '';
    socket.emit('Evento-Mensaje-Server', JSON.stringify({
      nombre: currentUser.name || currentUser.nickname || currentUser.email || currentUser.sub,
      mensaje: mensaje,
      color: colorHexTxt
    }), function (result) {
      if (!result || !result.ok) {
        showError(result && result.code);
        return;
      }
      if (messageInput.value === mensaje) messageInput.value = '';
    });
  });

  loginButton.addEventListener('click', async function () {
    setBusy(true);
    error.textContent = '';
    try {
      if (!authClient) authClient = await createIdentityClient();
      await authClient.loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } });
      if (config.testMode) await connectSocket(await authClient.getUser());
    } catch (exception) {
      showError('AUTHENTICATION_REQUIRED');
    } finally {
      setBusy(false);
    }
  });

  logoutButton.addEventListener('click', async function () {
    setBusy(true);
    try {
      if (socket) socket.disconnect();
      setSignedOut();
      await authClient.logout({ logoutParams: { returnTo: config.auth0RedirectUri || window.location.origin } });
    } catch (exception) {
      showError('AUTHENTICATION_REQUIRED');
    } finally {
      setBusy(false);
    }
  });

  if (!config.ready) {
    setSignedOut();
    loginButton.disabled = true;
    showError('AUTH_CONFIGURATION_REQUIRED');
  } else {
    restoreSession().catch(function () {
      setSignedOut();
      showError('AUTHENTICATION_REQUIRED');
    });
  }
}());

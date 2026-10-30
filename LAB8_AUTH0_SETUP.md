# Configuración de Auth0 y Google para UNA Chat

La aplicación ya usa Auth0 SPA JS, Authorization Code Flow con PKCE y un access token dirigido a la API. Este documento cubre la configuración externa pendiente.

## Arquitectura

```text
Navegador -> Auth0 Universal Login -> Google
Navegador <- callback en la raíz del frontend
Navegador -> access token en memoria -> Socket.IO auth.token
Node -> JWKS + RS256 + issuer + audience + exp -> socket.data.principal
Node -> una-lib -> broadcast con identidad confiable
```

## Auth0 API y SPA

1. Cree una API y defina un Identifier estable para `AUTH0_AUDIENCE`.
2. Mantenga RS256 como algoritmo de firma.
3. Cree una aplicación Single Page Application.
4. Copie el dominio del tenant y Client ID público. No publique un client secret.

Configure para desarrollo:

- Allowed Callback URLs: `http://127.0.0.1:3000`
- Allowed Logout URLs: `http://127.0.0.1:3000`
- Allowed Web Origins: `http://127.0.0.1:3000`

La implementación acepta el callback únicamente en la raíz para no registrar rutas que el hosting estático no sirve.

## Conexión Google

1. En Auth0, abra Authentication, Social y seleccione Google.
2. Configure dentro de Auth0 el Client ID y Client Secret de Google Cloud.
3. Active la conexión para la SPA de UNA Chat.
4. Autorice en Google Cloud el redirect URI indicado por Auth0.

## Variables locales

Use `antes/.env.example` como plantilla. El servidor no carga `.env` automáticamente; inyecte las variables desde PowerShell, la plataforma o un gestor de secretos.

```text
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_AUDIENCE=<identifier-de-la-api>
AUTH0_CLIENT_ID=<client-id-publico>
AUTH0_REDIRECT_URI=http://127.0.0.1:3000
SOCKET_URL=http://127.0.0.1:3000
ALLOWED_ORIGINS=http://127.0.0.1:3000
AUTH_TEST_MODE=0
```

## Smoke test real pendiente

1. Confirme que el formulario está oculto sin sesión.
2. Inicie sesión con Google mediante Universal Login.
3. Verifique el retorno a la raíz, la identidad visible y el envío entre dos navegadores.
4. Cierre sesión y confirme que el chat vuelve a quedar protegido.
5. Confirme que consola, red y logs no muestran access tokens.

Este smoke test no se ejecutó porque el workspace no contiene credenciales externas.

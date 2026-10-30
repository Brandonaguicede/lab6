# Configuración de Auth0 y Google para UNA Chat

UNA Chat usa Auth0 SPA JS, Authorization Code Flow con PKCE y un access token
dirigido a la API. El token permanece en memoria y se valida durante el
handshake de Socket.IO.

```text
Navegador -> Auth0 Universal Login -> Google
Navegador <- callback en APP_URL
Navegador -> access token en auth.token -> Socket.IO
Node -> JWKS + RS256 + issuer + audience + exp -> principal confiable
Node -> una-lib -> broadcast
```

## Auth0

1. Cree una API y use su Identifier como `AUTH0_AUDIENCE`; mantenga RS256.
2. Cree una aplicación de tipo Single Page Application.
3. Copie el dominio del tenant y el Client ID público. No use ni publique un
   client secret en UNA Chat.
4. Para desarrollo configure estas tres listas con el mismo valor:

   - Allowed Callback URLs: `http://127.0.0.1:3000`
   - Allowed Logout URLs: `http://127.0.0.1:3000`
   - Allowed Web Origins: `http://127.0.0.1:3000`

5. En producción reemplace las tres por el `APP_URL` HTTPS exacto del servicio.

## Google

1. En Auth0 abra Authentication > Social y seleccione Google.
2. Configure allí el Client ID y Client Secret de Google Cloud.
3. Active la conexión para la SPA de UNA Chat.
4. En Google Cloud autorice el redirect URI que Auth0 muestra para la conexión.

## Variables

Use `antes/.env.example` como plantilla. El servidor no carga `.env`
automáticamente; inyéctelas desde PowerShell, la plataforma o un gestor de
secretos.

```text
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_AUDIENCE=<identifier-de-la-api>
AUTH0_CLIENT_ID=<client-id-publico>
APP_URL=http://127.0.0.1:3000
AUTH_TEST_MODE=0
```

`APP_URL` es la única URL pública necesaria. Debe apuntar a la raíz y usar HTTPS
fuera de localhost o `127.0.0.1`.

## Smoke test real pendiente

Inicie sesión con Google, confirme identidad y mensajería en dos navegadores,
cierre sesión y compruebe que el chat queda protegido. Este paso no se declara
verificado hasta contar con tenant, conexión Google y dominio reales.

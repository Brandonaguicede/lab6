# Despliegue unificado de UNA Chat

UNA Chat se despliega como un único servicio Node.js persistente. Express sirve
`index.html`, `client.js` y `runtime-config.js`; el mismo proceso mantiene
Socket.IO y valida los access tokens. No se usa Vercel.

## Configuración del servicio

- Directorio de trabajo: `antes/`.
- Instalación: `npm ci`.
- Inicio: `npm start`.
- Puerto: variable `PORT` de la plataforma; el valor local por defecto es 3000.
- Health check HTTP: `/`.
- WebSocket: habilitado y con afinidad a una sola instancia.

Variables obligatorias:

```text
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_AUDIENCE=<identifier-de-la-api>
AUTH0_CLIENT_ID=<client-id-publico>
APP_URL=https://<dominio-publico-del-servicio>
AUTH_TEST_MODE=0
```

`APP_URL` debe ser un origen sin ruta, query ni fragmento. En producción solo
acepta HTTPS. De este valor se derivan el callback, logout, web origin,
Socket.IO y CORS. No configure réplicas múltiples mientras el broadcast siga en
memoria; para escalar se necesita un adaptador compartido, por ejemplo Redis.

## Auth0 para producción

Si `APP_URL=https://chat.example.edu`, configure exactamente:

- Allowed Callback URLs: `https://chat.example.edu`
- Allowed Logout URLs: `https://chat.example.edu`
- Allowed Web Origins: `https://chat.example.edu`

## Verificación de producción

1. Confirme HTTPS y que `/runtime-config.js` no contiene secretos.
2. Inicie sesión con Google y confirme el retorno a `/`.
3. En dos navegadores, verifique identidad y mensajes en tiempo real.
4. Cierre sesión y confirme que el chat vuelve a quedar bloqueado.
5. Revise que logs y URLs nunca contengan access tokens.

La configuración local y automatizada está verificada. La publicación real
permanece pendiente de un dominio, valores Auth0 y autorización externa.

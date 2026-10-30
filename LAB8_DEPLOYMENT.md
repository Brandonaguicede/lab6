# Despliegue de UNA Chat con Auth0

Vercel sirve el frontend estático. Un servicio Node persistente sirve Socket.IO y valida JWT.

## Frontend Vercel

Directorio: `antes/`.

- Build command: `npm run build:frontend`
- Output directory: `dist`
- Configuración: `antes/vercel.json`

Variables: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_REDIRECT_URI`, `SOCKET_URL`, `ALLOWED_ORIGINS` y `AUTH_TEST_MODE=0`.

El build falla si falta configuración o si se activa test mode.

## Backend persistente

Use Render, Railway, Fly.io, una VM o un contenedor con Node persistente. No use Vercel Functions para este Socket.IO en memoria.

Comando: `npm start`.

Configure `PORT` y las mismas variables. Use el dominio del frontend como redirect y origen permitido; use el dominio HTTPS del backend como `SOCKET_URL`.

## Lista de producción

- HTTPS en frontend y backend.
- Callback y logout de Auth0 iguales a la raíz del frontend.
- CORS limitado a orígenes exactos.
- Ningún access token en logs.
- Dos navegadores mantienen mensajes en tiempo real.
- Antes de escalar a varias instancias, agregue pub/sub porque el broadcast sigue en memoria.

El build local está verificado. No se publicó producción porque faltan credenciales, dominios y autorización explícita.

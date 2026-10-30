# Informe final del Laboratorio 8

## Resultado

US-01 está implementada y verificada localmente. Frontend, configuración
pública, validación JWT y Socket.IO se ejecutan en un único servicio Node
persistente. No se usa Vercel.

## Implementación

- Auth0 Universal Login con SPA JS y PKCE.
- Access token en memoria; callback, restauración, identidad y logout.
- JWT vía JWKS con RS256, issuer, audience, firma, `exp` y `sub`.
- Handshake Socket.IO protegido e identidad derivada del principal validado.
- Express sirve la SPA y Socket.IO desde el mismo `APP_URL`.
- `APP_URL` deriva callback, logout, web origin, socket y CORS exacto.
- Modo de pruebas imposible de activar fuera de `NODE_ENV=test`.

## Evidencia

- 33 pruebas unitarias y 14 de integración aprobadas tras la unificación.
- 16 pruebas E2E aprobadas en la verificación completa.
- Regresiones de Lab 5, XSS y multimedia preservadas.
- Auditoría de dependencias y secretos sin hallazgos de producción.
- Harness saludable con la limitación documentada de memoria versionada.

## Configuración externa pendiente

Se requieren `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID` y el `APP_URL`
HTTPS definitivo. En Auth0, Allowed Callback URLs, Allowed Logout URLs y Allowed
Web Origins deben ser exactamente ese `APP_URL`. El login real con Google y la
publicación no se simulan y siguen pendientes.

## Guion de demostración

1. Mostrar doctor y el fixture de memoria anidada.
2. Recorrer constitución, spec, plan, progreso y verificación SDD.
3. Ejecutar `npm test` y `npm run test:e2e`.
4. Mostrar el rechazo sin token y la identidad derivada del JWT.
5. Mostrar que Express entrega la SPA y Socket.IO en el mismo origen.
6. Con valores reales, iniciar sesión con Google, enviar mensajes y cerrar sesión.

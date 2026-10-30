# Pruebas del Laboratorio 8

Estado de código verificado: `51f26a5` limpio.

| Capa | Resultado | Alcance |
| --- | --- | --- |
| Unitarias | 33 aprobadas | 19 base Lab 5 y 14 de Auth0, configuración y build. |
| Integración | 14 aprobadas | 6 regresiones base adaptadas y 8 de autenticación/configuración. |
| E2E Chromium | 16 aprobadas | 8 base Lab 5 y 8 de sesión Auth0 determinista. |
| Sintaxis | Aprobada | `server.js`, `client.js` y builder. |
| Harness | Aprobada | Fixture de raíz anidada. |
| Dependencias | Aprobada | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades. |
| Secretos | Aprobada | Control negativo detectado y árbol versionado limpio. |

## Comandos

Desde `antes/`:

```powershell
npm test
npm run test:e2e
npm run build:frontend
node harness/test-nested-root.mjs
npm audit --omit=dev --audit-level=high
```

## Cobertura de seguridad

- Token ausente, malformado, expirado, sin `exp`, con firma, issuer, audience o algoritmo incorrectos.
- JWT válido, subject obligatorio y conexión Socket.IO rechazada antes de publicar.
- Identidad del token sustituye cualquier nombre del navegador.
- Origen exacto permitido y subdominio impostor rechazado.
- Test auth exige `NODE_ENV=test` y `AUTH_TEST_MODE=1`.
- La rama `testMode:false` prueba SDK, callback, logout y reconexión con un SDK interceptado.
- XSS, URL no permitida, imagen, video y límites del Laboratorio 5.

Las pruebas interceptan el SDK de Auth0. Demuestran el contrato del cliente, no un login real con Google.


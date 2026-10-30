# Informe final del Laboratorio 8

## Resultado

US-01 está implementada, probada y revisada localmente. El laboratorio no se declara completamente terminado porque Auth0/Google reales, el despliegue y `Lab8.docx` no están disponibles.

## Implementación

- Universal Login con Auth0 SPA JS y PKCE.
- Access token en memoria y renovación en handshake y reconexión.
- Callback, restauración, identidad, cancelación y logout.
- JWT mediante JWKS con RS256, issuer, audience, firma, `exp` y `sub`.
- Socket.IO rechaza antes de registrar eventos y deriva la identidad del principal.
- CORS exacto, configuración pública sin secretos y test mode cerrado a producción.
- Frontend Vercel separado del backend Node persistente.

## Evidencia

- 33 unitarias, 14 integración y 16 E2E aprobadas.
- Build estático aprobado.
- `npm audit`: 0 vulnerabilidades de producción.
- Escaneo de secretos limpio.
- Seguridad, corrección y pruebas: APPROVE tras corregir logout, callback y reconexión.
- `rsc doctor`: healthy; memoria full/degraded por archivos de harness versionados.

## Commits de esta continuación

| Commit | Responsabilidad |
| --- | --- |
| `b597309` | Raíz anidada del harness y fixture. |
| `2c16fc6` | Seguridad backend y principal confiable. |
| `9193b43` | Sesión Auth0 protegida en frontend. |
| `05ac9e7` | Build Vercel y configuración segura. |
| `e47f119` | Pruebas Auth0 y despliegue. |
| `f23a552` | Sexta regresión de integración. |
| `51f26a5` | Logout, callback y reconexión de producción. |

## Pendientes

- Adjuntar y revisar `Lab8.docx`.
- Configurar tenant Auth0, API y conexión Google.
- Ejecutar login/logout real con Google.
- Desplegar frontend y backend con autorización.
- Registrar URLs finales y ejecutar smoke test HTTPS.

## Guion de demostración

1. Mostrar `rsc doctor` y ejecutar el fixture del harness.
2. Abrir constitución, spec, plan, progreso y verificación SDD.
3. Ejecutar `npm test` y `npm run test:e2e`.
4. Mostrar rechazo sin token e identidad derivada del principal.
5. Ejecutar el build Vercel y revisar los tres archivos de `dist`.
6. Con credenciales reales, iniciar sesión con Google, enviar y cerrar sesión.

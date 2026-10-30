# Pruebas del Laboratorio 8

## Resultado automatizado

| Capa | Resultado | Alcance |
| --- | --- | --- |
| Unitarias | 33 aprobadas | 19 base Lab 5 y 14 de Auth0/configuración unificada. |
| Integración | 14 aprobadas | 6 regresiones base y 8 de autenticación/configuración. |
| E2E Chromium | 16 aprobadas | 8 base Lab 5 y 8 de sesión Auth0 determinista. |
| Harness | Aprobada | Fixture de raíz anidada. |
| Dependencias | Aprobada | Auditoría de producción sin vulnerabilidades conocidas. |

## Comandos

Desde `antes/`:

```powershell
npm test
npm run test:e2e
node harness/test-nested-root.mjs
npm audit --omit=dev --audit-level=high
```

Las pruebas cubren token ausente, malformado, expirado, sin `exp`, firma,
issuer, audience y algoritmo incorrectos; JWT válido; identidad confiable;
CORS exacto; logout; callback; reconexión; XSS y validaciones del Laboratorio 5.
También comprueban que `APP_URL` deriva callback, Socket.IO y origen permitido,
y que HTTP no local se rechaza.

Las pruebas de navegador interceptan el SDK de Auth0. Demuestran el contrato del
cliente, no un login real con Google.

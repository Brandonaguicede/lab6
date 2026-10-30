# Progreso del Laboratorio 8

Actualizado: 2026-10-30

| Área | Estado | Evidencia |
| --- | --- | --- |
| Rama `feat/lab8-auth0` | VERIFICADO | Trabajo aislado; sin merge ni push. |
| Constitución y SDD | VERIFICADO | Enmienda 1.1.0 registra el servicio Node unificado. |
| rsc-harness y memoria | VERIFICADO CON LIMITACIÓN | Doctor saludable; fixture confirma la raíz anidada. |
| Frontend Auth0 | IMPLEMENTADO Y PROBADO | PKCE, callback, estados, identidad, logout y reconexión. |
| Backend JWT/Socket.IO | IMPLEMENTADO Y PROBADO | JWKS, RS256, claims y handshake protegido. |
| Despliegue unificado | IMPLEMENTADO Y PROBADO LOCALMENTE | Express y Socket.IO comparten `APP_URL`; se retiraron los artefactos Vercel. |
| Pruebas | VERIFICADO | 33 unitarias, 14 integración y 16 E2E. |
| Auth0 y Google reales | PENDIENTE DE CONFIGURACIÓN EXTERNA | Faltan tenant, client ID, audience y conexión Google reales. |
| Publicación real | BLOQUEADO POR CONFIGURACIÓN EXTERNA | Falta dominio HTTPS y autorización de publicación. |
| Contrato `Lab8.docx` | BLOQUEADO | El archivo aún no aparece en el workspace visible. |

## Hitos completados

- Memoria anidada del harness corregida y verificada.
- Auth0 Universal Login y protección completa del chat.
- Identidad derivada del JWT, CORS exacto y tokens solo en memoria.
- Un único servicio Node persistente para frontend y Socket.IO.
- Una única variable `APP_URL` para callback, logout, web origin, socket y CORS.
- Pruebas deterministas y auditoría de seguridad sin credenciales reales.

## Pendientes externos

1. Hacer visible `Lab8.docx` para reconciliar la rúbrica oficial.
2. Proporcionar `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID` y el
   `APP_URL` HTTPS definitivo.
3. Activar Google en Auth0 y registrar `APP_URL` en callback, logout y web origins.
4. Publicar el servicio Node y ejecutar el smoke test real.

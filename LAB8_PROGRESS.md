# Progreso del Laboratorio 8

Actualizado: 2026-10-30

## Estado ejecutivo

| Área | Estado | Evidencia |
| --- | --- | --- |
| Rama `feat/lab8-auth0` | VERIFICADO | Trabajo aislado; no se hizo merge ni push. |
| Constitución y SDD | VERIFICADO | Constitución 1.0.0, spec y plan US-01 aprobados en autopilot. |
| rsc-harness | VERIFICADO CON LIMITACIÓN | `rsc doctor` reportó `healthy`; memoria `full/degraded` porque scripts y hooks están versionados. |
| Memoria anidada | VERIFICADO | `node harness/test-nested-root.mjs` confirmó escritura bajo `antes/.rsc`, no en la raíz Git. |
| Frontend Auth0 | IMPLEMENTADO Y PROBADO | Estados, callback, PKCE mediante SDK, identidad, logout, error y reconexión. |
| Backend JWT/Socket.IO | IMPLEMENTADO Y PROBADO | JWKS, RS256, issuer, audience, exp, firma, subject y handshake protegido. |
| Regresión Lab 5 | VERIFICADO | 19 unitarias, 6 integración adaptadas y 8 E2E identificadas dentro de las suites actuales. |
| Pruebas totales | VERIFICADO | 33 unitarias, 14 integración y 16 E2E aprobadas. |
| Build Vercel | VERIFICADO LOCALMENTE | `npm run build:frontend` generó tres archivos estáticos sin secretos. |
| Auth0 y Google reales | PENDIENTE DE CONFIGURACIÓN EXTERNA | No hay tenant, client ID, API audience ni conexión Google en el workspace. |
| Despliegue real | BLOQUEADO POR AUTORIZACIÓN EXTERNA | No se publicó ni modificó producción. |
| Contrato `Lab8.docx` | BLOQUEADO | El archivo no existe en el workspace visible. |

## Hitos completados

- Corrección de rutas anidadas para memoria, knowledge-sync y auto-update.
- Autenticación SPA con Auth0 Universal Login y token en memoria.
- Autorización Socket.IO antes de registrar eventos del chat.
- Identidad derivada del JWT y no del payload del navegador.
- Configuración CORS exacta y validación cerrada de URLs públicas.
- Build estático para Vercel y backend Node persistente separado.
- Pruebas deterministas para JWT, SDK, callback, logout y reconexión.
- Auditoría de secretos, dependencias y revisión paralela de seguridad, corrección y pruebas.

## Bloqueos externos

1. Proporcionar `Lab8.docx` para reconciliar la rúbrica oficial.
2. Crear o facilitar un tenant de Auth0 con una SPA y una API.
3. Activar la conexión social Google y registrar callbacks, logout y web origins.
4. Autorizar y ejecutar el despliegue de Vercel y del backend persistente.
5. Ejecutar el smoke test manual con una cuenta Google real.

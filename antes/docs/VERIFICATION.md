# Registro de verificación — Laboratorio 5

Fecha de ejecución: 28 de octubre de 2026 (America/Costa_Rica).

## Evidencia 1 — comportamiento original

En un worktree aislado del commit original, el payload
`<script>alert('Inyección de script');</script>` produjo el diálogo nativo
`Inyección de script`. La captura de contexto está en
`evidence/evidence-1-xss-before.jpg`. El diálogo nativo no puede aparecer en
una captura de página de Playwright; la observación quedó registrada durante
la ejecución.

## Evidencias 2 y 3 — unidad e integración

Comando ejecutado:

```powershell
npm test
```

Resultado: Mocha: **18 passing**. Jest/Socket.IO: **1 suite passed, 3 tests
passed**. La integración utiliza clientes Socket.IO reales, comprueba que el
servidor llama a `validarMensaje`, verifica imagen y YouTube válidos y confirma
que un script no se retransmite; sus clientes y servidor se cierran al final.

## Evidencia 4 — navegador real

Comando ejecutado:

```powershell
npm run test:e2e -- --headed
```

Resultado: **3 passed** en Chromium: imagen cargada, iframe de YouTube
restringido cargado y XSS sin diálogo. El reporte HTML de Playwright permanece
en `playwright-report/` como artefacto generado localmente.

## Especificación, harness y dependencias

| Comando | Resultado |
| --- | --- |
| `npx openspec validate secure-una-chat --strict` | `Change 'secure-una-chat' is valid` |
| `npm run harness -- --requirement "Demostrar aislamiento de ejecuciones" --dry-run` | Genera ID y rama `harness/<id>` con las fases OpenSpec, Judge, lock, Author, FoFo, suites y PR, sin modificar el árbol. |
| `npm audit --json` | 0 vulnerabilidades (0 crítica, alta, moderada o baja) tras actualizar Express 4.22.3, Socket.IO 4.8.4 y Mocha 10.8.2. |
| `npx snyk test` | Bloqueado: `SNYK-0005` / HTTP 401 por falta de credenciales. No es un resultado limpio de Snyk. |

## Verificación posterior - REQ-010, REQ-011 y REQ-012

Ejecución integrada del 29 de octubre de 2026:

| Comando | Resultado real |
| --- | --- |
| `npm test` | Mocha: **19 passing**. Jest/Socket.IO: **1 suite, 6 tests passed**. |
| `npm run test:e2e` | Chromium: **8 passed** (XSS, imagen, vídeo y REQ-010/011/012). |
| FoFo `spec-lint`, `trace-gate`, `redgreen-gate`, `intent-gate`, `secret-scan`, `test-lock`, `oversight-integrity`, `separation-gate` | Aprobados individualmente en los tres worktrees aislados. |

Los tres Judge escribieron sus pruebas sin modificar código, las pruebas se
bloquearon con el `test-lock` oficial y el Author implementó después en otro
contexto. FoFo emitió una única escalación de revisión para `deps-gate`: al
ejecutarse desde `antes/`, que es un subdirectorio del repositorio Git, el gate
resolvió `package.json` contra la raíz Git y lo interpretó como nuevo. Las ramas
REQ-010, REQ-011 y REQ-012 no modifican `package.json` ni `package-lock.json`.
No se declara FoFo completamente aprobado hasta configurar ese gate con rutas
relativas a la raíz Git o recibir la revisión del operador.


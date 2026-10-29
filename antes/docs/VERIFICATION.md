# Registro de verificacion - Laboratorio 5

Fecha principal de ejecucion: 29 de octubre de 2026 (America/Costa_Rica).

## Evidencia 1 - comportamiento original

En un worktree aislado del commit original, el payload
`<script>alert('Inyeccion de script');</script>` produjo el dialogo nativo
`Inyeccion de script`. La captura de contexto esta en
`evidence/evidence-1-xss-before.jpg`. El dialogo nativo no aparece dentro de
una captura de pagina de Playwright; su aparicion fue observada y registrada
en la ejecucion aislada.

## Evidencias 2, 3 y 4 - suites finales

| Comando | Resultado real |
| --- | --- |
| `npm test` | Mocha: **19 passing**; Jest/Socket.IO: **1 suite, 6 tests passed**. |
| `npm run test:e2e` | Chromium: **8 passed**: imagen, YouTube restringido, XSS sin dialogo y REQ-010/011/012. |
| `npx openspec validate secure-una-chat --strict` | `Change 'secure-una-chat' is valid`. |

La integracion usa clientes Socket.IO reales y verifica la llamada a
`validarMensaje`, acepta multimedia permitida, rechaza scripts y cierra los
recursos creados por la prueba. La E2E registra `page.on('dialog')` antes del
envio XSS, por lo que cualquier alerta inesperada falla el escenario.

## Harness y FoFo

| Comprobacion | Resultado |
| --- | --- |
| `npm run harness -- --requirement "Demostrar aislamiento de ejecuciones" --dry-run` | Genera ID y rama `harness/<id>` con fases OpenSpec, Judge, lock, Author, FoFo, suites y PR sin alterar la aplicacion. |
| Gates FoFo por worktree | `spec-lint`, `trace-gate`, `redgreen-gate`, `intent-gate`, `secret-scan`, `test-lock`, `oversight-integrity` y `separation-gate` aprobados. |
| `deps-gate` | Escalacion conservada por la ruta anidada `antes/`; no se omite. Vease `FOFO_DEPS_GATE.md`. |

Los tres Judge escribieron pruebas sin cambiar codigo. Se bloquearon con el
`test-lock` oficial y Author implemento en otro contexto. Cada rama contiene
solo su requisito al compararse contra `0d33eb9`; `adfe3c1` contiene la
integracion conjunta validada.

## Snyk y npm audit

| Comando | Resultado final |
| --- | --- |
| `npx snyk test` | **0 issues, 0 vulnerable paths** (autenticado). |
| `npm audit --json` | 0 criticas, 0 altas, 0 medias y 5 bajas de Jest de desarrollo. |

El resultado final de Snyk se logro actualizando Mocha 12 y fijando
transitivas vulnerables de Express y Socket.IO mediante overrides compatibles.

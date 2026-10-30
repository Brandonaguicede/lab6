# Laboratorio 5 - Progreso

Actualizado: 29 de octubre de 2026 (America/Costa_Rica).

## Integracion validada

El commit de referencia es `adfe3c1` en `feat/lab5-security-tests-harness`.
Conserva proteccion XSS, multimedia HTTPS restringida, validacion Socket.IO,
REQ-010, REQ-011, REQ-012 y el harness OpenSpec + FoFo. El trabajo posterior
de dependencias se confirmara en un commit independiente sin alterar esa
referencia.

| Verificacion | Comando | Resultado real del 29-10-2026 |
| --- | --- | --- |
| Unitaria e integracion | `npm test` | Mocha: 19 aprobadas; Jest/Socket.IO: 1 suite, 6 aprobadas. |
| E2E | `npm run test:e2e` | Chromium: 8 aprobadas. |
| OpenSpec | `npx openspec validate secure-una-chat --strict` | `Change 'secure-una-chat' is valid`. |
| Snyk autenticado | `npx snyk test` | 0 incidencias, 0 rutas vulnerables. |
| npm audit | `npm audit --json` | 0 criticas, 0 altas; 5 bajas de herramientas de desarrollo de Jest. |

## Dependencias y seguridad

El primer escaneo autenticado de Snyk identifico 22 incidencias en 25 rutas,
incluida una critica en `proxy-addr` y altas transitivas de Mocha y Socket.IO.
Se actualizo Mocha a `12.0.3` como dependencia de desarrollo y se fijaron
overrides compatibles para `proxy-addr@2.0.8`, `socket.io-parser@4.2.7`,
`ws@8.22.0` y el `picomatch@2.3.2` usado por `anymatch`. El escaneo final de
Snyk sobre `package-lock.json` reporta 0 incidencias.

Las cinco alertas bajas que aun muestra `npm audit` pertenecen al arbol de
Jest. Su solucion automatica propuesta es un cambio mayor/inconsistente de
Jest; no se fuerza sin una actualizacion compatible revisada. No hay alertas
criticas ni altas de npm audit y Snyk no reporta vulnerabilidades conocidas.

## Ramas de demostracion

| Requisito | Rama | Base de PR recomendada | Estado |
| --- | --- | --- | --- |
| REQ-010 | `lab5/req-010` | `29cc19c` (`lab5/harness-base`) | Solo rechazo/aviso de mensaje vacio, prueba E2E y artefactos FoFo. |
| REQ-011 | `lab5/req-011` | `29cc19c` (`lab5/harness-base`) | Solo nombre obligatorio, prueba E2E y artefactos FoFo. |
| REQ-012 | `lab5/req-012` | `29cc19c` (`lab5/harness-base`) | Solo limite de 280, pruebas unitaria/E2E y artefactos FoFo. |

Los tres cambios son funcionalmente compatibles: la integracion ya fue
verificada en `adfe3c1` con 19 pruebas unitarias, 6 de integracion y 8 E2E.
Sus artefactos FoFo y el formulario compartido pueden provocar conflictos de
texto si se fusionan en paralelo; deben integrarse de forma coordinada o como
PRs apilados sobre la misma base.

Cada rama tiene `TEST-LOCK.json` y `PROVENANCE.yaml` con contextos separados
de Judge y Author. FoFo aprobo spec, trazabilidad, red/green, intencion,
secretos, lock, integridad y separacion. `deps-gate` conserva una escalacion
honesta documentada en `antes/docs/FOFO_DEPS_GATE.md`; no se desactivo.

## Publicacion pendiente de informacion externa

- El remoto anterior se conserva sin cambios. `origin` ahora apunta al nuevo
  repositorio vacio `https://github.com/Brandonaguicede/lab6.git`, destinado a
  publicar esta integracion local sin mezclar historiales independientes.
- `repositorio.txt` contiene la URL real de ese repositorio.
- GitHub CLI aun no esta disponible en el entorno (`gh` no se encontro). Las
  ramas pueden publicarse mediante Git, pero los PRs reales requieren `gh` o
  creacion manual desde GitHub.
- Cuando termine la instalacion de GitHub CLI, ejecute localmente:

  ```powershell
  gh auth login
  ```

  Despues del push, cree tres PRs hacia `lab5/harness-base` o permita
  que el agente los cree con GitHub CLI. Los PRs incluyen REQ-010, REQ-011 y
  REQ-012, sus pruebas independientes y su trazabilidad FoFo.

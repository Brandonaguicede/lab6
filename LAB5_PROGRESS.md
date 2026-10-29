# Laboratorio 5 - Progreso

Actualizado: 29 de octubre de 2026 (America/Costa_Rica).

## Integración validada

El commit de referencia es `adfe3c1` en `feat/lab5-security-tests-harness`.
Conserva la protección XSS, multimedia HTTPS restringida, validación Socket.IO,
las reglas REQ-010, REQ-011 y REQ-012, y el harness OpenSpec + FoFo.

| Suite | Comando | Último resultado |
| --- | --- | --- |
| Unitaria | `npm test` | Mocha: 19 aprobadas |
| Integración | `npm test` | Jest/Socket.IO: 1 suite, 6 aprobadas |
| E2E | `npm run test:e2e` | Chromium: 8 aprobadas |
| Dependencias local | `npm audit --json` | 0 vulnerabilidades |

## Ramas de demostración

| Requisito | Rama | Estado |
| --- | --- | --- |
| REQ-010 | `lab5/req-010` | Judge y Author confirmados; E2E: 3 aprobadas |
| REQ-011 | `lab5/req-011` | Judge y Author confirmados; E2E: 2 aprobadas |
| REQ-012 | `lab5/req-012` | Judge y Author confirmados; 3 unitarias y 2 E2E aprobadas |

Cada rama tiene un `TEST-LOCK.json` oficial y un `PROVENANCE.yaml` que registra
contextos diferentes para Judge y Author. FoFo aprobó spec, trazabilidad,
red/green, intención, secretos, lock, integridad y separación. La única
escalación es `deps-gate`; su causa y solución están documentadas en
`antes/docs/FOFO_DEPS_GATE.md`.

## Publicación pendiente

- GitHub CLI no está instalado y no existe remoto Git.
- Snyk no está instalado o autenticado; por ello no se ha declarado un resultado
  de Snyk para esta fase.
- No se creó `repositorio.txt`, porque no hay una URL real que pueda escribirse.
- No se crearon Pull Requests: hacerlo sin remoto o credenciales sería simularlos.

## Próximo operador

1. Instale GitHub CLI: `winget install --id GitHub.cli`.
2. En una terminal local, autentique sin compartir secretos: `gh auth login`.
3. Proporcione la URL del repositorio GitHub para configurar `origin`.
4. Instale/autentique Snyk localmente y ejecute `snyk auth`.
5. Reanude el agente para ejecutar Snyk, publicar ramas, crear PR y generar
   `repositorio.txt` con el enlace real.

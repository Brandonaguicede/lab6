# Laboratorio 5 - Reporte final local

## Resultado tecnico

La integracion de referencia `adfe3c1` protege UNA Chat frente a XSS, valida
las entradas en servidor, construye multimedia segura mediante DOM y limita
mensajes a 280 caracteres. Los avisos de interfaz cumplen REQ-010 (mensaje
vacio), REQ-011 (nombre requerido) y REQ-012 (mensaje largo).

## Cambios relevantes

- `antes/libs/unalib.js`: clasificacion HTTPS segura, rechazo de HTML y
  protocolos peligrosos, validacion de nombre/mensaje/limite.
- `antes/index.html`: renderizado DOM seguro, multimedia restringida y avisos
  de validacion.
- `antes/test/`, `antes/tests/integration/`, `antes/tests/e2e/`: pruebas
  unitarias, Socket.IO y navegador real.
- `antes/harness/`: OpenSpec, worktrees aislados, bloqueo de pruebas y
  adaptador Windows para los gates oficiales de FoFo.
- `antes/package.json` y `antes/package-lock.json`: actualizacion de Mocha y
  overrides de dependencias vulnerables detectadas por Snyk.

## Verificacion reproducible

```powershell
cd antes
npm install
npm test
npm run test:e2e
npx openspec validate secure-una-chat --strict
npx snyk test
npm audit --json
```

Resultados reales del 29 de octubre de 2026: 19 unitarias aprobadas, 6 de
integracion aprobadas, 8 E2E Chromium aprobadas, OpenSpec valido y Snyk con
0 incidencias conocidas. `npm audit` no reporta alertas criticas ni altas;
mantiene cinco bajas transitivas de Jest, no incorporadas a produccion.

## Snyk y FoFo

El primer Snyk autenticado encontro 22 incidencias (1 critica, 13 altas, 5
medias y 3 bajas) en 25 rutas. La actualizacion de Mocha 12 y los overrides de
`proxy-addr`, `socket.io-parser`, `ws` y `picomatch` redujeron el escaneo final
a 0 incidencias. La escalacion `deps-gate` de FoFo no se omite: deriva de que
el proyecto vive en `antes/` bajo una raiz Git superior. La solucion oficial y
reproducible esta en `antes/docs/FOFO_DEPS_GATE.md`.

## PRs y entrega

Existen las ramas locales `lab5/req-010`, `lab5/req-011` y `lab5/req-012`,
con pruebas independientes, locks y proveniencia. Parten de `29cc19c`, que
incorpora OpenSpec y el harness FoFo; por eso sus PRs deben tener como base
la rama remota `lab5/harness-base`. Asi cada PR contiene exclusivamente
su requisito. `adfe3c1` es la integracion conjunta ya comprobada.

El repositorio anterior se conserva sin cambios. `origin` se redirigio al
repositorio nuevo y vacio `https://github.com/Brandonaguicede/lab6.git`, que
acepta el historial local sin merge ni push forzado. `repositorio.txt` guarda
esa URL real. La publicacion de ramas puede realizarse mediante Git; los PRs
no se simulan y requieren GitHub CLI autenticado o creacion manual en GitHub.

Tambien falta que GitHub CLI quede disponible y autenticado mediante:

```powershell
gh auth login
```

## Exposicion

1. Muestre `adfe3c1` como integracion comprobada y ejecute `npm test` y
   `npm run test:e2e`.
2. Demuestre XSS, imagen, video y los avisos REQ-010/011/012.
3. Abra `antes/docs/FOFO_DEPS_GATE.md` para explicar la separacion Judge /
   Author, worktrees y la escalacion conservada.
4. Ejecute `npx snyk test` autenticado para mostrar 0 incidencias.
5. Presente los tres PRs sobre `lab5/harness-base` y la URL real en
   `repositorio.txt`.

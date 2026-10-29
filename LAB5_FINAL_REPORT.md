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
con pruebas independientes, locks y proveniencia. Parten de `0d33eb9`; por
eso sus PRs deben tener como base una rama remota que apunte a ese commit,
por ejemplo `lab5/base-security-media`. Asi cada PR contiene exclusivamente
su requisito. `adfe3c1` es la integracion conjunta ya comprobada.

No existe remoto Git y `gh` aun no esta instalado/disponible en este entorno.
No se simularon PRs ni se escribio `repositorio.txt`. Para terminar la entrega
externa falta ejecutar `gh auth login`, proporcionar la URL real, configurar
`origin`, publicar las ramas y crear los tres PRs. Tras ello se escribe la URL
confirmada en `repositorio.txt`.

## Exposicion

1. Muestre `adfe3c1` como integracion comprobada y ejecute `npm test` y
   `npm run test:e2e`.
2. Demuestre XSS, imagen, video y los avisos REQ-010/011/012.
3. Abra `antes/docs/FOFO_DEPS_GATE.md` para explicar la separacion Judge /
   Author, worktrees y la escalacion conservada.
4. Ejecute `npx snyk test` autenticado para mostrar 0 incidencias.
5. Cuando exista `origin`, presente los tres PRs apilados sobre
   `lab5/base-security-media` y la URL en `repositorio.txt`.

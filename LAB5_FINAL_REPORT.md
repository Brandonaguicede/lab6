# Laboratorio 5 - Reporte final provisional

## Resultado técnico

La integración local validada en `adfe3c1` protege el chat frente a XSS, valida
las entradas en servidor, construye multimedia segura mediante DOM, y limita los
mensajes a 280 caracteres. Los avisos de interfaz cumplen REQ-010 (mensaje
vacío), REQ-011 (nombre requerido) y REQ-012 (mensaje largo).

## Cambios relevantes

- `antes/libs/unalib.js`: clasificación segura HTTPS, rechazo de HTML/protocolos
  peligrosos y validación de nombre/mensaje/límite.
- `antes/index.html`: renderizado con DOM seguro, recursos multimedia
  restringidos y mensajes de validación comprensibles.
- `antes/test/`, `antes/tests/integration/`, `antes/tests/e2e/`: cobertura
  unitaria, Socket.IO y navegador real.
- `antes/harness/`: OpenSpec, aislamiento por worktree, lock de pruebas y
  adaptador compatible con los gates oficiales de FoFo en Windows.

## Verificación reproducible

```powershell
cd antes
npm install
npm test
npm run test:e2e
npm audit --json
npx openspec validate secure-una-chat --strict
```

Para instalar FoFo:

```powershell
.\harness\install-fofo.ps1
$env:FOFO_ROOT = (Resolve-Path .\.harness\vendor\Agentic-SDLC\plugins\fofo\skills\sdlc)
```

Después, complete `harness/config.json` con procesos separados de Judge y
Author y ejecute `npm run harness -- --requirement "..." --config harness/config.json`.

## Estado de seguridad

`npm audit --json` informa 0 vulnerabilidades. Snyk sigue pendiente de instalar
y autenticar; por tanto, este reporte no afirma una evaluación Snyk limpia. La
escalación FoFo de dependencias se conserva y su configuración correcta está en
`antes/docs/FOFO_DEPS_GATE.md`.

## Pull Requests y entrega

Las ramas locales `lab5/req-010`, `lab5/req-011` y `lab5/req-012` existen con
sus pruebas independientes. Su combinación funcional ya fue verificada en
`adfe3c1`. Al compartir archivos de contrato FoFo y el mismo formulario, sus
diffs directos entre sí requieren integración coordinada; no se deben fusionar
en paralelo sin resolver esos artefactos. No hay remoto ni autenticación GitHub,
así que no existen PR reales ni `repositorio.txt` todavía.

## Pendientes que requieren intervención externa

1. Instalar/autenticar GitHub CLI y proporcionar la URL del repositorio.
2. Instalar/autenticar Snyk y ejecutar el escaneo.
3. Resolver el resultado de Snyk, repetir las tres suites si cambia una
   dependencia, publicar las ramas y crear PRs reales.
4. Escribir la URL confirmada en `repositorio.txt`.

---
type: verification
title: Verification — US-01 unified deployment — 2026-10-30
description: Evidence for the single persistent Node origin amendment.
tags: [sdd, verification, auth0, socket.io, deployment]
timestamp: 2026-10-30T23:30:00Z
topic: sdd
slug: us-01-auth0-google
source_state: b4a58e9 (clean before this verification record)
---

# Verification — US-01 unified deployment — 2026-10-30

## Stack gate

- `npm test` — PASS: 33 unitarias y 14 integración.
- `npm run test:e2e` — PASS: 16 Chromium.
- `node --check` — PASS: servidor, cliente y configuración Auth0.
- `npm audit --omit=dev --audit-level=high` — PASS: 0 vulnerabilidades.
- `node harness/test-nested-root.mjs` — PASS.
- `npx --yes @ericrisco/rsc doctor` — PASS: harness healthy; memoria full/degraded por rutas versionadas ya documentadas.
- Escaneo suplementario de claves privadas, JWT y client secrets asignados — sin coincidencias.

## Done-check T009

- [x] `APP_URL` deriva callback, Socket.IO y CORS exacto.
- [x] HTTP se permite solo en localhost/loopback; producción exige HTTPS.
- [x] `vercel.json`, builder estático, script de build y `dist` fueron retirados.
- [x] `.env.example` y documentación contienen placeholders, no secretos.
- [x] Regresión completa aprobada.

## Criterios afectados

- [x] Login, logout y reconexión conservan el mismo origen — 16 E2E.
- [x] Handshake y publicación siguen protegidos — 14 integración.
- [x] XSS, multimedia y límites de Lab 5 siguen verdes — todas las capas.
- [x] Configuración inválida falla cerrada — unitarias de `APP_URL`.

## Capas no ejecutadas

- **HERRAMIENTA-AUSENTE** — `Lab8.docx`: no aparece en el workspace visible.
- **HERRAMIENTA-AUSENTE** — tenant Auth0, conexión Google y dominio HTTPS reales: el smoke test externo no se ejecutó.
- **NO-APLICA** — Vercel: fue retirado por decisión explícita del propietario.

## Verdict

PASS para la enmienda local T009. La autenticación Google real y la publicación
siguen pendientes de configuración externa y no se presentan como verificadas.

# Seguridad y verificacion de UNA Chat

## Politica aplicada

- El servidor llama `validarMensaje` antes de retransmitir por Socket.IO.
- Nombre y mensaje son obligatorios; los limites son 50 y 280 caracteres. El
  cliente conserva el texto demasiado largo y solo limpia un envio aceptado.
- Se rechazan etiquetas HTML y esquemas peligrosos, incluidos `javascript:` y
  `data:`.
- Solo se clasifica multimedia HTTPS sin credenciales: imagenes con extension
  permitida, archivos de video permitidos y rutas estrictas de YouTube.
- `getImageTag` y `getEmbeddedCode` se conservan como API heredada, pero
  devuelven una URL segura o `null`; no construyen HTML.
- El navegador usa `createElement`, `textContent` y asignacion de atributos;
  no usa `.html()`, `innerHTML` ni concatenacion de etiquetas.
- El iframe usa `youtube-nocookie.com` validado, `sandbox` y
  `referrerPolicy`; imagenes y videos manejan errores de carga.

## Suites validadas el 29 de octubre de 2026

| Suite | Comando | Resultado |
| --- | --- | --- |
| Unitaria | `npm run test:unit` | 19 aprobadas. |
| Integracion | `npm run test:integration` | 1 suite, 6 aprobadas; clientes y servidor Socket.IO se cierran. |
| E2E | `npm run test:e2e` | 8 aprobadas en Chromium: multimedia, XSS y REQ-010/011/012. |

La E2E intercepta solamente recursos multimedia externos de prueba; pagina,
cliente Socket.IO y backend son los del proyecto.

## Evidencia inicial

En el worktree aislado del commit original, el payload
`<script>alert('Inyeccion de script');</script>` produjo el dialogo nativo
`Inyeccion de script`. La captura de contexto esta en
`evidence/evidence-1-xss-before.jpg`; el script no aparece como texto porque
fue interpretado por la version vulnerable.

## Dependencias

Snyk se autentico y su ultimo `npx snyk test` sobre `package-lock.json`
reporto 0 incidencias y 0 rutas vulnerables. El primer escaneo habia detectado
22 incidencias en 25 rutas, incluida una critica en `proxy-addr` y altas en
transitivas de Mocha y Socket.IO. Se actualizo Mocha a 12 y se aplicaron
overrides para `proxy-addr@2.0.8`, `socket.io-parser@4.2.7`, `ws@8.22.0` y
`picomatch@2.3.2` bajo `anymatch`.

`npm audit --json` tampoco reporta criticas ni altas; conserva cinco alertas
bajas en el arbol de desarrollo de Jest. No se fuerza una actualizacion mayor
sin una revision de compatibilidad.

# Seguridad y verificación de UNA Chat

## Política aplicada

- Los mensajes se validan en el servidor mediante validarMensaje antes de retransmitirse por Socket.IO.
- Nombre y mensaje son obligatorios; los límites son 50 y 1000 caracteres.
- Se rechazan etiquetas HTML y URL con esquema peligroso, incluidos javascript: y data:.
- Solo se clasifican como multimedia URL HTTPS sin credenciales: imágenes con extensión permitida, archivos de vídeo permitidos y rutas estrictas de YouTube.
- getImageTag y getEmbeddedCode se conservaron como API heredada, pero devuelven URL segura o null; no construyen HTML.
- El navegador construye con createElement, textContent y atributos asignados. No usa .html(), innerHTML ni concatenación de etiquetas.
- El iframe usa la URL youtube-nocookie.com validada, sandbox y referrerPolicy; imágenes y vídeos manejan error de carga.

## Suites

| Suite | Comando | Cobertura |
| --- | --- | --- |
| Unitaria | npm run test:unit | validadores, tipos, límites, XSS y multimedia |
| Integración | npm run test:integration | evento Socket.IO, llamada a validarMensaje, rechazo y cierre de recursos |
| E2E | npm run test:e2e | Chromium con imagen, vídeo y detección de dialog por XSS |

La prueba E2E intercepta solo los recursos multimedia externos de prueba para mantener medios reproducibles; página, cliente Socket.IO y backend son los del proyecto.

## Evidencia inicial

La reproducción aislada del commit original con el payload del enunciado disparó el diálogo con el texto `Inyección de script`. La captura de contexto de esa ejecución se conserva como `evidence/evidence-1-xss-before.jpg`; el contenido de script no es visible porque ya fue interpretado como elemento HTML, que es precisamente el comportamiento vulnerable observado.

## Snyk

El 28 de octubre de 2026, npx snyk test terminó con SNYK-0005 / HTTP 401 porque no hay credenciales Snyk válidas en el entorno. No se declara un resultado de Snyk ni una aplicación libre de vulnerabilidades. Como comprobación local adicional, npm audit --json reportó 0 vulnerabilidades tras actualizar el árbol bloqueado de dependencias.

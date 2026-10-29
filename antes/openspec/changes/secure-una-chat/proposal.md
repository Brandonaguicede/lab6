## Why

UNA Chat permitía interpretar contenido HTML de usuario en el navegador y sus validadores de URL fallaban al usar una variable inexistente. El laboratorio requiere bloquear la inyección de scripts, soportar multimedia de forma segura y demostrarlo mediante pruebas.

## What Changes

- Validar y tipar mensajes antes de retransmitirlos por Socket.IO.
- Reemplazar la creación de HTML por nodos DOM seguros para texto, imágenes y vídeo.
- Añadir pruebas unitarias, de integración y E2E.
- Incorporar un contrato OpenSpec y un harness preparado para Judge/Author/FoFo.

## Impact

- Afecta la librería libs/unalib.js, el evento Socket.IO, el cliente y la configuración de pruebas.
- Se añaden dependencias de desarrollo para Jest, Socket.IO client, Playwright y OpenSpec.

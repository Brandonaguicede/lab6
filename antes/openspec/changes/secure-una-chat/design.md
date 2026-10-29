## Context

El cliente emitía un JSON por Socket.IO. El servidor lo reenviaba tras transformar URL en cadenas HTML, y el navegador las insertaba con jQuery .html().

## Decisions

- validarMensaje devuelve un resultado válido con valor o uno inválido con código; validateMessage continúa disponible para compatibilidad.
- El servidor difunde solo el valor; para errores, responde al emisor por Evento-Error-Server.
- El cliente decide el elemento por tipo y lo crea mediante DOM APIs; conserva defensas al verificar protocolo y color.
- Se acepta HTTPS para imágenes (jpg, jpeg, png, gif, webp, avif), vídeos (mp4, webm, ogv) y formatos explícitos de YouTube.
- La integración usa socket.io-client porque el flujo real no tiene una ruta HTTP de mensajes.

## Risks / Trade-offs

- La extensión URL no certifica por sí sola el MIME remoto. Se limita al conjunto reducido aceptado y los errores de carga se informan sin evaluar respuesta.
- Los embeds de YouTube requieren scripts para funcionar; se limita el host, el ID, los permisos del iframe y el sandbox.

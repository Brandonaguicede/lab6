# REQ-012 — Límite de longitud del mensaje

## Criterio EARS

WHEN a visitor activates Send with a message longer than 280 characters THEN the system SHALL NOT add that message to the transcript, SHALL keep the message text in the field, and SHALL tell the visitor the message is too long.

## Límites verificables

- Un mensaje de 279 caracteres se acepta.
- Un mensaje de 280 caracteres se acepta.
- Un mensaje de 281 caracteres se rechaza.
- Un mensaje muy superior al límite también se rechaza.

## ADDED Requirements

### Requirement: Mensajes seguros

El sistema SHALL validar el tipo, contenido, nombre y longitud de un mensaje antes de difundirlo.

#### Scenario: Se recibe un script

- **WHEN** un cliente envía una etiqueta HTML o script
- **THEN** el servidor SHALL rechazarlo, notificar un código de error al emisor y no retransmitirlo.

#### Scenario: Se recibe texto legítimo

- **WHEN** un cliente envía texto no vacío dentro del límite
- **THEN** el sistema SHALL mostrarlo como texto sin interpretar HTML.

### Requirement: Multimedia permitida

El sistema SHALL clasificar únicamente URL HTTPS de imagen, vídeo de archivo o YouTube permitidas y SHALL construir su representación mediante DOM seguro.

#### Scenario: Se recibe una URL de imagen válida

- **WHEN** un cliente envía una URL HTTPS con extensión de imagen permitida
- **THEN** el chat SHALL mostrar un elemento img responsive y manejar un error de carga.

#### Scenario: Se recibe un enlace YouTube válido

- **WHEN** un cliente envía una URL HTTPS de YouTube con ID válido
- **THEN** el chat SHALL crear un iframe restringido que usa una URL de embed youtube-nocookie.com.

#### Scenario: Se recibe una URL peligrosa

- **WHEN** un cliente envía una URL javascript:, data: o HTTPS que no es multimedia permitido
- **THEN** el servidor SHALL rechazarla y no crear un atributo de recurso en el navegador.

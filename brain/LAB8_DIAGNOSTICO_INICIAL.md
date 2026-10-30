# Laboratorio 8 Diagnostico inicial

Fecha: 2026-10-29 (America/Costa_Rica)

## Alcance de esta entrada

Esta entrada conserva el diagnostico previo a cualquier instalacion o cambio
funcional. No contiene secretos, valores de Auth0, tokens, dominios privados ni
credenciales. Las propuestas tecnicas quedan pendientes de la aprobacion
explicita solicitada por el laboratorio.

## Estado del workspace recibido

El directorio de trabajo inspeccionado es `C:\Users\aguir\OneDrive\Documentos\lab5`.
No contiene los insumos que la solicitud describe como ya presentes:

- No existe `Lab8.docx` ni una variante de ese nombre en el workspace ni en
  `C:\Users\aguir\OneDrive\Documentos`.
- No existe `AGENTS.md`, `brain/` previo, `Knowledge/`, `Skills/` ni
  `Repos/UNA-Chat/`.
- No existe un directorio llamado `UNA-Chat` bajo
  `C:\Users\aguir\OneDrive\Documentos`.

Se creo esta primera entrada porque se solicito documentar el diagnostico en
memoria persistente y el directorio `brain/` no existia. Esta entrada no
sustituye la memoria inicial que falta: se debe integrar o migrar cuando se
proporcione el workspace correcto.

## Repositorio y rama

- Repositorio Git actual: `https://github.com/Brandonaguicede/lab6.git`.
- Rama local actual: `feat/lab5-security-tests-harness` en `ee2ec46`.
- El listado local y las referencias remotas almacenadas no contienen
  `feat/lab8-auth0`.
- La consulta remota de solo lectura con `git ls-remote --heads origin
  refs/heads/feat/lab8-auth0` no devolvio ninguna referencia; por tanto, esa
  rama no existe en el remoto configurado a la fecha de este diagnostico.
- Hay un archivo no seguido ajeno al analisis: `~$b_5_Paradigmas_2026.pdf`.
  No se modifica.

## Arquitectura comprobada del artefacto Lab 5 disponible

El proyecto de chat que si existe esta anidado en `antes/`; se trata como una
copia local de referencia, no como sustituto confirmado de `Repos/UNA-Chat`.

- Backend: Node.js 24.3.0 en el entorno, Express `4.22.3`, Socket.IO `4.8.4`.
  `server.js` crea un servidor HTTP, adjunta Socket.IO y escucha `PORT` o
  `3000` cuando se ejecuta directamente.
- Frontend: una unica pagina `index.html`, JavaScript sin framework y cliente
  Socket.IO cargado desde `/socket.io/socket.io.js`. No hay API REST de
  mensajes, base de datos, sesiones, CORS, autenticacion, OAuth ni Auth0.
- Flujo: el navegador emite `Evento-Mensaje-Server`; el servidor llama
  `validarMensaje`; si es valido, retransmite a todos los sockets. Los errores
  se devuelven al emisor mediante `Evento-Error-Server` y acknowledgement.
- Seguridad de Lab 5: `libs/unalib.js` valida nombre, longitud, texto/URLs y
  tipo de multimedia; el frontend construye nodos DOM sin insertar HTML de
  usuarios. Estas rutas de validacion y eventos son regresiones que deben
  preservarse.
- Pruebas: Mocha unitario, Jest de integracion con `socket.io-client` y
  Playwright E2E. `npm test` ejecuta unitarias e integracion; `npm run
  test:e2e` levanta `node server.js` localmente.
- El `.gitignore` raiz no excluye actualmente `.env` ni otros ficheros locales
  de credenciales. Antes de configurar Auth0 se debe acordar y anadir una
  politica de secretos, incluido `.env`, sin incluir valores reales.

## Documentacion consultada

### rsc-harness

Se consulto el README oficial de `ericrisco/rsc-harness` el 2026-10-29:
https://github.com/ericrisco/rsc-harness.

Conclusiones aplicables:

- El comando de inicio es `npx @ericrisco/rsc@latest onboard` y la primera
  ejecucion debe producir un plan con identificador SHA-256 sin escribir.
  Solo una segunda ejecucion con `--accept-plan <id>` aplica cambios tras la
  aceptacion del usuario.
- Para Codex, rsc puede instalar reglas bajo `.codex/` y un bloque administrado
  en `AGENTS.md`; los datos internos van a `.rsc/`. En Windows pueden usarse
  copias en lugar de enlaces simbolicos para los skills.
- El arnes propone tambien worktrees, sincronizacion de conocimiento mediante
  una rama `rsc/knowledge`, permisos Git y memoria de sesion. Son decisiones
  opt-in que pueden crear cambios y automatizaciones no necesarias para este
  laboratorio.
- Su propia guia indica que los skills propios no se sobrescriben, pero exige
  revisar si el plan declara que reemplazaria un skill existente con el mismo
  nombre.

### Auth0 y Socket.IO

Fuentes oficiales consultadas el 2026-10-29:

- Auth0 recomienda para un cliente SPA el Authorization Code Flow con PKCE y
  Universal Login mediante `auth0-spa-js`; una SPA publica no debe poseer un
  client secret.
- Para una API Express, Auth0 documenta validar access tokens JWT con emisor y
  audiencia mediante `express-oauth2-jwt-bearer`.
- Socket.IO documenta el envio de credenciales por `auth` en el handshake y su
  validacion en `io.use(...)`; rechazar con `next(Error)` genera
  `connect_error` en el cliente.

### Vercel

Documentacion oficial revisada el 2026-10-29:

- Desde octubre de 2026, Vercel declara soporte general para WebSockets en
  Functions. Sin embargo, las conexiones quedan fijadas a una instancia, cada
  conexion caduca al llegar a la duracion maxima de la funcion y una
  reconexion puede caer en otra instancia o despliegue.
- El propio proveedor exige reconexion del cliente y almacenamiento/pub-sub
  externo para estado y difusion entre instancias. Sus ejemplos incluyen
  Socket.IO como libreria compatible, pero no convierten un servidor con estado
  en memoria en un despliegue duradero y multi-instancia.

## Arquitectura propuesta para aprobar

### Opcion recomendada - SPA estatica en Vercel y Socket.IO separado

Mantener el backend Express + Socket.IO como servicio Node persistente (por
ejemplo, una plataforma de contenedores) y publicar el frontend estatico en
Vercel. El mismo backend sirve ambos elementos durante desarrollo local.

1. Registrar en Auth0 una aplicacion de tipo SPA y una API con un identificador
   de audiencia propio del backend. Activar los proveedores sociales requeridos
   solo en Universal Login.
2. En el cliente, usar `@auth0/auth0-spa-js`, Authorization Code + PKCE y
   Universal Login. Solicitar access tokens para la audiencia de la API, nunca
   un token de Management API ni un client secret.
3. Crear el socket solo despues de autenticacion y pasar el access token por
   `auth.token` en el handshake. Renovar el token antes de reconectar.
4. En `io.use`, verificar firma por JWKS, `iss`, `aud`, expiracion y algoritmo;
   exponer unicamente una identidad derivada de claims confiables en
   `socket.data`. No aceptar el nombre enviado por el cliente como identidad
   autenticada.
5. Restringir CORS de HTTP y Socket.IO a los origenes exactos de local y
   produccion. Mantener las pruebas del Lab 5 y agregar casos de socket sin
   token, token invalido y token valido simulado.
6. Configurar en Auth0 los callbacks, logout y web origins exactos de
   `http://localhost:3000` y del dominio Vercel aprobado. Estos valores se
   configuran en el panel y variables de entorno, no en el repositorio.

Esta opcion cambia lo minimo del chat existente, evita sesiones cross-site
fragiles y permite que el backend verifique la misma credencial en cualquier
origen. Requiere decidir proveedor/dominio del servicio Socket.IO y definir
una politica de persistencia si el laboratorio exige historial o salas.

### Alternativa - Socket.IO dentro de Vercel Functions

Es tecnicamente posible con el soporte actual de WebSocket, pero no se
recomienda para la primera adaptacion de este chat sin una prueba de carga y
diseno adicional: el estado actual vive solo en memoria y `io.emit` no cruza
instancias. Requeriria mover la difusion a Redis (adaptador/pub-sub), implementar
reconexion/re-suscripcion y respetar duraciones maximas. Tambien exige adaptar
el punto de entrada que hoy llama `http.listen`, pues una Function exporta un
servidor/handler y Vercel administra el listener.

## Plan de rsc-harness propuesto, sin ejecutar

1. Corregir primero la ubicacion del workspace y recuperar `Lab8.docx`, el
   `AGENTS.md` y la memoria existente. Leerlos antes de producir el plan real.
2. En la raiz del repositorio correcto, ejecutar solo el preview no interactivo
   de `rsc onboard` para Codex, con las respuestas aprobadas por el equipo. No
   usar `--accept-plan`.
3. Revisar el plan: archivos a crear/modificar, skills seleccionados/diferidos,
   compatibilidad con `AGENTS.md`, worktrees, hooks, permisos Git y cualquier
   reemplazo de skills existentes.
4. Si se aprueba, aplicar exactamente el ID del plan. Versionar solo los
   archivos compartibles definidos por rsc y revisar el diff completo. No
   habilitar automaticamente acciones de Git, sincronizacion remota o hooks
   de memoria sin aprobacion separada.
5. Ejecutar `rsc doctor`, comprobar que el arranque del chat y las suites Lab 5
   no cambien, y documentar el resultado. La instalacion debe ser un commit
   aislado de cualquier cambio Auth0.

## Aprobaciones y datos pendientes

No avanzar a instalacion ni a cambios de Auth0 hasta resolver lo siguiente:

1. Proporcionar o seleccionar el workspace que contiene `Lab8.docx`,
   `AGENTS.md`, `brain/` inicial y `Repos/UNA-Chat`, o confirmar que `antes/`
   es el repositorio autorizado para Lab 8.
2. Aclarar la rama que debe contener el trabajo: `feat/lab8-auth0` no existe
   en el remoto actual. No se crea ni se cambia de rama por inferencia.
3. Aprobar el preview de rsc-harness y, despues de revisarlo, los componentes
   que se aceptaran: target Codex, skills, hooks, worktrees, sincronizacion de
   conocimiento y permisos Git.
4. Aprobar la topologia de despliegue: servicio Socket.IO persistente separado
   (recomendada) frente a Functions WebSocket de Vercel con Redis y reconexion.
5. Definir los proveedores sociales, el dominio Vercel final, la URL publica
   del backend Socket.IO y los requisitos de identidad/permisos. Las
   credenciales se crean/configuran fuera del repositorio y se cargan solo como
   variables de entorno seguras.

## Regla de continuidad

Hasta obtener estos insumos y aprobaciones, no instalar `rsc-harness`, no
agregar paquetes, no modificar autenticacion, no crear configuraciones de
Auth0, no introducir secretos y no alterar las funcionalidades verificadas del
Lab 5.

## Actualizacion de ejecucion 2026-10-29

- Se creo la rama local `feat/lab8-auth0` desde
  `feat/lab5-security-tests-harness` para aislar el trabajo. No existe aun en
  `origin` y no se publico.
- Se ejecuto solamente el preview oficial de rsc `3.6.0` desde `antes/`, sin
  `--accept-plan` y sin archivos nuevos del harness. El preview valido usa
  `technical`, proyecto `software`, alcance `growing`, target `codex` y
  workflow `branches`.
- El plan exacto pendiente de aprobacion tiene el identificador
  `9e4ed3291543203cdb9f16ba61343903eaf3828c47f47234cb7632778be1e679`.
  Selecciona 29 skills, cinco agentes de revision, hooks para Codex, memoria
  local, worktrees y documentos en `02-DOCS/`; tambien crearia `AGENTS.md`,
  `.rsc.json`, `.rsc/`, `.codex/` y `01-TOOLS/` dentro de `antes/`.
- La aceptacion se mantiene en espera: rsc exige releer y confirmar el plan
  exacto despues de conocer sus archivos gestionados. No se acepto por la
  aprobacion general previa, pues esta es mas amplia que el plan inicial
  propuesto y activa worktrees y hooks.

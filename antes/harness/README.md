# Harness OpenSpec + FoFo

Este coordinador convierte un requerimiento en una ejecución aislada. Crea una rama y un worktree bajo .harness/, inicializa una change de OpenSpec, conserva estado reanudable y ejecuta las fases:

1. OpenSpec: propuesta, diseño, tareas y criterios de aceptación.
2. Judge independiente: escribe pruebas antes de la implementación.
3. Test lock: calcula SHA-256 de cada prueba; el Author no puede cambiarlas.
4. Author independiente: implementa contra las pruebas bloqueadas.
5. Referee/FoFo: corre el gate-runner oficial configurado y las suites.
6. PR: ejecuta únicamente el comando explícitamente configurado por el operador.

## Uso

Instale primero la distribución oficial de FoFo (no es un paquete npm ni un servicio alojado):

~~~powershell
.\harness\install-fofo.ps1
$env:FOFO_ROOT = (Resolve-Path .\.harness\vendor\Agentic-SDLC\plugins\fofo\skills\sdlc)
~~~

Copie `harness/config.example.json` a `harness/config.json`. El Judge debe crear
`REQUIREMENTS.md`, `TEST-REQS.yaml`, `gates.config` y `policy.json`, escribir las
pruebas en rojo y luego el paso `testLock` las bloquea con el script oficial.
Complete además los comandos separados de Judge, Author y PR, y ejecute:

~~~powershell
npm run harness -- --requirement "Permitir reacciones a mensajes con controles de abuso" --config harness/config.json
~~~

Para revisar sin escribir archivos:

~~~powershell
npm run harness -- --requirement "Permitir reacciones a mensajes" --dry-run
~~~

Para reanudar una ejecución detenida:

~~~powershell
npm run harness -- --resume <id-de-ejecucion>
~~~

## Integración real

OpenSpec se ejecuta con la CLI local oficial instalada por el proyecto. FoFo se
integra mediante sus scripts oficiales: `test-lock` y `gate-runner`. En Windows,
`fofo_windows_runner.py` conserva esos scripts y sus códigos de salida, pero corrige
la resolución de shebangs Unix de la distribución original; selecciona Python o Node
según el gate invocado. No sustituye ni simula los gates.

Judge y Author son comandos distintos configurados por el operador. El harness les proporciona HARNESS_RUN_ID, HARNESS_REQUIREMENT, HARNESS_WORKTREE y HARNESS_ROLE; no proporciona al Author permiso de modificar el lock. Una configuración vacía se detiene con estado awaiting-configuration, no simula una revisión.

El `deps-gate` debe ejecutarse desde la raíz Git. Cuando, como en UNA Chat, el
proyecto Node vive en un subdirectorio, configure sus manifest paths relativos a la
raíz Git para que compare `antes/package.json` y no lo trate como un manifest nuevo.

El comando pullRequest también es opcional: crear un PR exige un remoto y credenciales. Puede configurarse con una herramienta autenticada; no se publica nada sin configuración.

## Concurrencia y recuperación

Cada ejecución obtiene un ID aleatorio, una rama harness/<id>, un worktree propio y archivos de estado/lock propios. Las ejecuciones simultáneas no comparten árbol de trabajo ni bloque de pruebas. --resume lee el estado persistido y continúa desde la fase correspondiente. Cada comando configurable se reintenta hasta --max-retries (por defecto 2); luego queda registrado como failed con las últimas salidas.

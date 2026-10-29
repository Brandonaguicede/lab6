# FoFo deps-gate en un proyecto anidado

## Hallazgo

UNA Chat vive en `antes/`, mientras que la raíz Git está un nivel arriba. FoFo
recibe `--context antes` en las demostraciones iniciales. `deps-gate` encuentra
`antes/package.json`, pero compara con `git show HEAD:package.json`; esa ruta no
existe desde la raíz Git y FoFo informa, correctamente para esa ruta equivocada,
que el manifiesto es nuevo. El resultado es una escalación de revisión, no una
vulnerabilidad ni una dependencia añadida por REQ-010, REQ-011 o REQ-012.

## Solución compatible con FoFo

No se debe desactivar `deps-gate`. El harness debe iniciar FoFo desde la raíz
Git y conservar el prefijo `antes/` en política, artefactos y patrones.

1. Obtenga la raíz con `git rev-parse --show-toplevel`.
2. Ejecute el `gate-runner` oficial con `--context <raiz-git>`.
3. Use una política por ejecución que indique `antes/REQUIREMENTS.md`,
   `antes/TEST-REQS.yaml`, `antes/TEST-LOCK.json` y `antes/PROVENANCE.yaml`.
4. Configure `redgreen-gate.test_command` como `cd antes && npm test` (y la
   E2E que corresponda al requisito).
5. Cree el lock desde ese mismo contexto, para que sus hashes tengan claves
   `antes/test/...` y `antes/tests/...`.
6. Incluya `--changed antes/package.json` junto a los archivos de código y
   pruebas. Así `deps-gate` compara `HEAD:antes/package.json` contra el
   manifiesto actual y detecta únicamente dependencias realmente nuevas.

Este flujo usa el `gate-runner` y `test-lock` oficiales; el adaptador Windows
del harness solo resuelve sus shebangs Unix y no omite ningún gate.

## Estado de las ejecuciones existentes

Los tres worktrees fueron bloqueados inicialmente desde `antes/`, por lo que
deben conservar su escalación como evidencia honesta. En la siguiente ejecución
del harness se aplicará la configuración anterior antes de que el Judge escriba
pruebas. No se reescriben los locks históricos para aparentar un resultado que
no ocurrió.

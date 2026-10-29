const assert = require('node:assert/strict');

const { validarMensaje } = require('../libs/unalib');

describe('REQ-012 - validarMensaje length boundaries', function () {
  for (const [length, expectedValid] of [
    [279, true],
    [280, true],
    [281, false]
  ]) {
    it(`REQ-012 returns valid=${expectedValid} for a ${length}-character message`, function () {
      const result = validarMensaje(JSON.stringify({
        nombre: 'Ana',
        mensaje: 'm'.repeat(length),
        color: '#123ABC'
      }));

      assert.equal(result.valid, expectedValid);
      if (!expectedValid) {
        assert.equal(result.code, 'MENSAJE_DEMASIADO_LARGO');
      }
    });
  }
});

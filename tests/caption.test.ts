import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caption, keepSeparators, SEPARATOR } from '../src/lib/caption.ts';

test('caption parts are joined with a separator that never starts a line', () => {
  assert.equal(SEPARATOR, '\u00a0· ');
  assert.equal(caption('Sismos', 'consultado 07:44'), 'Sismos\u00a0· consultado 07:44');
  assert.ok(!caption('a', 'b', 'c').includes(' · '));
});

test('empty parts are left out, so no caption ends or starts with a dot', () => {
  assert.equal(caption('', 'imhpa.gob.pa', false, null, undefined, '  '), 'imhpa.gob.pa');
  assert.equal(caption(), '');
});

test('separators already inside a part are kept on the line before too', () => {
  assert.equal(
    keepSeparators('Protección civil · niveles de alerta'),
    'Protección civil\u00a0· niveles de alerta',
  );
  assert.equal(
    caption('IGC · Universidad de Panamá', 'sismos'),
    'IGC\u00a0· Universidad de Panamá\u00a0· sismos',
  );
});

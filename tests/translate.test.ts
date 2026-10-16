import { test } from 'node:test';
import assert from 'node:assert/strict';
import { googlePageTranslation, googleTextTranslation } from '../src/lib/translate.ts';

test('Google Translate links carry only the given text, encoded, from Spanish to English', () => {
  const url = new URL(googleTextTranslation('No intente cruzar ríos & arroyos'));
  assert.equal(url.origin, 'https://translate.google.com');
  assert.equal(url.searchParams.get('sl'), 'es');
  assert.equal(url.searchParams.get('tl'), 'en');
  assert.equal(url.searchParams.get('text'), 'No intente cruzar ríos & arroyos');
  // Very long text is cut so the link still opens.
  const long = new URL(googleTextTranslation('a'.repeat(9000)));
  assert.ok(long.searchParams.get('text')!.length <= 4501);
});

test('only https official pages are passed to page translation', () => {
  const url = new URL(googlePageTranslation('https://www.sinaproc.gob.pa/comunicado-oficial-8/'));
  assert.equal(url.searchParams.get('u'), 'https://www.sinaproc.gob.pa/comunicado-oficial-8/');
  assert.equal(googlePageTranslation('javascript:alert(1)'), '');
  assert.equal(googlePageTranslation('not a url'), '');
});

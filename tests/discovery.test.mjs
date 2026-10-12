import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
test('public metadata and static facts identify the creator without claiming early warning', async () => {
  const $ = load(await readFile('index.html', 'utf8'));
  const schema = JSON.parse($('script[type="application/ld+json"]').text());
  assert.equal(schema.creator.url, 'https://oktsec.com');
  assert.equal(schema['@type'], 'WebApplication');
  assert.deepEqual(schema.inLanguage, ['es', 'en']);
  assert.match(schema.description, /Not an early-warning/);
  assert($('meta[property="og:title"]').attr('content'));
  const about = load(await readFile('public/about.html', 'utf8'));
  assert(about('a[href="https://oktsec.com"]').length);
  assert(about('section[lang="es"]').length);
  assert.match(about('main').text(), /does not predict earthquakes/);
  assert.match(about('main').text(), /No predice terremotos/);
});
test('only original, valid PNG instruction assets are published', async () => {
  for (const lang of ['es', 'en']) {
    const b = await readFile(`public/illustrations/drop-cover-hold-${lang}.png`);
    assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16), 1920);
    assert.equal(b.readUInt32BE(20), 631);
  }
});

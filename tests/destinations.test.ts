import test from 'node:test';
import assert from 'node:assert/strict';
import { destinations, destinationFor } from '../src/data/destinations/index.ts';
import { consularDirectories } from '../src/data/consularDirectories.ts';
import { countryCodes, regionFor, regionScope } from '../src/lib/regions.ts';
import { emergencyFor } from '../src/lib/emergency.ts';
import { telHref, whatsappHref } from '../src/lib/phone.ts';
import { embassyFor, consularFallback } from '../src/lib/embassies.ts';
import { cardLines } from '../src/lib/travelCardImage.ts';

const officialURL = (value: string) => {
  const u = new URL(value);
  assert.equal(u.protocol, 'https:');
  assert.equal(u.username + u.password, '');
};
const date = (value: string) => {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(value).toISOString().slice(0, 10), value);
};
test('destination records have unique ISO codes, attributed bilingual data and usable geographic presets', () => {
  assert.equal(new Set(destinations.map((d) => d.code)).size, destinations.length);
  for (const d of destinations) {
    assert(countryCodes.includes(d.code));
    for (const link of [d.civilProtection, d.seismicAgency, d.weatherAgency, d.evacuation])
      if (link) {
        officialURL(link.url);
        date(link.reviewedAt);
        assert(link.name.trim());
      }
    if (d.emergency) {
      officialURL(d.emergency.source);
      date(d.emergency.reviewedAt);
      assert(d.emergency.agency);
      assert(d.emergency.numbers.length > 0);
      assert.equal(
        new Set(d.emergency.numbers.map((n) => n.number)).size,
        d.emergency.numbers.length,
      );
      for (const n of d.emergency.numbers) {
        // Short codes, or a full line with its country code so it connects from a foreign SIM.
        assert.match(n.number, /^(\d{2,6}|\+\d{1,3} \d{3,4}-\d{4})$/);
        assert.match(telHref(n.number), /^tel:\+?\d+$/);
        if (n.source) officialURL(n.source);
        assert(n.label.length === 3 && n.label.every((x) => x.trim()));
      }
      if (d.emergency.note) assert(d.emergency.note.every((x) => x.trim()));
      // A WhatsApp line is an international number with its own official source.
      if (d.emergency.whatsapp) {
        assert.match(d.emergency.whatsapp.number, /^\+\d{1,3} [\d-]{7,12}$/);
        assert.match(whatsappHref(d.emergency.whatsapp.number), /^https:\/\/wa\.me\/\d{8,15}$/);
        officialURL(d.emergency.whatsapp.source);
        assert(d.emergency.whatsapp.label.every((x) => x.trim()));
      }
    }
    for (const r of d.resources) {
      officialURL(r.url);
      date(r.reviewedAt);
      assert(r.category.length === 3 && r.description.length === 3);
    }
    const { bounds: b, view: v, scope } = d.region;
    assert(b.south < b.north && b.west < b.east);
    assert(b.south >= -90 && b.north <= 90 && b.west >= -180 && b.east <= 180);
    assert(v.lat >= b.south && v.lat <= b.north && v.lng >= b.west && v.lng <= b.east);
    assert(scope.length === 3 && scope.every((x) => x.trim()));
  }
});
test('new emergency coverage preserves Peru regional restriction in downloadable cards', () => {
  for (const code of ['MX', 'EC', 'CR']) assert.equal(emergencyFor(code)?.numbers[0].number, '911');
  assert.deepEqual(
    emergencyFor('PE')?.numbers.map((n) => n.number),
    ['105', '116', '106'],
  );
  assert.match(JSON.stringify(cardLines('PE', 'en', [], null, null)), /regional coverage/);
  assert.equal(destinationFor('WORLD'), undefined);
  assert.equal(emergencyFor('FR'), undefined);
});
test('long countries are not clipped to fourteen degrees of latitude and unknown codes fail gracefully', () => {
  const chile = regionFor('CL').bounds;
  assert(chile.north >= -18.5 && chile.south <= -53.2); // Arica and Punta Arenas
  const argentina = regionFor('AR').bounds;
  assert(argentina.north >= -22 && argentina.south <= -55);
  assert.deepEqual(regionFor('invalid'), regionFor('WORLD'));
  assert.match(regionScope('US', 'en'), /Alaska, Hawaii/);
  assert.match(regionScope('FR', 'en'), /Approximate/);
});
test('consular directories work across destinations without inventing a local mission', () => {
  assert.equal(embassyFor('PE', 'CO'), undefined);
  assert.match(consularFallback('PE', 'CO')?.url ?? '', /cancilleria.gov.co/);
  assert.match(consularFallback('MX', 'ES')?.url ?? '', /exteriores.gob.es/);
  assert.equal(consularFallback('PE', 'invalid'), null);
  for (const link of Object.values(consularDirectories)) {
    officialURL(link.url);
    date(link.reviewedAt);
    assert(link.label.length === 3);
  }
});

test('everyday country names find the right nationality and rank it first', async () => {
  const { countryAliases, isExactAlias } = await import('../src/lib/countryAliases.ts');
  assert.ok(isExactAlias('US', 'usa'));
  assert.ok(isExactAlias('US', 'eeuu'));
  assert.ok(isExactAlias('GB', 'uk'));
  assert.ok(!isExactAlias('UA', 'uk'), 'UK must not rank Ukraine first');
  assert.ok(isExactAlias('NL', 'holanda'));
  for (const words of Object.values(countryAliases))
    assert.equal(
      words,
      words
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, ''),
    );
});

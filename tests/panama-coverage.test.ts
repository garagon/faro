import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consularMissions,
  mappedMissions,
  missionDirections,
  missionsFor,
} from '../src/data/consularMissions.ts';
import { consularDirectories } from '../src/data/consularDirectories.ts';
import { destinationFor } from '../src/data/destinations/index.ts';
import { consularFallback, embassies } from '../src/lib/embassies.ts';

const nationalities = { US: 'U\\.S\\.', AR: 'Argentin', BR: 'Brazil' } as const;

test('U.S., Argentine and Brazilian travelers in Panama get a current, callable, mapped mission', () => {
  for (const nation of Object.keys(nationalities)) {
    const [mission, ...others] = missionsFor('PA', nation).filter((m) => !m.historical);
    assert.ok(mission, nation);
    assert.equal(others.length, 0, `${nation} should have one current Panama listing`);
    assert.equal(mission.kind, 'embassy');
    assert.equal(mission.reviewedAt, '2026-10-13');
    assert.match(mission.phone!, /^\+507\d{7,8}$/);
    assert.match(mission.emergency!, /^\+507\d{7,8}$/);
    assert.ok(mission.address?.trim());
    assert.ok(missionDirections(mission, 'walking'));
    const [pin] = mappedMissions('PA', nation);
    assert.equal(pin?.nation, nation);
    assert.match(pin.mapSource, /^https:\/\/www\.openstreetmap\.org\//);
    assert.ok(pin.lat > 8.9 && pin.lat < 9.1 && pin.lng > -79.6 && pin.lng < -79.4);
  }
});

test('emergency notes name only the mission’s own nationality', () => {
  for (const mission of consularMissions.filter((m) => m.emergencyNote)) {
    const [es, en] = mission.emergencyNote!;
    assert.ok(es.trim() && en.trim(), mission.id);
    for (const [nation, word] of Object.entries(nationalities))
      if (nation !== mission.nation) assert.doesNotMatch(en, new RegExp(word), mission.id);
  }
  const br = missionsFor('PA', 'BR')[0];
  assert.match(br.emergencyNote![1], /Brazilian citizens/);
  assert.match(missionsFor('PA', 'AR')[0].emergencyNote![1], /Argentine citizens/);
});

test('Brazil uses the official gov.br embassy page and the OSM embassy node', () => {
  const br = missionsFor('PA', 'BR')[0];
  assert.equal(br.id, 'br-pa');
  assert.equal(new URL(br.source).hostname, 'www.gov.br');
  assert.equal(br.phone, '+5072635322');
  assert.equal(br.emergency, '+50763795616');
  assert.match(br.address!, /Torre Optima, pisos 22 y 23/);
  assert.match(br.note![1], /09:00–13:00/);
  const [pin] = mappedMissions('PA', 'BR');
  assert.equal(pin.mapSource, 'https://www.openstreetmap.org/node/8508442823');
  assert.equal(pin.address, br.address);
  // Brazil is a mission-registry record, not one of the legacy building records.
  assert.ok(!embassies.some((e) => e.nation === 'BR'));
});

test('Argentina and U.S. building records keep verified contacts and visible hours', () => {
  const ar = missionsFor('PA', 'AR')[0];
  assert.equal(ar.phone, '+5073020003');
  assert.equal(ar.emergency, '+50766161112');
  assert.match(ar.note![0], /08:00–13:00, con cita previa/);
  const us = missionsFor('PA', 'US')[0];
  assert.match(us.note![1], /appointment/);
  for (const e of embassies) assert.match(e.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test('Brazil has an outbound Itamaraty directory usable outside Panama', () => {
  assert.match(consularDirectories.BR.url, /^https:\/\/www\.gov\.br\/mre\//);
  assert.equal(consularFallback('PE', 'BR')?.url, consularDirectories.BR.url);
  assert.equal(consularFallback('PA', 'BR')?.url, consularDirectories.BR.url);
});

test('Panama resources stay within limits and never claim shelters or open services', () => {
  const pa = destinationFor('PA')!;
  assert.ok(pa.resources.length <= 6);
  assert.equal(pa.evacuation, undefined);
  assert.equal(new Set(pa.resources.map((r) => r.url)).size, pa.resources.length);
  for (const r of pa.resources) {
    assert.match(new URL(r.url).hostname, /(\.gob\.pa|\.ac\.pa)$/);
    assert.doesNotMatch(r.description[1], /\b(open shelter|shelters are open|available now)\b/i);
  }
  const atp = pa.resources.find((r) => r.url.includes('atp.gob.pa'))!;
  assert.match(atp.description[1], /not an emergency line/);
  const alerts = pa.resources.find((r) => r.url.includes('medidas-de-prevencion'))!;
  assert.match(alerts.description[1], /does not show which alert is in effect/);
});

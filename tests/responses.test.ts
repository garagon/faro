import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeResponses, responsesFor } from '../src/data/responses.ts';

const officialHosts = [
  'www.sinaproc.gob.pa',
  'www.state.gov',
  'mytravel.state.gov',
  'earthquake.usgs.gov',
  'mapping.emergency.copernicus.eu',
  'consumer.ftc.gov',
];

test('a response shows only for its country and stops after its review window', () => {
  const during = Date.parse('2026-10-13T12:00:00Z');
  assert.equal(responsesFor('PA', during).length, 1);
  assert.equal(responsesFor('CR', during).length, 0);
  assert.equal(responsesFor('PA', Date.parse('2026-11-09T12:00:00Z')).length, 0);
});

test('responses are dated, sourced, bilingual and link only to official hosts', () => {
  for (const r of activeResponses) {
    assert.match(r.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Date.parse(r.showUntil) > Date.parse(r.reviewedAt));
    for (const f of r.facts) {
      assert.ok(f.source && f.text[0] && f.text[1] && f.label[0] && f.label[1]);
    }
    for (const h of r.help) assert.ok(h[0] && h[1]);
    for (const url of [...r.links.map((l) => l.url), r.consular?.url].filter(Boolean)) {
      const u = new URL(url!);
      assert.equal(u.protocol, 'https:');
      assert.ok(officialHosts.includes(u.hostname), u.hostname);
    }
    for (const line of r.consular?.lines ?? []) assert.match(line.number, /^\+\d{8,15}$/);
  }
});

test('the response does not infer aftershocks or shelter safety', () => {
  for (const r of activeResponses) {
    const text = JSON.stringify(r).toLowerCase();
    for (const word of ['réplica', 'aftershock', 'refugio seguro', 'safe shelter']) {
      assert.ok(!text.includes(word), word);
    }
  }
});

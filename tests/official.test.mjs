import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIGC, parseProduct, summarizeBulletin } from '../server/official.mjs';
const row = (hour = '8:49:43AM', lat = '7.58695') =>
  `<tr><td>PRELIMINAR</td><td>2026-10-11</td><td>${hour}</td><td>${lat}</td><td>-80.72725</td><td>5km</td><td>4.2</td><td>Tonosí</td><td><a href="/ultimosismo.html">Mapa</a></td></tr>`;
test('IGC interprets Panama local dates, preserves unknown revision and deduplicates responsive tables', () => {
  const d = parseIGC(`<table>${row()}${row()}</table><table>${row('9:00:00AM')}</table>`);
  assert.equal(d.events.length, 1);
  assert.equal(new Date(d.events[0].time).toISOString(), '2026-10-11T13:49:43.000Z');
  assert.equal(d.events[0].updated, 0);
  assert.equal(d.events[0].source, 'IGC');
  assert.equal(d.events[0].url, 'https://sismosgeociencias.up.ac.pa/ultimosismo.html');
});
test('IGC converts noon and midnight and fails closed on broken markup', () => {
  assert.equal(
    new Date(parseIGC(`<table>${row('12:00:00AM')}</table>`).latestEvent).getUTCHours(),
    5,
  );
  assert.equal(
    new Date(parseIGC(`<table>${row('12:00:00PM')}</table>`).latestEvent).getUTCHours(),
    17,
  );
  assert.throws(() => parseIGC('<p>Source unavailable</p>'));
  assert.throws(() => parseIGC(`<table>${row('8:49:43AM', '200')}</table>`));
});
const meta = {
  WMOID: 'WEPA40',
  bulletinIssueTime: '2026-10-09T19:40:06Z',
  twcEventID: '26282000',
  quakeLocation: 'PANAMA',
  eventDir: '/events/PHEB/2026/10/09/26282000/4/WEPA40/',
};
test('NOAA parses data without executing JavaScript and restricts official paths', () => {
  const p = parseProduct(`var PHEBWEPA40 = ${JSON.stringify(meta)};`, 'WEPA40');
  assert.equal(
    p.url,
    'https://www.tsunami.gov/events/PHEB/2026/10/09/26282000/4/WEPA40/WEPA40.txt',
  );
  assert.throws(() => parseProduct('var PHEBWEPA40 = fetch("https://bad.example");', 'WEPA40'));
  assert.throws(() =>
    parseProduct(
      `var PHEBWEPA40 = ${JSON.stringify({ ...meta, eventDir: 'https://bad.example/' })};`,
      'WEPA40',
    ),
  );
});
test('NOAA final bulletin ends only that event; issue time is preserved', () => {
  const p = parseProduct(`var PHEBWEPA40 = ${JSON.stringify(meta)};`, 'WEPA40');
  const d = summarizeBulletin(
    p,
    '\nEVALUATION\n----------\nTHE TSUNAMI THREAT FROM THIS EARTHQUAKE HAS NOW PASSED.\n',
  );
  assert.equal(d.kind, 'ended');
  assert.equal(d.issued, Date.parse(meta.bulletinIssueTime));
  assert.ok(d.evaluation.includes('THIS EARTHQUAKE'));
  assert.equal(summarizeBulletin({ ...p, product: 'WEPA42' }, 'INFORMATION').kind, 'information');
  assert.equal(summarizeBulletin(p, 'THREAT EXISTS').kind, 'threat');
});

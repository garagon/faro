import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STALE_LIMIT,
  BACKOFF,
  emscQuery,
  gdacsQueries,
  mergeGDACS,
  parseGDACS,
  parseNHC,
  parseCapFeed,
  parseCapMessage,
  NATIONAL_FEEDS,
  officialData,
  officialMiddleware,
  encodeBody,
  parseEMSC,
  parseSinaprocPosts,
} from '../server/official.mjs';
import { readLimitedText } from '../server/read-limited-text.mjs';

const row = (hour) =>
  `<tr><td>PRELIMINAR</td><td>2026-10-13</td><td>${hour}</td><td>7.6</td><td>-80.7</td><td>5km</td><td>4.2</td><td>Tonosí</td><td><a href="/ultimosismo.html">Ver</a></td></tr>`;

test('reading stops after the marker and cancels the rest of the page', async () => {
  let cancelled = false;
  const encoder = new TextEncoder();
  const parts = ['<table>', row('8:00:00AM'), '</ta', 'ble><table>more'];
  const body = new ReadableStream({
    pull(c) {
      // After the first table the page never ends; the reader must stop on its own.
      c.enqueue(encoder.encode(parts.shift() ?? 'x'.repeat(1000)));
    },
    cancel() {
      cancelled = true;
    },
  });
  const text = await readLimitedText(new Response(body), 1_000_000, '</table>');
  assert.ok(text.endsWith('</table>'));
  assert.ok(!text.includes('more'));
  assert.equal(cancelled, true);
});

test('a page larger than the limit is accepted when the needed part comes first', async () => {
  const response = new Response('<table></table>' + 'x'.repeat(50), {
    headers: { 'content-length': '5000000' },
  });
  assert.equal(await readLimitedText(response, 100, '</table>'), '<table></table>');
});

test('IGC keeps the last good copy for a while, marked stale with its original time', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-13T12:00:00Z') });
  let fail = false;
  t.mock.method(globalThis, 'fetch', async () => {
    if (fail) throw new Error('upstream down');
    return new Response(`<table>${row('7:00:00AM')}</table>`);
  });
  const first = await officialData('/api/igc');
  assert.equal(first.events.length, 1);
  assert.equal(first.stale, undefined);
  fail = true;
  t.mock.timers.tick(60_000);
  // Past its lifetime, the copy is served at once while the refresh runs.
  const served = await officialData('/api/igc');
  assert.equal(served.stale, undefined);
  await new Promise((resolve) => setImmediate(resolve));
  // The refresh failed: from now on the copy says it is stale.
  const kept = await officialData('/api/igc');
  assert.equal(kept.stale, true);
  assert.equal(kept.fetched, first.fetched);
  t.mock.timers.tick(STALE_LIMIT);
  await assert.rejects(officialData('/api/igc'));
});

const feature = (props) => ({
  type: 'Feature',
  properties: {
    unid: '20261013_0000252',
    source_id: '2074138',
    time: '2026-10-13T12:51:44.0Z',
    lastupdate: '2026-10-13T13:01:06.190576Z',
    flynn_region: 'PANAMA-COSTA RICA BORDER REGION',
    lat: 8.2151,
    lon: -82.2931,
    depth: 10.0,
    evtype: 'ke',
    auth: 'UNA',
    mag: 4.7,
    magtype: 'm',
    ...props,
  },
});
test('EMSC keeps earthquakes with their credited agency and an official event link', () => {
  const d = parseEMSC(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        feature({}),
        feature({ unid: 'b', evtype: 'se', source_id: 'x', mag: null, auth: '<script>' }),
        feature({ unid: 'c', evtype: 'qb' }),
        feature({ unid: 'bad id' }),
        feature({ unid: 'd', lat: 95 }),
      ],
    }),
  );
  assert.deepEqual(
    d.events.map((e) => e.id),
    ['emsc-20261013_0000252', 'emsc-b'],
  );
  const [first, second] = d.events;
  assert.equal(first.source, 'EMSC');
  assert.equal(first.authority, 'UNA');
  assert.equal(first.place, 'Panama-Costa Rica Border Region');
  assert.equal(first.time, Date.parse('2026-10-13T12:51:44Z'));
  assert.equal(
    first.url,
    'https://www.emsc-csem.org/Earthquake_information/earthquake.php?id=2074138',
  );
  assert.equal(second.url, 'https://www.seismicportal.eu/eventdetails.html?unid=b');
  assert.equal(second.mag, null);
  assert.equal(second.authority, '');
  assert.throws(() => parseEMSC('{"type":"Feature"}'));
});

test('EMSC query uses a fixed host and an hour-aligned seven-day window', () => {
  const url = new URL(emscQuery(Date.parse('2026-10-13T13:47:10Z')));
  assert.equal(url.origin + url.pathname, 'https://www.seismicportal.eu/fdsnws/event/1/query');
  assert.equal(url.searchParams.get('start'), '2026-10-06T13:00:00');
  assert.equal(url.searchParams.get('minmag'), '2.5');
});

test('adapters answer GET with the copy age, reject other methods and pass other paths', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(`<table>${row('9:00:00AM')}</table>`),
  );
  const response = () => {
    const r = { statusCode: 200, headers: {}, body: '' };
    r.setHeader = (k, v) => (r.headers[k] = v);
    r.end = (b) => (r.body = b);
    return r;
  };
  const ok = response();
  await officialMiddleware({ url: '/api/igc', method: 'GET' }, ok, () => assert.fail());
  const data = JSON.parse(ok.body);
  assert.equal(typeof data.age, 'number');
  assert.ok(data.age >= 0);
  // Unknown parameters would only bypass the shared cache.
  const extra = response();
  await officialMiddleware({ url: '/api/igc?x=1', method: 'GET' }, extra, () => assert.fail());
  assert.equal(extra.statusCode, 400);
  const head = response();
  await officialMiddleware({ url: '/api/igc', method: 'HEAD' }, head, () => assert.fail());
  assert.equal(head.statusCode, 200);
  assert.equal(head.body, undefined);
  const post = response();
  await officialMiddleware({ url: '/api/emsc', method: 'POST' }, post, () => assert.fail());
  assert.equal(post.statusCode, 405);
  let passed = false;
  await officialMiddleware({ url: '/api/profile', method: 'GET' }, response(), () => {
    passed = true;
  });
  assert.equal(passed, true);
});

test('large answers are gzipped only for clients that accept it', async () => {
  const { gunzipSync } = await import('node:zlib');
  const big = JSON.stringify({ events: 'x'.repeat(5000) });
  const packed = await encodeBody(big, 'br, gzip');
  assert.equal(packed.encoding, 'gzip');
  assert.equal(gunzipSync(packed.body).toString(), big);
  assert.deepEqual(await encodeBody(big, ''), { body: big });
  assert.deepEqual(await encodeBody(big, 'gzip;q=0, identity'), { body: big });
  assert.equal((await encodeBody(big, 'deflate, gzip; q=0.5')).encoding, 'gzip');
  assert.deepEqual(await encodeBody('{"a":1}', 'gzip'), { body: '{"a":1}' });
});

const gdacsFeature = (props) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-80.29, 7.59] },
  properties: {
    eventtype: 'EQ',
    eventid: 1570346,
    episodeid: 1738688,
    name: 'Earthquake in Panama',
    country: 'Panama',
    alertlevel: 'Orange',
    fromdate: '2026-10-09T17:56:06',
    todate: '2026-10-09T17:56:06',
    datemodified: '2026-10-09T18:30:00',
    iscurrent: 'true',
    affectedcountries: [{ iso2: 'PA', iso3: 'PAN', countryname: 'Panama' }],
    severitydata: { severitytext: 'Magnitude 6.1M, Depth:10km' },
    url: { report: 'https://evil.example/' },
    ...props,
  },
});
test('GDACS dates are UTC, report links are rebuilt and events keep their latest episode', () => {
  const [event] = parseGDACS(
    JSON.stringify({ type: 'FeatureCollection', features: [gdacsFeature({})] }),
  );
  assert.equal(event.id, 'EQ-1570346');
  assert.equal(event.level, 'orange');
  assert.equal(event.from, Date.parse('2026-10-09T17:56:06Z'));
  assert.deepEqual(event.countries, ['PA']);
  assert.equal(
    event.url,
    'https://www.gdacs.org/report.aspx?eventid=1570346&episodeid=1738688&eventtype=EQ',
  );
  const skipped = parseGDACS(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        gdacsFeature({ eventtype: 'XX' }),
        gdacsFeature({ alertlevel: 'Purple' }),
        gdacsFeature({ fromdate: 'soon' }),
        gdacsFeature({ eventid: 'abc' }),
      ],
    }),
  );
  assert.equal(skipped.length, 0);
  assert.deepEqual(parseGDACS(''), []);
  assert.throws(() => parseGDACS('{"type":"Feature"}'));
  const merged = mergeGDACS([
    [{ ...event, modified: 1 }],
    [{ ...event, modified: 2, level: 'red' }],
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].level, 'red');
});
test('GDACS queries ask for current events and every Orange or Red event of 14 days', () => {
  const [current, search] = gdacsQueries(Date.parse('2026-10-13T12:00:00Z')).map((u) => new URL(u));
  assert.equal(current.pathname, '/gdacsapi/api/events/geteventlist/EVENTS4APP');
  assert.equal(search.searchParams.get('alertlevel'), 'Orange;Red');
  assert.equal(search.searchParams.get('fromDate'), '2026-09-29');
  assert.ok(search.searchParams.get('eventlist').split(';').includes('VO'));
});

test('NHC storms accept the live and documented coordinate fields and drop malformed ones', () => {
  const storm = (over) => ({
    id: 'ep202026',
    binNumber: 'EP5',
    name: 'Simon',
    classification: 'HU',
    intensity: '80',
    pressure: '977',
    latitudeNumeric: 20.4,
    longitudeNumeric: -107.2,
    lastUpdate: '2026-10-13T12:00:00.000Z',
    publicAdvisory: { advNum: '024a', issuance: '2026-10-13T12:00:00.000Z' },
    ...over,
  });
  const storms = parseNHC(
    JSON.stringify({
      activeStorms: [
        storm({}),
        storm({
          id: 'al052026',
          binNumber: 'AT1',
          latitudeNumeric: undefined,
          latitude_numeric: 15,
        }),
        storm({ id: 'xx', binNumber: 'AT2' }),
        storm({ id: 'al062026', classification: 'ZZ' }),
        storm({ id: 'al072026', latitudeNumeric: 120 }),
      ],
    }),
  );
  assert.deepEqual(
    storms.map((s) => s.id),
    ['ep202026', 'al052026'],
  );
  assert.equal(storms[0].intensityKt, 80);
  assert.equal(storms[0].advisory, '024a');
  assert.equal(storms[0].spanish, false);
  assert.equal(storms[1].lat, 15);
  assert.deepEqual(parseNHC('{"activeStorms":[]}'), []);
  assert.throws(() => parseNHC('{"storms":[]}'));
});

const cap = ({
  prefix = 'cap:',
  status = 'Actual',
  msgType = 'Alert',
  expires,
  web,
  extra = '',
  area = '',
} = {}) => {
  const p = prefix;
  return `<?xml version="1.0" encoding="UTF-8"?>
<${p}alert xmlns${p ? ':cap' : ''}="urn:oasis:names:tc:emergency:cap:1.2">
  <${p}identifier>urn:oid:test.1</${p}identifier>
  <${p}sender>person@agency.example</${p}sender>
  <${p}sent>2026-10-12T15:03:17-05:00</${p}sent>
  <${p}status>${status}</${p}status>
  <${p}msgType>${msgType}</${p}msgType>
  <${p}info>
    <${p}language>es</${p}language>
    <${p}event>LLUVIAS, TORMENTAS ELÉCTRICAS Y VIENTOS</${p}event>
    <${p}severity>Moderate</${p}severity>
    <${p}onset>2026-10-12T14:30:00-05:00</${p}onset>
    <${p}expires>${expires ?? '2026-10-15T23:59:00-05:00'}</${p}expires>
    <${p}headline>Aviso de vigilancia</${p}headline>
    <${p}web>${web ?? 'https://www.imhpa.gob.pa/es/aviso-vigilancia/1'}</${p}web>
    ${extra}
    <${p}area><${p}areaDesc>Territorio nacional</${p}areaDesc>${area}</${p}area>
  </${p}info>
</${p}alert>`;
};
test('national CAP warnings read prefixed and plain messages and keep only what is in force', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const feed = NATIONAL_FEEDS.PA;
  const w = parseCapMessage(cap(), feed, now);
  assert.equal(w.event, 'LLUVIAS, TORMENTAS ELÉCTRICAS Y VIENTOS');
  assert.equal(w.severity, 'Moderate');
  assert.equal(w.areas, 'Territorio nacional');
  assert.equal(w.expires, Date.parse('2026-10-16T04:59:00Z'));
  assert.equal(w.url, 'https://www.imhpa.gob.pa/es/aviso-vigilancia/1');
  assert.ok(!JSON.stringify(w).includes('@'), 'sender address must not be kept');
  assert.equal(parseCapMessage(cap({ prefix: '' }), feed, now).event, w.event);
  assert.equal(parseCapMessage(cap({ status: 'Exercise' }), feed, now), null);
  assert.equal(parseCapMessage(cap({ msgType: 'Cancel' }), feed, now), null);
  assert.equal(parseCapMessage(cap({ expires: '2026-10-12T00:00:00-05:00' }), feed, now), null);
  assert.equal(parseCapMessage(cap({ web: 'https://evil.example/x' }), feed, now).url, '');
  assert.throws(() => parseCapMessage('<rss></rss>', feed, now));
});
test('national CAP warnings keep the agency instructions, description and warning area', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const feed = NATIONAL_FEEDS.PA;
  const w = parseCapMessage(
    cap({
      extra: `<cap:description>*Acumulados de lluvia previstos.
*Precaución ante inundaciones en áreas urbanas y rurales.</cap:description>
      <cap:instruction>* No intente cruzar ríos, arroyos o canales.
* Siga las recomendaciones de las autoridades.</cap:instruction>`,
      area: '<cap:polygon>7.34,-80.33 9.01,-79.43 9.64,-79.65 8.83,-81.47 7.34,-80.33</cap:polygon><cap:polygon>bad,data 1,2</cap:polygon>',
    }),
    feed,
    now,
  );
  assert.equal(
    w.instruction,
    '* No intente cruzar ríos, arroyos o canales.\n* Siga las recomendaciones de las autoridades.',
  );
  assert.match(w.description, /inundaciones en áreas urbanas/);
  assert.deepEqual(w.polygons, [
    [
      [7.34, -80.33],
      [9.01, -79.43],
      [9.64, -79.65],
      [8.83, -81.47],
      [7.34, -80.33],
    ],
  ]);
  const plain = parseCapMessage(cap(), feed, now);
  assert.equal(plain.instruction, '');
  assert.deepEqual(plain.polygons, []);
});
test('national feeds link only to their own host and unknown countries are refused', async () => {
  const rss = `<rss><channel><link>https://cap-sources.s3.amazonaws.com/pa-imhpa-es/rss.xml</link>
    <item><link>https://cap-sources.s3.amazonaws.com/pa-imhpa-es/2026-10-12.xml</link></item>
    <item><link>https://evil.example/a.xml</link></item>
    <item><link>http://cap-sources.s3.amazonaws.com/pa-imhpa-es/b.xml</link></item>
  </channel></rss>`;
  assert.deepEqual(parseCapFeed(rss, NATIONAL_FEEDS.PA.rss), [
    'https://cap-sources.s3.amazonaws.com/pa-imhpa-es/2026-10-12.xml',
  ]);
  await assert.rejects(
    officialData('/api/national', new URLSearchParams({ country: 'XX' })),
    RangeError,
  );
  await assert.rejects(officialData('/api/national', new URLSearchParams()), RangeError);
});

// Synthetic WordPress posts shaped like the SINAPROC REST API.
const post = (over = {}) => ({
  id: 101,
  date_gmt: '2026-10-12T21:18:04',
  link: 'https://www.sinaproc.gob.pa/comunicado-oficial-ejemplo/',
  title: { rendered: 'COMUNICADO OFICIAL #9' },
  excerpt: {
    rendered:
      '<p>Panamá, 12 de octubre de 2026.- El SINAPROC informa sobre crecidas de r&iacute;os en Ejemplo &hellip; [&hellip;]</p>\n',
  },
  categories: [26],
  ...over,
});
test('SINAPROC posts keep the published time, plain text and the agency link only', () => {
  const [p] = parseSinaprocPosts([post()]);
  assert.equal(p.published, Date.parse('2026-10-12T21:18:04Z'));
  assert.equal(p.title, 'COMUNICADO OFICIAL #9');
  assert.equal(p.kind, 'communique');
  // The dateline is dropped; entities are decoded; no markup survives.
  assert.match(p.summary, /^El SINAPROC informa sobre crecidas de ríos en Ejemplo/);
  assert.doesNotMatch(p.summary, /<|&|\[/);
  assert.equal(p.url, 'https://www.sinaproc.gob.pa/comunicado-oficial-ejemplo/');
  const [outside] = parseSinaprocPosts([post({ link: 'https://evil.example/x' })]);
  assert.equal(outside.url, '');
  const [notice] = parseSinaprocPosts([
    post({ title: { rendered: 'Aviso de prevención Lluvias y tormentas' } }),
  ]);
  assert.equal(notice.kind, 'prevention');
  // A later save is kept apart from the publication time; an earlier or malformed one is not.
  const [edited] = parseSinaprocPosts([post({ modified_gmt: '2026-10-13T13:53:00' })]);
  assert.equal(edited.published, Date.parse('2026-10-12T21:18:04Z'));
  assert.equal(edited.modified, Date.parse('2026-10-13T13:53:00Z'));
  for (const modified_gmt of ['2026-10-12T21:18:04', '2026-10-01T00:00:00', 'soon', 7]) {
    assert.equal('modified' in parseSinaprocPosts([post({ modified_gmt })])[0], false);
  }
});
test('SINAPROC drills are never shown and a changed format fails instead of reading as empty', () => {
  const posts = parseSinaprocPosts([
    post({ id: 1, categories: [13] }),
    post({ id: 2, date_gmt: '2026-10-13T08:00:00' }),
    post({ id: 3, date_gmt: 'yesterday' }),
  ]);
  assert.deepEqual(
    posts.map((p) => p.id),
    [2],
  );
  assert.deepEqual(parseSinaprocPosts([]), []);
  assert.throws(() => parseSinaprocPosts({ posts: [] }));
  assert.throws(() => parseSinaprocPosts([{ id: 'x' }, { title: 'no date' }]));
});

test('a slow source does not hold visitors: one refresh runs while the copy is served', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-14T01:00:00Z') });
  let calls = 0;
  let release = () => {};
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (calls > 1) await new Promise((resolve) => (release = resolve));
    return new Response(JSON.stringify([]));
  });
  const first = await officialData('/api/sinaproc');
  t.mock.timers.tick(11 * 60_000);
  calls = 1;
  for (let i = 0; i < 20; i++) {
    const copy = await officialData('/api/sinaproc');
    assert.equal(copy.fetched, first.fetched);
    assert.equal(copy.stale, undefined);
  }
  assert.equal(calls, 2);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.notEqual((await officialData('/api/sinaproc')).fetched, first.fetched);
});

test('an upstream outage is not multiplied by visitors: one retry per backoff window', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-14T03:00:00Z') });
  let calls = 0;
  let fail = false;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (fail) throw new Error('upstream down');
    return new Response(JSON.stringify([]));
  });
  await officialData('/api/sinaproc');
  fail = true;
  // Beyond the lifetime plus the window in which a copy is served while refreshing.
  t.mock.timers.tick(13 * 60_000);
  calls = 0;
  for (let i = 0; i < 200; i++) {
    const copy = await officialData('/api/sinaproc');
    assert.equal(copy.stale, true);
  }
  assert.equal(calls, 1);
  // After the backoff the source is asked again.
  t.mock.timers.tick(2 * BACKOFF + 1);
  await officialData('/api/sinaproc');
  assert.equal(calls, 2);
});

test('a CAP feed answered with an HTML page fails instead of reading as no warnings', () => {
  assert.throws(
    () =>
      parseCapFeed(
        '<html><body><h1>Sitio en mantenimiento</h1></body></html>',
        NATIONAL_FEEDS.PA.rss,
      ),
    /format changed/,
  );
  assert.deepEqual(parseCapFeed('<rss><channel></channel></rss>', NATIONAL_FEEDS.PA.rss), []);
});

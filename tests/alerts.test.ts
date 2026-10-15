import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertsFor, alertSubject, parseAlerts, type HazardAlert } from '../src/lib/alerts.ts';
import { NWS_COUNTRIES, nwsUrl, parseNws } from '../src/lib/nws.ts';
import { displayPhone } from '../src/lib/phone.ts';
import { familyLinks, familyLinksFor } from '../src/data/familyLinks.ts';

const now = Date.parse('2026-10-13T12:00:00Z');
const alert = (over: Partial<HazardAlert> = {}): HazardAlert => ({
  id: 'EQ-1',
  type: 'EQ',
  level: 'green',
  name: 'Earthquake in Panama',
  region: 'Panama',
  countries: ['PA'],
  from: now - 3600000,
  to: now - 3600000,
  modified: now,
  current: true,
  severity: 'Magnitude 4.7M, Depth:10km',
  lat: 7.7,
  lng: -81.4,
  url: 'https://www.gdacs.org/report.aspx?eventid=1&episodeid=1&eventtype=EQ',
  ...over,
});
const panama = { south: 4, north: 12, west: -85, east: -75 };

test('GDACS records are validated and keep only official report links', () => {
  const data = parseAlerts(
    {
      events: [
        alert(),
        alert({ id: 'x', url: 'https://evil.example/report' }),
        alert({ id: 'y', level: 'purple' as HazardAlert['level'] }),
        alert({ id: 'z', countries: ['PA', 'Panama'] as string[] }),
      ],
      partial: true,
      age: 60000,
    },
    now,
  );
  assert.deepEqual(
    data.events.map((e) => e.id),
    ['EQ-1', 'z'],
  );
  assert.deepEqual(data.events[1].countries, ['PA']);
  assert.equal(data.partial, true);
  assert.equal(data.fetched, now - 60000);
  assert.throws(() => parseAlerts({ events: [{ bad: true }] }));
  assert.throws(() => parseAlerts(null));
});

test('country alerts include affected and offshore events, worldwide only orange and red', () => {
  const events = [
    alert({ id: 'pa-green' }),
    alert({ id: 'pa-orange', level: 'orange', to: now - 5 * 86400000 }),
    alert({ id: 'offshore', countries: [], lat: 6, lng: -82 }),
    alert({ id: 'mx', countries: ['MX'], lat: 19, lng: -99, level: 'red', type: 'TC' }),
    alert({ id: 'old', current: false, to: now - 20 * 86400000 }),
  ];
  assert.deepEqual(
    // Events updated in the last 72 hours come first; an older Orange stays listed after them.
    alertsFor(events, 'PA', panama, now).map((e) => e.id),
    ['pa-green', 'offshore', 'pa-orange'],
  );
  assert.deepEqual(
    alertsFor(events, 'WORLD', panama, now).map((e) => e.id),
    ['mx', 'pa-orange'],
  );
  const chile = { south: -57, north: -16, west: -77, east: -65 };
  assert.deepEqual(alertsFor(events, 'CL', chile, now), []);
});

test('alert subjects keep proper names and localize, then shorten, affected countries', () => {
  const es = new Intl.DisplayNames(['es'], { type: 'region' });
  const name = (c: string) => es.of(c);
  assert.equal(alertSubject(alert(), name), 'Panamá');
  assert.equal(
    alertSubject(alert({ type: 'TC', name: 'Tropical Cyclone SIMON-26', countries: ['MX'] }), name),
    'Simon',
  );
  assert.equal(alertSubject(alert({ type: 'VO', name: 'Eruption Kanlaon' }), name), 'Kanlaon');
  assert.equal(
    alertSubject(alert({ type: 'DR', countries: ['GT', 'HN', 'SV', 'NI', 'CR'] }), name, 'es'),
    'Guatemala, Honduras, El Salvador y 2 más',
  );
  assert.equal(
    alertSubject(alert({ countries: [], name: 'Earthquake in Mid-Indian Ridge' }), name),
    'Mid-Indian Ridge',
  );
});

test('situation cards count only active GDACS events and never call silence safe', async () => {
  const { gdacsStatus, tsunamiStatus } = await import('../src/lib/hazards.ts');
  const tc = (over: Partial<HazardAlert>) => alert({ type: 'TC', ...over });
  const old = tc({ id: 'old', level: 'red', to: now - 10 * 86400000 });
  const active = tc({ id: 'now', level: 'orange', to: now - 3600000 });
  assert.deepEqual(gdacsStatus('cyclone', [old, active], false, now), {
    key: 'cyclone',
    state: 'listed',
    level: 'orange',
    count: 1,
    recent: 1,
    top: active,
  });
  assert.equal(gdacsStatus('cyclone', [old], false, now).state, 'none');
  assert.equal(gdacsStatus('cyclone', [old], false, now).recent, 1);
  assert.equal(gdacsStatus('flood', [], true, now).state, 'unknown');
  // Before the first answer the row says "checking", never "could not be checked".
  assert.equal(gdacsStatus('flood', null, false, now).state, 'pending');
  assert.equal(gdacsStatus('flood', null, true, now).state, 'unknown');
  assert.equal(tsunamiStatus(null, false, now).state, 'pending');
  assert.equal(tsunamiStatus(null, true, now).state, 'unknown');
  const bulletin = {
    product: 'WEPA40',
    issued: now - 3600000,
    eventId: '1',
    place: 'PANAMA',
    url: 'https://www.tsunami.gov/events/PHEB/x/WEPA40.txt',
    basin: 'Pacific',
    kind: 'threat' as const,
    evaluation: '',
  };
  const fresh = { bulletins: [bulletin], partial: false, fetched: now - 1000 };
  assert.equal(tsunamiStatus(fresh, false, now).level, 'review');
  const closed = { ...fresh, bulletins: [{ ...bulletin, kind: 'information' as const }] };
  assert.equal(tsunamiStatus(closed, false, now).state, 'none');
  assert.equal(tsunamiStatus({ ...closed, partial: true }, false, now).state, 'unknown');
  assert.equal(tsunamiStatus(closed, false, now + 10 * 60000).state, 'unknown');
});

test('NWS keeps actual alerts by kind and scopes mainland and territory queries', () => {
  const mainland = new URL(nwsUrl('US'));
  assert.equal(mainland.origin, 'https://api.weather.gov');
  const events = mainland.searchParams.get('event')!.split(',');
  assert.ok(events.includes('Tsunami Warning') && events.includes('Hurricane Warning'));
  assert.ok(events.includes('Flash Flood Warning') && !events.includes('Flood Advisory'));
  assert.equal(mainland.searchParams.get('area'), null);
  const pr = new URL(nwsUrl('PR'));
  assert.equal(pr.searchParams.get('area'), 'PR');
  assert.ok(pr.searchParams.get('event')!.split(',').includes('Flood Advisory'));
  const feature = (properties: Record<string, unknown>) => ({
    properties: {
      id: 'urn:1',
      status: 'Actual',
      event: 'Tsunami Warning',
      sent: '2026-10-13T08:00:00-04:00',
      expires: '2026-10-13T10:00:00-04:00',
      areaDesc: 'Coastal areas',
      headline: 'Tsunami Warning issued',
      senderName: 'NWS National Tsunami Warning Center',
      ...properties,
    },
  });
  const alerts = parseNws({
    type: 'FeatureCollection',
    features: [
      feature({}),
      feature({ id: 'urn:2', status: 'Exercise' }),
      feature({ id: 'urn:3', event: 'Winter Storm Warning' }),
      feature({ id: 'urn:4', sent: 'yesterday' }),
      feature({
        id: 'urn:5',
        event: 'Flash Flood Warning',
        sent: '2026-10-13T09:00:00-04:00',
        parameters: { flashFloodDamageThreat: ['CATASTROPHIC'] },
      }),
      feature({ id: 'urn:6', event: 'Hurricane Watch', sent: '2026-10-13T07:00:00-04:00' }),
    ],
  });
  assert.deepEqual(
    alerts.map((a) => [a.id, a.kind, a.emergency]),
    [
      ['urn:5', 'flood', true],
      ['urn:1', 'tsunami', false],
      ['urn:6', 'tropical', false],
    ],
  );
  assert.equal(alerts[1].sent, Date.parse('2026-10-13T12:00:00Z'));
  assert.throws(() => parseNws({ features: [] }));
  assert.ok(NWS_COUNTRIES.includes('PR') && !NWS_COUNTRIES.includes('PA'));
  assert.ok(!NWS_COUNTRIES.includes('UM'));
});

test('phone numbers are grouped for reading without changing the dialled digits', () => {
  assert.equal(displayPhone('+12025014444'), '+1 202-501-4444');
  assert.equal(displayPhone('+5073175000'), '+507 317-5000');
  assert.equal(displayPhone('+50766161112'), '+507 6616-1112');
  assert.equal(displayPhone('+34600000000'), '+34600000000');
  assert.equal(displayPhone('911'), '911');
});

test('reunification services are official, bilingual and scoped', () => {
  for (const link of familyLinks) {
    for (const url of link.url) assert.equal(new URL(url).protocol, 'https:');
    assert.ok(link.description.every((d) => d.trim()));
    assert.match(link.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.ok(familyLinksFor('PA').every((l) => l.id !== 'redcross-us'));
  assert.ok(familyLinksFor('US').some((l) => l.id === 'redcross-us'));
});

test('NHC links are rebuilt from the storm id and bin, and Spanish only when verified', async () => {
  const { advisoryUrl, graphicsUrl, parseStorms, position, windKmh } =
    await import('../src/lib/storms.ts');
  const raw = {
    id: 'ep202026',
    bin: 'EP5',
    name: 'Simon',
    classification: 'HU',
    intensityKt: 80,
    pressureMb: 977,
    lat: 20.4,
    lng: -107.2,
    advisory: '024a',
    issued: now,
    updated: now,
    spanish: true,
  };
  const { storms } = parseStorms({ storms: [raw, { ...raw, id: 'bad' }] }, now);
  assert.equal(storms.length, 1);
  const [s] = storms;
  assert.equal(advisoryUrl(s, 'es'), 'https://www.nhc.noaa.gov/text/MIATASEP5.shtml');
  assert.equal(advisoryUrl(s, 'en'), 'https://www.nhc.noaa.gov/text/MIATCPEP5.shtml');
  assert.equal(
    advisoryUrl({ ...s, spanish: false }, 'es'),
    'https://www.nhc.noaa.gov/text/MIATCPEP5.shtml',
  );
  assert.equal(
    advisoryUrl({ ...s, bin: 'CP1', spanish: true }, 'es'),
    'https://www.nhc.noaa.gov/text/HFOTCPCP1.shtml',
  );
  assert.equal(graphicsUrl(s), 'https://www.nhc.noaa.gov/graphics_ep5.shtml');
  assert.equal(windKmh(80), 150);
  assert.equal(position(s), '20.4°N 107.2°W');
  assert.deepEqual(parseStorms({ storms: [] }, now).storms, []);
  assert.throws(() => parseStorms({ storms: [{ id: 'bad' }] }, now));
});

test('national warnings must match the requested country and only those in force are active', async () => {
  const { activeWarnings, parseNational } = await import('../src/lib/national.ts');
  const warning = {
    id: 'urn:1',
    event: 'OLEAJE',
    headline: '',
    severity: 'Moderate',
    areas: 'Litoral del Pacífico',
    sent: now - 3600000,
    onset: null,
    expires: now + 3600000,
    url: 'https://www.imhpa.gob.pa/es/aviso-vigilancia/2',
  };
  const data = parseNational(
    {
      country: 'PA',
      agency: 'IMHPA',
      warnings: [
        warning,
        { ...warning, id: 'urn:2', severity: 'Severe', event: 'LLUVIAS' },
        { ...warning, id: 'urn:3', expires: now - 1 },
        { ...warning, id: 'urn:4', severity: 'Catastrophic' },
      ],
      partial: false,
      age: 0,
    },
    'PA',
    now,
  );
  assert.equal(data.warnings.length, 3);
  assert.deepEqual(
    activeWarnings(data.warnings, now).map((w) => w.id),
    ['urn:2', 'urn:1'],
  );
  assert.throws(() => parseNational({ ...data, country: 'CR' }, 'PA', now));
  // The adapter's previous copy during an outage: an empty list is not "no warnings".
  assert.equal(data.stale, false);
  const kept = parseNational(
    { country: 'PA', agency: 'IMHPA', warnings: [], stale: true, age: 0 },
    'PA',
    now,
  );
  assert.equal(kept.stale, true);
  const { nationalSignal } = await import('../src/lib/national.ts');
  assert.equal(nationalSignal({ ...kept, failed: false }), 'unconfirmed');
});

test('flood advice comes only from the warning text, and instructions lose their bullets', async () => {
  const { floodWarnings, instructionLines, parseNational } = await import('../src/lib/national.ts');
  const base = {
    id: 'a',
    event: 'LLUVIAS, TORMENTAS ELÉCTRICAS Y VIENTOS',
    headline: '',
    severity: 'Moderate',
    areas: 'Territorio nacional',
    sent: 1,
    onset: null,
    expires: 10,
    url: '',
  };
  const data = parseNational(
    {
      country: 'PA',
      agency: 'IMHPA',
      warnings: [
        {
          ...base,
          description: '*Precaución ante inundaciones en áreas urbanas y rurales.',
          instruction: '* No intente cruzar ríos, arroyos o canales.\n* Siga a las autoridades.',
          polygons: [
            [
              [7.3, -80.3],
              [9, -79.4],
              [9.6, -79.6],
              [7.3, -80.3],
            ],
            [[1, 2]],
            'bad',
          ],
        },
        { ...base, id: 'b', event: 'OLEAJE', description: 'Oleaje de 2 m en el Pacífico.' },
      ],
    },
    'PA',
    5,
  );
  assert.deepEqual(
    floodWarnings(data.warnings).map((w) => w.id),
    ['a'],
  );
  assert.equal(data.warnings[0].polygons.length, 1, 'short or malformed rings are dropped');
  assert.deepEqual(data.warnings[1].polygons, []);
  assert.deepEqual(instructionLines(data.warnings[0].instruction), [
    'No intente cruzar ríos, arroyos o canales.',
    'Siga a las autoridades.',
  ]);
  assert.deepEqual(floodWarnings([{ ...data.warnings[1], instruction: '' }]), []);
});

test('GDACS earthquake severity reads naturally and other text stays as published', async () => {
  const { readableSeverity } = await import('../src/lib/alerts.ts');
  assert.equal(
    readableSeverity('Magnitude 7.7M, Depth:12.647km', 'es'),
    'Magnitud 7.7, profundidad 13 km',
  );
  assert.equal(
    readableSeverity('Magnitude 7.7M, Depth:12.647km', 'en'),
    'Magnitude 7.7, depth 8 mi',
  );
  assert.equal(readableSeverity('Category 3 hurricane', 'es'), 'Category 3 hurricane');
});

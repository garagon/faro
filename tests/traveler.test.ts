import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInDue, checkInMessage, validCheckIn, type CheckIn } from '../src/lib/traveler.ts';
const row: CheckIn = {
  id: 'test',
  name: 'Alex',
  status: 'moving',
  place: 'Hotel de prueba',
  note: 'Con mi equipo',
  contact: 'Contacten a recepción',
  at: Date.UTC(2026, 9, 11, 15, 0),
  nextAt: Date.UTC(2026, 9, 11, 16, 0),
};
test('a check-in is overdue only at the agreed time, never inferred from missing updates', () => {
  assert.equal(checkInDue(row, row.nextAt! - 1), false);
  assert.equal(checkInDue(row, row.nextAt!), true);
  assert.equal(checkInDue({ ...row, nextAt: null }, row.nextAt!), false);
  assert.equal(checkInDue(undefined, row.at), false);
  assert.equal(row.status, 'moving');
});
test('shared message preserves original timestamp, explicit time zone and self-reported status', () => {
  const es = checkInMessage(row, 'es', 'America/Panama'),
    en = checkInMessage(row, 'en', 'America/Panama');
  assert.match(es, /Me estoy trasladando/);
  assert.match(en, /I'm on the move/);
  assert.match(es, /GMT-5/);
  assert.match(es, /10:00/);
  assert.match(es, /11:00/);
  assert.ok(es.includes(row.contact));
  assert.doesNotMatch(en, /Self-reported|live tracking/);
  assert.match(en, /Updated:/);
  assert.equal(checkInMessage(row, 'es', 'America/Panama'), es);
  assert.doesNotMatch(es, /maps|latitude|longitude|https/);
});
test('stored check-ins reject corrupt states and impossible deadlines', () => {
  assert.ok(validCheckIn(row));
  for (const bad of [
    null,
    {},
    { ...row, status: 'rescued' },
    { ...row, at: NaN },
    { ...row, at: 1e20 },
    { ...row, nextAt: 1e20 },
    { ...row, nextAt: row.at - 1 },
    { ...row, place: 5 },
  ])
    assert.equal(validCheckIn(bad), false);
  assert.ok(validCheckIn({ ...row, nextAt: null }));
});

test('blocked storage still prepares a new message without changing saved history', async () => {
  const { prepareCheckIn } = await import('../src/lib/prepareCheckIn.ts');
  const previous = { ...row, id: 'previous', at: row.at - 60000 };
  const history = [previous];
  for (const storage of [
    {
      setItem() {
        throw Error('Quota');
      },
      getItem() {
        return null;
      },
    },
    {
      setItem() {},
      getItem() {
        return JSON.stringify(history);
      },
    },
  ]) {
    const result = prepareCheckIn(row, history, storage);
    assert.equal(result.persisted, false);
    assert.deepEqual(result.rows, [previous]);
    assert.equal(result.message, row);
    assert.equal(history.length, 1);
    assert.match(checkInMessage(result.message, 'es', 'America/Panama'), /10:00/);
  }
});
test('prepared message saves locally when storage is available and bounds history', async () => {
  const { prepareCheckIn } = await import('../src/lib/prepareCheckIn.ts');
  let saved = '';
  const result = prepareCheckIn(
    row,
    Array.from({ length: 10 }, (_, i) => ({ ...row, id: `old-${i}` })),
    {
      setItem(_key, value) {
        saved = value;
      },
      getItem() {
        return saved;
      },
    },
  );
  assert.equal(result.persisted, true);
  assert.equal(result.rows.length, 10);
  assert.equal(JSON.parse(saved)[0].id, row.id);
  assert.equal(result.message, row);
  assert.throws(() => prepareCheckIn({ ...row, status: 'invalid' as CheckIn['status'] }, []));
});

test('only a prepared, unchanged and recent message can be shared', async () => {
  const { canShareCheckIn } = await import('../src/lib/traveler.ts');
  assert.equal(canShareCheckIn(null, false, row.at), false);
  assert.equal(canShareCheckIn(row, true, row.at), false);
  assert.equal(canShareCheckIn(row, false, row.at - 1), false);
  assert.equal(canShareCheckIn(row, false, row.at + 14 * 60000), true);
  assert.equal(canShareCheckIn(row, false, row.at + 15 * 60000), false);
  assert.equal(canShareCheckIn({ ...row, nextAt: row.at + 60000 }, false, row.at + 60000), false);
});

test('contextual updates explain location, reachability and the next check-in in both languages', () => {
  const contextual: CheckIn = {
    ...row,
    context: 'earthquake',
    companions: 'mi equipo',
    destination: 'Punto de prueba',
    connection: 'battery',
  };
  const es = checkInMessage(contextual, 'es', 'America/Panama');
  const en = checkInMessage(contextual, 'en', 'America/Panama');
  assert.match(es, /por el sismo/);
  assert.match(es, /Me dirijo a Punto de prueba/);
  assert.match(es, /poca batería/);
  assert.match(es, /confirmen que recibieron/);
  assert.match(en, /about the earthquake/);
  assert.match(en, /heading to Punto de prueba/);
  assert.match(en, /battery is low/);
  assert.match(en, /Please let me know/);
  assert.match(en, /GMT-5/);
});

test('changing status cannot leak an earlier destination or help request into the message', () => {
  const contextual: CheckIn = {
    ...row,
    context: 'update',
    status: 'ok',
    destination: 'Private old destination',
    needs: 'Private old help request',
  };
  for (const lang of ['es', 'en'] as const) {
    const message = checkInMessage(contextual, lang);
    assert.doesNotMatch(message, /Private old/);
    assert.doesNotMatch(message, /sismo|earthquake|evacuation/);
  }
  assert.match(checkInMessage({ ...contextual, status: 'help' }, 'es'), /Private old help request/);
});

test('only an explicitly attached event is included and its occurrence time is preserved', () => {
  const event = {
    source: 'IGC' as const,
    place: 'Lugar de prueba',
    mag: 4.2,
    time: row.at - 3600000,
  };
  const attached: CheckIn = { ...row, context: 'earthquake', event };
  const es = checkInMessage(attached, 'es', 'America/Panama');
  assert.match(es, /Reporte de referencia: IGC · M 4.2 · Lugar de prueba/);
  assert.match(es, /09:00/);
  assert.match(es, /no una medida de cómo me afectó/);
  assert.doesNotMatch(
    checkInMessage({ ...attached, event: null }, 'es'),
    /IGC|M 4.2|Lugar de prueba/,
  );
  assert.match(
    checkInMessage({ ...attached, event: { ...event, mag: null } }, 'en'),
    /magnitude not reported/,
  );
});

test('new optional fields preserve old history while rejecting corrupt context and references', () => {
  assert.ok(validCheckIn(row));
  const contextual: CheckIn = {
    ...row,
    context: 'evacuation',
    connection: 'limited',
    needs: 'Contact insurance',
    companions: 'a colleague',
    destination: 'Meeting point',
  };
  assert.ok(validCheckIn(contextual));
  const event = { source: 'USGS', place: 'Test location', mag: 4, time: row.at };
  for (const invalid of [
    { context: 'automatic-rescue' },
    { connection: 'offline-tracking' },
    { companions: 4 },
    { needs: 'x'.repeat(1001) },
    { destination: {} },
    { event: 'unknown' },
    { event: { ...event, source: 'unverified' } },
    { event: { ...event, time: NaN } },
    { event: { ...event, mag: '4' } },
    { event: { ...event, place: 4 } },
  ])
    assert.equal(validCheckIn({ ...row, ...invalid }), false);
});

test('a promised check-in across midnight includes its date rather than an ambiguous time alone', () => {
  const late = { ...row, at: Date.UTC(2026, 9, 12, 4, 50), nextAt: Date.UTC(2026, 9, 12, 5, 20) };
  const es = checkInMessage(late, 'es', 'America/Panama');
  assert.match(es, /a más tardar a las 00:20 GMT-5 \(12 oct 2026\)/);
  const sameDay = checkInMessage(row, 'es', 'America/Panama');
  assert.match(sameDay, /a más tardar a las 11:00 GMT-5\./);
});

test('a message contains contact channels only when explicitly included in its record', () => {
  const message = checkInMessage(row, 'es');
  assert.doesNotMatch(message, /Mi teléfono|Mi correo/);
  const selected = { ...row, phone: '+1 202 555 0123', email: 'alex@example.com' };
  assert.ok(validCheckIn(selected));
  assert.match(checkInMessage(selected, 'es'), /Mi teléfono: \+1 202 555 0123/);
  assert.match(checkInMessage(selected, 'en'), /My email: alex@example.com/);
  assert.equal(validCheckIn({ ...selected, phone: {} }), false);
});

test('help templates are explicit, compact and do not duplicate sentence endings', async () => {
  const { helpTemplates } = await import('../src/lib/messageTemplates.ts');
  for (const template of helpTemplates)
    for (const lang of ['es', 'en'] as const) {
      const needs = template.text[lang === 'es' ? 0 : 1];
      const message = checkInMessage(
        { ...row, context: 'earthquake', status: 'help', needs, place: 'Hotel de prueba.' },
        lang,
        'America/Panama',
      );
      assert(message.includes(needs));
      assert.doesNotMatch(message, /\.\.|Necesito: Necesito|I need: I need/);
      assert.match(message, lang === 'es' ? /respondan para coordinar/ : /reply so we can arrange/);
      assert(message.split('\n\n')[0].includes(lang === 'es' ? 'sismo' : 'earthquake'));
      assert.doesNotMatch(message, /GPS|https|rescate solicitado|rescue dispatched/);
    }
});
test('an earlier event is excluded when the message is no longer about the earthquake', () => {
  const message = checkInMessage(
    {
      ...row,
      context: 'update',
      event: { source: 'USGS', place: 'Earlier event', mag: 6, time: row.at },
    },
    'en',
  );
  assert.doesNotMatch(message, /Earlier event|USGS|Reference report/);
});

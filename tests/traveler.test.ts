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
